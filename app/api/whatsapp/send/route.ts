// app/api/whatsapp/send/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTextMessage } from '@/lib/whatsapp';
import { errorResponse } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { to, message, businessId } = await req.json();

  if (!to || !message || !businessId) {
    return errorResponse('Missing required fields', 'MISSING_FIELDS');
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('whatsapp_phone_id, whatsapp_access_token, owner_email')
    .eq('id', businessId)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const result = await sendTextMessage({
    phoneNumberId: business.whatsapp_phone_id,
    accessToken: business.whatsapp_access_token,
    to,
    message,
  });

  if (!result.success) {
    return errorResponse('Failed to send message', 'SEND_FAILED');
  }

  // Save to conversations
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('business_id', businessId)
    .eq('phone', to.replace(/\D/g, ''))
    .single();

  await supabaseAdmin.from('conversations').insert({
    business_id: businessId,
    customer_id: customer?.id || null,
    message_text: message,
    direction: 'outbound',
    sender: 'owner',
    wa_message_id: result.messageId,
    is_ai_handled: false,
  });

  return Response.json({ success: true, messageId: result.messageId });
}
