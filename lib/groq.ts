// lib/groq.ts — AI client using Google Gemini (FREE — no credit card needed)
// Groq requires billing. Gemini Flash is 100% free up to 1,500 requests/day.
// Get free API key at: https://aistudio.google.com/apikey

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { OrderItem } from '@/types';

const MODEL = 'gemini-1.5-flash'; // Free tier: 1,500 req/day, 1M tokens/min

let genAI: GoogleGenerativeAI | null = null;

function getAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return genAI;
}

// Generate AI reply for customer WhatsApp message
export async function generateReply(params: {
  customerMessage: string;
  businessContext: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  language: string;
}): Promise<string> {
  const { customerMessage, businessContext, conversationHistory } = params;

  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: MODEL,
      systemInstruction: businessContext,
    });

    // Build chat history (last 5 messages only — saves tokens)
    const recentHistory = conversationHistory.slice(-5).map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: recentHistory,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(customerMessage);
    return result.response.text() || 'Main samajh nahi paya, please dobara likhein 🙏';
  } catch (error) {
    console.error('[Gemini] generateReply error:', error);
    return 'Main samajh nahi paya, please dobara likhein 🙏';
  }
}

// Classify message intent
export async function classifyIntent(message: string): Promise<string> {
  const validIntents = [
    'order', 'booking', 'query', 'complaint',
    'delivery_status', 'cancel', 'greeting', 'other',
  ];

  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: MODEL,
      systemInstruction: `Classify the customer message intent. Reply with ONLY one word from this list (nothing else): ${validIntents.join(', ')}`,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 10, temperature: 0.1 },
    });

    const intent = result.response.text().trim().toLowerCase().replace(/[^a-z_]/g, '');
    return validIntents.includes(intent) ? intent : 'other';
  } catch (error) {
    console.error('[Gemini] classifyIntent error:', error);
    return 'other';
  }
}

// Extract order items from natural language message
export async function extractOrderItems(
  message: string,
  inventory: Array<{ item_name: string; price: number; is_available: boolean }>
): Promise<{ items: OrderItem[]; totalAmount: number }> {
  const inventoryList = inventory
    .filter((i) => i.is_available)
    .map((i) => `${i.item_name}: ₹${i.price}`)
    .join(', ');

  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: MODEL,
      systemInstruction: `Extract order items from the customer message. Available menu: ${inventoryList}. 
Reply ONLY with valid JSON (no markdown, no backticks): {"items": [{"name": "...", "qty": 1, "price": 0}], "totalAmount": 0}
Match menu items exactly. If item not found, skip it. Calculate total correctly.`,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.1 },
    });

    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const items: OrderItem[] = parsed.items || [];
    const totalAmount = items.reduce((sum: number, item: OrderItem) => sum + (item.price * item.qty), 0);

    return { items, totalAmount };
  } catch (error) {
    console.error('[Gemini] extractOrderItems error:', error);
    return { items: [], totalAmount: 0 };
  }
}

// Generate onboarding response during business setup wizard
export async function generateOnboardingResponse(
  businessInfo: string,
  step: number
): Promise<string> {
  const stepPrompts: Record<number, string> = {
    1: 'You are helping set up an Indian small business on ReplyFast WhatsApp AI. Ask for: business name and type (restaurant/salon/clinic/kirana store/tutor/freelancer/other). Be friendly and brief in Hinglish.',
    2: 'Ask the business owner to describe what they sell or services they offer with prices. Example: "Lunch Thali ₹80, Dinner Thali ₹70". Be brief.',
    3: 'Ask about opening/closing time and closed days. Also ask preferred language: Hindi, English, or Hinglish.',
    4: 'Ask them to connect WhatsApp Business API. They need Phone Number ID and Access Token from Meta Business Suite (business.facebook.com). Keep instructions simple.',
    5: 'Ask if they offer delivery (add delivery boys WhatsApp numbers) and if they need appointment/queue management.',
  };

  try {
    const ai = getAI();
    const model = ai.getGenerativeModel({
      model: MODEL,
      systemInstruction: stepPrompts[step] || stepPrompts[1],
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: businessInfo || 'Start' }] }],
      generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
    });

    return result.response.text() || 'Please provide your business details.';
  } catch (error) {
    console.error('[Gemini] generateOnboardingResponse error:', error);
    return 'Please provide your business details to continue setup.';
  }
}
