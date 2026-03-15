export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// app/api/bookings/[id]/route.ts

import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTextMessage } from '@/lib/whatsapp';
import { errorResponse } from '@/lib/utils';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const body = await req.json();

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*, business:businesses(*)')
    .eq('id', params.id)
    .single();

  if (!booking) return errorResponse('Booking not found', 'NOT_FOUND', 404);

  const business = booking.business;
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { data: updated, error } = await supabaseAdmin
    .from('bookings')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return errorResponse(error.message, 'DB_ERROR', 500);

  // Notify customer if cancelled
  if (body.status === 'cancelled' && booking.customer_phone) {
    await sendTextMessage({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      to: booking.customer_phone,
      message: `❌ *Booking Cancelled*\n\nAapka ${booking.service_type || 'appointment'} ${booking.slot_date} ${booking.slot_time} baje cancel ho gaya hai.\n\nKisi bhi pareshani ke liye humse contact karein 🙏`,
    });
  }

  return Response.json({ booking: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('business:businesses(owner_email, id)')
    .eq('id', params.id)
    .single();

  if (!booking) return errorResponse('Not found', 'NOT_FOUND', 404);

  const business = booking.business as { owner_email: string };
  if (business.owner_email !== session.user.email) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  await supabaseAdmin.from('bookings').delete().eq('id', params.id);

  return Response.json({ success: true });
}