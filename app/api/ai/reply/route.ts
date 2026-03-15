// app/api/ai/reply/route.ts

import { NextRequest } from 'next/server';
import { generateReply } from '@/lib/groq';
import { buildSystemPrompt } from '@/lib/ai-context';
import { supabaseAdmin } from '@/lib/supabase';
import { errorResponse } from '@/lib/utils';
import type { InventoryItem } from '@/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { businessId, customerMessage, conversationHistory } = body;

  if (!businessId || !customerMessage) {
    return errorResponse('Missing required fields', 'MISSING_FIELDS');
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select()
    .eq('id', businessId)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  const { data: inventory } = await supabaseAdmin
    .from('inventory')
    .select()
    .eq('business_id', businessId)
    .eq('is_available', true)
    .limit(50);

  const systemPrompt = buildSystemPrompt(business, (inventory || []) as InventoryItem[]);

  const reply = await generateReply({
    customerMessage,
    businessContext: systemPrompt,
    conversationHistory: conversationHistory || [],
    language: business.language,
  });

  return Response.json({ reply });
}
