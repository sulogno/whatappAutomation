// app/api/bookings/slots/route.ts

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateTimeSlots, errorResponse } from '@/lib/utils';
import type { TimeSlot } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const date = searchParams.get('date');

  if (!businessId || !date) {
    return errorResponse('businessId and date are required', 'MISSING_PARAMS');
  }

  // Get day of week (0=Sunday)
  const dayOfWeek = new Date(date).getDay();

  // Get slot config for this day
  const { data: slotConfig } = await supabaseAdmin
    .from('slot_config')
    .select()
    .eq('business_id', businessId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .single();

  if (!slotConfig) {
    return Response.json({ slots: [], message: 'No slots configured for this day' });
  }

  // Generate all possible slots
  const allTimes = generateTimeSlots(
    slotConfig.start_time,
    slotConfig.end_time,
    slotConfig.slot_duration
  );

  // Get existing bookings for this date
  const { data: existingBookings } = await supabaseAdmin
    .from('bookings')
    .select('slot_time, customer_name')
    .eq('business_id', businessId)
    .eq('slot_date', date)
    .in('status', ['confirmed']);

  const bookedSlots = new Map<string, string>();
  existingBookings?.forEach((b) => {
    bookedSlots.set(b.slot_time, b.customer_name || 'Booked');
  });

  // Build slot availability
  const slots: TimeSlot[] = allTimes.map((time) => {
    const isBooked = bookedSlots.has(time);
    const slot: TimeSlot = {
      time,
      isAvailable: !isBooked,
    };
    if (isBooked) {
      slot.bookedBy = bookedSlots.get(time);
    }
    return slot;
  });

  return Response.json({ slots });
}
