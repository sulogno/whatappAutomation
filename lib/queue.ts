// lib/queue.ts — Queue business logic

import { supabaseAdmin } from './supabase';
import {
  triggerPusherEvent,
  businessChannel,
  PUSHER_EVENTS,
} from './pusher';
import { sendTextMessage, sendQueueNotification } from './whatsapp';
import type { QueueEntry } from '@/types';
import { getTodayDate } from './utils';

const AVG_SERVICE_TIME = 30; // minutes

// Get next token number for the day
export async function getNextTokenNumber(
  businessId: string,
  date: string
): Promise<number> {
  const { data } = await supabaseAdmin
    .from('queue')
    .select('token_number')
    .eq('business_id', businessId)
    .eq('date', date)
    .order('token_number', { ascending: false })
    .limit(1)
    .single();

  return (data?.token_number || 0) + 1;
}

// Calculate estimated wait time in minutes
export async function calculateEstimatedWait(businessId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('queue')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('date', getTodayDate())
    .in('status', ['waiting', 'in_service']);

  return (count || 0) * AVG_SERVICE_TIME;
}

// Add a customer to the queue
export async function addToQueue(params: {
  businessId: string;
  customerPhone?: string;
  customerName?: string;
  serviceType?: string;
  entryType: 'walkin' | 'booking' | 'online';
  bookingId?: string;
  customerId?: string;
}): Promise<QueueEntry> {
  const today = getTodayDate();
  const tokenNumber = await getNextTokenNumber(params.businessId, today);
  const estimatedWait = await calculateEstimatedWait(params.businessId);

  const { data, error } = await supabaseAdmin
    .from('queue')
    .insert({
      business_id: params.businessId,
      customer_id: params.customerId || null,
      customer_phone: params.customerPhone || null,
      customer_name: params.customerName || null,
      token_number: tokenNumber,
      service_type: params.serviceType || null,
      entry_type: params.entryType,
      booking_id: params.bookingId || null,
      estimated_wait: estimatedWait,
      status: 'waiting',
      date: today,
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger real-time update
  await triggerPusherEvent(
    businessChannel(params.businessId),
    PUSHER_EVENTS.QUEUE_UPDATED,
    { action: 'added', entry: data }
  );

  return data as QueueEntry;
}

// Move to next customer in queue
export async function moveToNext(
  businessId: string,
  business?: { whatsapp_phone_id: string; whatsapp_access_token: string; name: string }
): Promise<void> {
  const today = getTodayDate();

  // Complete current in-service entry
  const { data: inService } = await supabaseAdmin
    .from('queue')
    .select()
    .eq('business_id', businessId)
    .eq('status', 'in_service')
    .eq('date', today)
    .single();

  if (inService) {
    await supabaseAdmin
      .from('queue')
      .update({ status: 'done', actual_end: new Date().toISOString() })
      .eq('id', inService.id);
  }

  // Get next waiting entry
  const { data: waiting } = await supabaseAdmin
    .from('queue')
    .select()
    .eq('business_id', businessId)
    .eq('status', 'waiting')
    .eq('date', today)
    .order('token_number', { ascending: true })
    .limit(2);

  if (!waiting || waiting.length === 0) {
    await triggerPusherEvent(
      businessChannel(businessId),
      PUSHER_EVENTS.QUEUE_UPDATED,
      { action: 'completed' }
    );
    return;
  }

  const nextCustomer = waiting[0];
  const upcomingCustomer = waiting[1];

  // Mark next as in_service
  await supabaseAdmin
    .from('queue')
    .update({ status: 'in_service', actual_start: new Date().toISOString() })
    .eq('id', nextCustomer.id);

  // Notify next customer via WhatsApp
  if (business && nextCustomer.customer_phone) {
    await sendQueueNotification({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      customerPhone: nextCustomer.customer_phone,
      tokenNumber: nextCustomer.token_number,
      estimatedWait: 0,
      businessName: business.name,
      type: 'arrived',
    });
  }

  // Notify upcoming customer (2nd in line) — 10 min warning
  if (business && upcomingCustomer?.customer_phone) {
    await sendQueueNotification({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      customerPhone: upcomingCustomer.customer_phone,
      tokenNumber: upcomingCustomer.token_number,
      estimatedWait: AVG_SERVICE_TIME,
      businessName: business.name,
      type: 'called',
    });
  }

  await triggerPusherEvent(
    businessChannel(businessId),
    PUSHER_EVENTS.QUEUE_UPDATED,
    { action: 'next', currentToken: nextCustomer.token_number }
  );
}

// Mark a queue entry as no-show
export async function markNoShow(
  queueId: string,
  businessId: string,
  business?: { whatsapp_phone_id: string; whatsapp_access_token: string; name: string }
): Promise<void> {
  await supabaseAdmin
    .from('queue')
    .update({ status: 'no_show' })
    .eq('id', queueId);

  await triggerPusherEvent(
    businessChannel(businessId),
    PUSHER_EVENTS.QUEUE_UPDATED,
    { action: 'no_show', queueId }
  );

  // Move to next
  await moveToNext(businessId, business);
}

// Get today's queue stats
export async function getQueueStats(businessId: string): Promise<{
  waiting: number;
  inService: number;
  doneToday: number;
  avgWait: number;
}> {
  const today = getTodayDate();

  const { data } = await supabaseAdmin
    .from('queue')
    .select('status, actual_start, actual_end')
    .eq('business_id', businessId)
    .eq('date', today);

  if (!data) return { waiting: 0, inService: 0, doneToday: 0, avgWait: 0 };

  const waiting = data.filter((e) => e.status === 'waiting').length;
  const inService = data.filter((e) => e.status === 'in_service').length;
  const done = data.filter((e) => e.status === 'done');

  const doneToday = done.length;
  const avgWait =
    done.length > 0
      ? Math.round(
          done.reduce((sum, e) => {
            if (e.actual_start && e.actual_end) {
              const start = new Date(e.actual_start).getTime();
              const end = new Date(e.actual_end).getTime();
              return sum + (end - start) / 60000;
            }
            return sum + AVG_SERVICE_TIME;
          }, 0) / done.length
        )
      : AVG_SERVICE_TIME;

  return { waiting, inService, doneToday, avgWait };
}
