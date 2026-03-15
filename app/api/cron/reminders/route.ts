// app/api/cron/reminders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTextMessage } from '@/lib/whatsapp';
import { formatTime } from '@/lib/utils';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Find bookings where reminder should be sent (60-90 minutes from now)
  const in60 = new Date(now.getTime() + 60 * 60000);
  const in90 = new Date(now.getTime() + 90 * 60000);

  const time60 = `${in60.getHours().toString().padStart(2, '0')}:${in60.getMinutes().toString().padStart(2, '0')}`;
  const time90 = `${in90.getHours().toString().padStart(2, '0')}:${in90.getMinutes().toString().padStart(2, '0')}`;

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('*, business:businesses(whatsapp_phone_id, whatsapp_access_token, name)')
    .eq('slot_date', today)
    .eq('reminder_sent', false)
    .eq('status', 'confirmed')
    .gte('slot_time', time60)
    .lte('slot_time', time90);

  if (!bookings || bookings.length === 0) {
    return Response.json({ sent: 0 });
  }

  let sentCount = 0;

  for (const booking of bookings) {
    const business = booking.business;
    if (!booking.customer_phone || !business) continue;

    const formattedTime = formatTime(booking.slot_time);

    const message =
      `⏰ *Reminder — ${business.name}*\n\n` +
      `Aapka appointment aaj *${formattedTime}* ko hai!\n` +
      (booking.service_type ? `Service: ${booking.service_type}\n` : '') +
      `\nSamay par aana mat bhuliega 🙏`;

    const result = await sendTextMessage({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      to: booking.customer_phone,
      message,
    });

    if (result.success) {
      await supabaseAdmin
        .from('bookings')
        .update({ reminder_sent: true })
        .eq('id', booking.id);
      sentCount++;
    }
  }

  console.log(`[Cron Reminders] Sent ${sentCount} reminders`);
  return Response.json({ sent: sentCount });
}
