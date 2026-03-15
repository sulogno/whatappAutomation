// lib/ai-context.ts — Build AI system prompt from business data

import type { Business, InventoryItem } from "@/types";
import { getSegmentConfig, buildSegmentPrompt } from "./segment";

export async function buildSystemPromptForBusiness(
  business: Business,
  inventory: InventoryItem[],
): Promise<string> {
  const config = await getSegmentConfig(business.business_type);
  if (config) {
    return buildSegmentPrompt(config, business, inventory);
  }
  return buildSystemPrompt(business, inventory);
}

// Build compressed system prompt (target <500 tokens)
export function buildSystemPrompt(
  business: Business,
  inventory: InventoryItem[],
): string {
  const availableItems = inventory.filter((i) => i.is_available);
  const unavailableItems = inventory.filter((i) => !i.is_available);

  const menuLines = availableItems
    .map(
      (i) => `${i.item_name}: ₹${i.price || "?"}${i.unit ? `/${i.unit}` : ""}`,
    )
    .join(", ");

  const unavailableLines =
    unavailableItems.length > 0
      ? ` | UNAVAILABLE: ${unavailableItems.map((i) => i.item_name).join(", ")}`
      : "";

  const closedDays =
    business.closed_days.length > 0
      ? `Closed on: ${business.closed_days.join(", ")}.`
      : "Open all days.";

  const isOpen = business.is_open;
  const langInstruction =
    {
      hindi: "Always reply in Hindi.",
      english: "Always reply in English.",
      hinglish:
        "Reply in Hinglish (mix of Hindi and English). Match the customer's language naturally.",
    }[business.language] || "Reply in Hinglish.";

  return `You are an AI assistant for ${business.name}, a ${business.business_type} in India.
${langInstruction}

Business: ${business.ai_context}

Menu/Services: ${menuLines || "Ask owner for details"}${unavailableLines}

Timing: ${business.opening_time} to ${business.closing_time}. ${closedDays}
Status: ${isOpen ? "OPEN NOW ✅" : "CLOSED ❌"}

Rules:
- Keep replies SHORT (2-4 lines max) — this is WhatsApp
- For orders: confirm items + total amount clearly
- For bookings: confirm slot with exact date and time
- If unsure: say "Main owner se confirm karke batata hoon" 
- Never make up prices or availability
- Be warm and helpful like a local shop owner
- End with 🙏 for formal or 😊 for casual`;
}

// Compress raw business info into AI-ready context (target <200 tokens)
export function compressBusinessInfo(rawInfo: string): string {
  // Remove filler words and compress
  const compressed = rawInfo
    .replace(
      /\b(the|a|an|is|are|was|were|have|has|had|do|does|did|will|would|could|should)\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  // Keep under 200 tokens (roughly 800 characters)
  if (compressed.length > 800) {
    return compressed.slice(0, 797) + "...";
  }

  return compressed;
}

// Build AI context string for a new business during onboarding
export function buildInitialContext(params: {
  name: string;
  businessType: string;
  description: string;
  location?: string;
}): string {
  const parts = [
    `Name: ${params.name}`,
    `Type: ${params.businessType}`,
    `Description: ${params.description}`,
  ];

  if (params.location) {
    parts.push(`Location: ${params.location}`);
  }

  return parts.join(" | ");
}
