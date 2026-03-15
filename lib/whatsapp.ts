// lib/whatsapp.ts — WhatsApp Cloud API functions

import type {
  ParsedWhatsAppMessage,
  WhatsAppWebhookBody,
  WhatsAppSendMessagePayload,
} from '@/types/whatsapp';
import type { Order } from '@/types';

const WA_API_VERSION = 'v18.0';
const WA_BASE_URL = `https://graph.facebook.com/${WA_API_VERSION}`;

// Send a text message via WhatsApp Cloud API
export async function sendTextMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  message: string;
}): Promise<{ success: boolean; messageId: string }> {
  const { phoneNumberId, accessToken, to, message } = params;

  try {
    const payload: WhatsAppSendMessagePayload = {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''), // ensure no non-digits
      type: 'text',
      text: {
        body: message,
        preview_url: false,
      },
    };

    const response = await fetch(`${WA_BASE_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp] Send failed:', errorData);
      return { success: false, messageId: '' };
    }

    const data = await response.json();
    const messageId = data.messages?.[0]?.id || '';
    return { success: true, messageId };
  } catch (error) {
    console.error('[WhatsApp] sendTextMessage error:', error);
    return { success: false, messageId: '' };
  }
}

// Send a template message
export async function sendTemplateMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  components: unknown[];
}): Promise<{ success: boolean }> {
  const { phoneNumberId, accessToken, to, templateName, components } = params;

  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_IN' },
        components,
      },
    };

    const response = await fetch(`${WA_BASE_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    return { success: response.ok };
  } catch (error) {
    console.error('[WhatsApp] sendTemplateMessage error:', error);
    return { success: false };
  }
}

// Mark an incoming message as read (blue ticks)
export async function markAsRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<void> {
  try {
    await fetch(`${WA_BASE_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
  } catch (error) {
    console.error('[WhatsApp] markAsRead error:', error);
  }
}

// Verify webhook from Meta
export function verifyWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && token === verifyToken) {
    return challenge;
  }
  return null;
}

// Parse incoming WhatsApp webhook payload
export function parseIncomingMessage(
  body: WhatsAppWebhookBody
): ParsedWhatsAppMessage | null {
  try {
    const entry = body.entry?.[0];
    if (!entry) return null;

    const change = entry.changes?.[0];
    if (!change) return null;

    const value = change.value;
    if (!value.messages || value.messages.length === 0) return null;

    const message = value.messages[0];
    if (message.type !== 'text') return null;

    const phoneNumberId = value.metadata.phone_number_id;
    const from = message.from;
    const messageText = message.text?.body || '';
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp);

    const contact = value.contacts?.[0];
    const senderName = contact?.profile?.name;

    return {
      from,
      messageText,
      messageId,
      phoneNumberId,
      timestamp,
      senderName,
    };
  } catch (error) {
    console.error('[WhatsApp] parseIncomingMessage error:', error);
    return null;
  }
}

// Send notification to delivery boy
export async function sendDeliveryBoyNotification(params: {
  phoneNumberId: string;
  accessToken: string;
  deliveryBoyPhone: string;
  order: Order;
}): Promise<void> {
  const { phoneNumberId, accessToken, deliveryBoyPhone, order } = params;

  const itemsList = order.items
    .map((item) => `• ${item.name} x${item.qty} — ₹${item.price * item.qty}`)
    .join('\n');

  const message =
    `🛵 *New Delivery Order #${order.order_number}*\n\n` +
    `${itemsList}\n\n` +
    `*Total: ₹${order.total_amount}*\n` +
    `Payment: ${order.payment_method.toUpperCase()}\n` +
    (order.delivery_address ? `📍 Deliver to: ${order.delivery_address}\n` : '') +
    (order.special_instructions ? `📝 Note: ${order.special_instructions}\n` : '') +
    `\nReply *ACCEPT* to take this order.\n` +
    `(You have 2 minutes to accept)`;

  await sendTextMessage({
    phoneNumberId,
    accessToken,
    to: deliveryBoyPhone,
    message,
  });
}

// Send queue notification to customer
export async function sendQueueNotification(params: {
  phoneNumberId: string;
  accessToken: string;
  customerPhone: string;
  tokenNumber: number;
  estimatedWait: number;
  businessName: string;
  type: 'assigned' | 'called' | 'arrived' | 'done';
}): Promise<void> {
  const { phoneNumberId, accessToken, customerPhone, tokenNumber, estimatedWait, businessName, type } = params;

  const messages: Record<string, string> = {
    assigned: `✅ *${businessName}*\n\nAapka token number *#${tokenNumber}* hai.\nEstimated wait: ~${estimatedWait} minutes 🙏`,
    called: `🔔 *${businessName}*\n\nToken #${tokenNumber} — Aapki baari 10 minute mein aayegi. Please ready rahein 😊`,
    arrived: `🎉 *${businessName}*\n\nToken #${tokenNumber} — *Aapki baari aa gayi!* Please counter par aaiye 🙏`,
    done: `✅ Thank you for visiting *${businessName}*! Dobara aayiye 🙏`,
  };

  await sendTextMessage({
    phoneNumberId,
    accessToken,
    to: customerPhone,
    message: messages[type],
  });
}

// Send booking confirmation
export async function sendBookingConfirmation(params: {
  phoneNumberId: string;
  accessToken: string;
  customerPhone: string;
  customerName: string;
  serviceType: string;
  slotDate: string;
  slotTime: string;
  businessName: string;
}): Promise<void> {
  const { phoneNumberId, accessToken, customerPhone, customerName, serviceType, slotDate, slotTime, businessName } = params;

  const formattedDate = new Date(slotDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const [hours, minutes] = slotTime.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

  const message =
    `✅ *Booking Confirmed!*\n\n` +
    `Hi ${customerName} 👋\n\n` +
    `*${businessName}*\n` +
    `Service: ${serviceType}\n` +
    `📅 Date: ${formattedDate}\n` +
    `⏰ Time: ${formattedTime}\n\n` +
    `Aapka slot confirm ho gaya! Hum aapka intezaar karenge 🙏\n\n` +
    `To cancel, reply *CANCEL*`;

  await sendTextMessage({
    phoneNumberId,
    accessToken,
    to: customerPhone,
    message,
  });
}
