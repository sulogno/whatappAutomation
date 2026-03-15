// app/api/whatsapp/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  verifyWebhook,
  parseIncomingMessage,
  markAsRead,
  sendTextMessage,
} from "@/lib/whatsapp";
import { checkCache, isDeliveryCommand } from "@/lib/cache";
import { classifyIntent, generateReply, extractOrderItems } from "@/lib/groq";
import { buildSystemPromptForBusiness } from "@/lib/ai-context";
import { handleDeliveryReply } from "@/lib/delivery";
import { addToQueue } from "@/lib/queue";
import {
  triggerPusherEvent,
  businessChannel,
  PUSHER_EVENTS,
} from "@/lib/pusher";
import { isBusinessOpen, normalizePhone } from "@/lib/utils";
import { getSegmentConfig, isFeatureVisible } from "@/lib/segment";
import type { WhatsAppWebhookBody } from "@/types/whatsapp";
import type { Business, InventoryItem, Conversation } from "@/types";

// Simple in-memory rate limiter (per phone number)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= 100) return false;
  entry.count++;
  return true;
}

// GET — webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode") || "";
  const token = searchParams.get("hub.verify_token") || "";
  const challenge = searchParams.get("hub.challenge") || "";

  const result = verifyWebhook(mode, token, challenge);
  if (result) {
    return new NextResponse(result, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — receive messages
export async function POST(req: NextRequest) {
  // Always return 200 immediately (WhatsApp requirement)
  const body = (await req.json()) as WhatsAppWebhookBody;

  // Process asynchronously
  processWebhook(body).catch((err) =>
    console.error("[Webhook] Processing error:", err),
  );

  return new NextResponse("OK", { status: 200 });
}

async function processWebhook(body: WhatsAppWebhookBody) {
  const parsed = parseIncomingMessage(body);
  if (!parsed) return;

  const { from, messageText, messageId, phoneNumberId } = parsed;

  // Rate limit check
  if (!checkRateLimit(from)) {
    console.warn(`[Webhook] Rate limit exceeded for ${from}`);
    return;
  }

  // Find business by phone number ID
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select()
    .eq("whatsapp_phone_id", phoneNumberId)
    .eq("is_active", true)
    .single();

  if (!business) {
    console.error(
      `[Webhook] No business found for phoneNumberId: ${phoneNumberId}`,
    );
    return;
  }

  const b = business as Business;
  const segmentConfig = await getSegmentConfig(b.business_type);

  // Mark message as read
  await markAsRead(phoneNumberId, b.whatsapp_access_token, messageId);

  // Check for duplicate message (idempotency)
  const { data: existing } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("wa_message_id", messageId)
    .single();

  if (existing) {
    console.log(`[Webhook] Duplicate message ${messageId}, skipping`);
    return;
  }

  // Check if message is from a delivery boy
  if (isDeliveryCommand(messageText)) {
    const handled = await handleDeliveryReply(from, messageText, b.id);
    if (handled) return;
  }

  // Find or create customer
  const phone = normalizePhone(from);
  let { data: customer } = await supabaseAdmin
    .from("customers")
    .select()
    .eq("business_id", b.id)
    .eq("phone", phone)
    .single();

  if (!customer) {
    const { data: newCustomer } = await supabaseAdmin
      .from("customers")
      .insert({
        business_id: b.id,
        phone,
        name: parsed.senderName || null,
        last_interaction: new Date().toISOString(),
      })
      .select()
      .single();
    customer = newCustomer;
  } else {
    await supabaseAdmin
      .from("customers")
      .update({ last_interaction: new Date().toISOString() })
      .eq("id", customer.id);
  }

  // Save incoming message
  await supabaseAdmin.from("conversations").insert({
    business_id: b.id,
    customer_id: customer?.id,
    message_text: messageText,
    direction: "inbound",
    sender: "customer",
    wa_message_id: messageId,
    is_ai_handled: true,
  });

  // Trigger new-message event for dashboard
  await triggerPusherEvent(businessChannel(b.id), PUSHER_EVENTS.NEW_MESSAGE, {
    from: phone,
    message: messageText,
    customerName: customer?.name,
  });

  // Check if business is open
  if (!isBusinessOpen(b)) {
    const closedMsg = `Namaste! 🙏 *${b.name}* abhi band hai.\n\nHum kal ${b.opening_time} se available honge. Tab tak ke liye shukriya! 😊`;
    await sendAndSave(b, customer?.id, closedMsg, phone, "closed");
    return;
  }

  // Check message limit
  if (b.monthly_message_count >= b.monthly_message_limit) {
    const limitMsg = `Hum abhi aapki help nahi kar pa rahe. Baad mein try karein. 🙏`;
    await sendAndSave(b, customer?.id, limitMsg, phone, "limit_exceeded");
    return;
  }

  // Check keyword cache (saves 60-70% of API calls)
  const cachedReply = checkCache(messageText, b, segmentConfig);
  if (cachedReply) {
    await sendAndSave(b, customer?.id, cachedReply, phone, "cached");
    await incrementMessageCount(b.id);
    return;
  }

  // Classify intent
  const intent = await classifyIntent(messageText);

  // Get conversation history (last 5 messages)
  const { data: history } = await supabaseAdmin
    .from("conversations")
    .select("message_text, direction")
    .eq("business_id", b.id)
    .eq("customer_id", customer?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const conversationHistory = (history || [])
    .reverse()
    .map((msg: Pick<Conversation, "message_text" | "direction">) => ({
      role:
        msg.direction === "inbound"
          ? ("user" as const)
          : ("assistant" as const),
      content: msg.message_text,
    }));

  // Get inventory for context
  const { data: inventory } = await supabaseAdmin
    .from("inventory")
    .select()
    .eq("business_id", b.id)
    .eq("is_available", true)
    .limit(50);

  // Build system prompt and generate reply
  const systemPrompt = await buildSystemPromptForBusiness(
    b,
    (inventory || []) as InventoryItem[],
  );
  const aiReply = await generateReply({
    customerMessage: messageText,
    businessContext: systemPrompt,
    conversationHistory,
    language: b.language,
  });

  // Send AI reply
  await sendAndSave(b, customer?.id, aiReply, phone, intent);
  await incrementMessageCount(b.id);

  // Handle special intents
  if (
    intent === "order" &&
    isFeatureVisible("orders", segmentConfig) &&
    inventory &&
    inventory.length > 0
  ) {
    const extracted = await extractOrderItems(
      messageText,
      inventory as InventoryItem[],
    );
    if (extracted.items.length > 0) {
      // Create order
      await supabaseAdmin.from("orders").insert({
        business_id: b.id,
        customer_id: customer?.id,
        items: extracted.items,
        total_amount: extracted.totalAmount,
        status: "confirmed",
        delivery_type: "pickup",
      });

      await triggerPusherEvent(businessChannel(b.id), PUSHER_EVENTS.NEW_ORDER, {
        customerName: customer?.name || phone,
        totalAmount: extracted.totalAmount,
      });
    }
  }
}

// Helper: send message and save to DB
async function sendAndSave(
  business: Business,
  customerId: string | undefined,
  message: string,
  customerPhone: string,
  intent: string,
) {
  await sendTextMessage({
    phoneNumberId: business.whatsapp_phone_id,
    accessToken: business.whatsapp_access_token,
    to: customerPhone,
    message,
  });

  await supabaseAdmin.from("conversations").insert({
    business_id: business.id,
    customer_id: customerId || null,
    message_text: message,
    direction: "outbound",
    sender: "ai",
    intent,
    is_ai_handled: true,
  });
}

// Increment monthly message count (atomic — avoids race conditions)
async function incrementMessageCount(businessId: string) {
  await supabaseAdmin.rpc("increment_message_count", {
    business_id: businessId,
  });
}
