// app/api/queue/walkin/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { addToQueue } from '@/lib/queue';
import { sendQueueNotification } from '@/lib/whatsapp';
import { errorResponse, normalizePhone } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const body = await req.json();
  const { customerName, serviceType, customerPhone } = body;

  if (!customerName) return errorResponse('Customer name required', 'MISSING_FIELDS');

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select()
    .eq('owner_email', session.user.email)
    .single();

  if (!business) return errorResponse('Business not found', 'NOT_FOUND', 404);

  // Find or create customer if phone provided
  let customerId: string | undefined;
  const phone = customerPhone ? normalizePhone(customerPhone) : undefined;

  if (phone) {
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .upsert(
        { business_id: business.id, phone, name: customerName },
        { onConflict: 'business_id,phone' }
      )
      .select()
      .single();
    customerId = customer?.id;
  }

  const entry = await addToQueue({
    businessId: business.id,
    customerPhone: phone,
    customerName,
    serviceType,
    entryType: 'walkin',
    customerId,
  });

  // Send WhatsApp notification if phone provided
  if (phone) {
    await sendQueueNotification({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      customerPhone: phone,
      tokenNumber: entry.token_number,
      estimatedWait: entry.estimated_wait || 0,
      businessName: business.name,
      type: 'assigned',
    });
  }

  return Response.json({
    entry,
    tokenNumber: entry.token_number,
    estimatedWait: entry.estimated_wait,
  }, { status: 201 });
}
