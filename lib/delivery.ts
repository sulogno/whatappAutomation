// lib/delivery.ts — Delivery assignment and coordination logic

import { supabaseAdmin } from './supabase';
import { triggerPusherEvent, businessChannel, PUSHER_EVENTS } from './pusher';
import {
  sendTextMessage,
  sendDeliveryBoyNotification,
} from './whatsapp';
import type { DeliveryAssignment, Order } from '@/types';
import { getTodayDate } from './utils';

// Auto-assign delivery to an available delivery boy
export async function assignDelivery(
  orderId: string,
  excludeIds: string[] = []
): Promise<DeliveryAssignment | null> {
  // Get the order details
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*, business:businesses(*)')
    .eq('id', orderId)
    .single();

  if (!order) return null;

  const business = order.business;

  // Find available delivery boys (load balance: least deliveries today)
  const { data: boys } = await supabaseAdmin
    .from('delivery_boys')
    .select('*, today_count:delivery_assignments(count)')
    .eq('business_id', order.business_id)
    .eq('is_available', true)
    .eq('is_active', true)
    .not('id', 'in', excludeIds.length > 0 ? `(${excludeIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
    .order('total_deliveries', { ascending: true });

  if (!boys || boys.length === 0) {
    // Notify owner: no delivery boys available
    await sendTextMessage({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      to: business.owner_phone,
      message: `⚠️ *ReplyFast Alert*\n\nOrder #${order.order_number} ke liye koi delivery boy available nahi hai!\n\nPlease manually assign karein ya ek delivery boy available mark karein.`,
    });
    return null;
  }

  const selectedBoy = boys[0];

  // Get current attempt number
  const { count: attemptCount } = await supabaseAdmin
    .from('delivery_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId);

  // Create assignment
  const { data: assignment, error } = await supabaseAdmin
    .from('delivery_assignments')
    .insert({
      order_id: orderId,
      delivery_boy_id: selectedBoy.id,
      business_id: order.business_id,
      status: 'pending',
      attempt_number: (attemptCount || 0) + 1,
    })
    .select()
    .single();

  if (error) throw error;

  // Notify delivery boy
  await sendDeliveryBoyNotification({
    phoneNumberId: business.whatsapp_phone_id,
    accessToken: business.whatsapp_access_token,
    deliveryBoyPhone: selectedBoy.whatsapp_number,
    order: order as Order,
  });

  return assignment as DeliveryAssignment;
}

// Reassign delivery after timeout
export async function reassignDelivery(assignmentId: string): Promise<void> {
  const { data: assignment } = await supabaseAdmin
    .from('delivery_assignments')
    .select('*, order:orders(*)')
    .eq('id', assignmentId)
    .single();

  if (!assignment || assignment.status !== 'pending') return;

  // Max 3 attempts
  if (assignment.attempt_number >= 3) {
    // Get all tried delivery boy IDs for this order
    const { data: tried } = await supabaseAdmin
      .from('delivery_assignments')
      .select('delivery_boy_id')
      .eq('order_id', assignment.order_id);

    // Notify owner
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select()
      .eq('id', assignment.business_id)
      .single();

    if (business) {
      await sendTextMessage({
        phoneNumberId: business.whatsapp_phone_id,
        accessToken: business.whatsapp_access_token,
        to: business.owner_phone,
        message: `🚨 *Delivery Failed*\n\nOrder #${assignment.order.order_number} ke liye 3 delivery boys ne accept nahi kiya!\n\nPlease manually handle karein.`,
      });
    }

    await supabaseAdmin
      .from('delivery_assignments')
      .update({ status: 'failed' })
      .eq('id', assignmentId);

    return;
  }

  // Mark current as failed
  await supabaseAdmin
    .from('delivery_assignments')
    .update({ status: 'failed' })
    .eq('id', assignmentId);

  // Get all previously tried delivery boys
  const { data: tried } = await supabaseAdmin
    .from('delivery_assignments')
    .select('delivery_boy_id')
    .eq('order_id', assignment.order_id);

  const excludeIds = tried?.map((t) => t.delivery_boy_id) || [];

  // Try next available delivery boy
  await assignDelivery(assignment.order_id, excludeIds);
}

// Handle reply from a delivery boy
export async function handleDeliveryReply(
  waNumber: string,
  message: string,
  businessId: string
): Promise<boolean> {
  // Check if this number belongs to a delivery boy
  const { data: deliveryBoy } = await supabaseAdmin
    .from('delivery_boys')
    .select()
    .eq('whatsapp_number', waNumber.replace(/\D/g, ''))
    .eq('business_id', businessId)
    .eq('is_active', true)
    .single();

  if (!deliveryBoy) return false;

  const cmd = message.toUpperCase().trim();
  if (!['ACCEPT', 'PICKED', 'DELIVERED'].includes(cmd)) return false;

  // Find their pending/accepted assignment
  const { data: assignment } = await supabaseAdmin
    .from('delivery_assignments')
    .select()
    .eq('delivery_boy_id', deliveryBoy.id)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!assignment) return true; // It's a delivery boy but no active assignment

  if (cmd === 'ACCEPT') await acceptDelivery(assignment.id, deliveryBoy);
  if (cmd === 'PICKED') await markPicked(assignment.id);
  if (cmd === 'DELIVERED') await markDelivered(assignment.id, deliveryBoy);

  return true;
}

// Accept a delivery assignment
export async function acceptDelivery(
  assignmentId: string,
  deliveryBoy: { id: string; name: string; whatsapp_number: string }
): Promise<void> {
  const { data: assignment } = await supabaseAdmin
    .from('delivery_assignments')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select('*, order:orders(*, business:businesses(*))')
    .single();

  if (!assignment) return;

  const order = assignment.order;
  const business = order.business;

  // Mark delivery boy as unavailable
  await supabaseAdmin
    .from('delivery_boys')
    .update({ is_available: false, current_order_id: order.id })
    .eq('id', deliveryBoy.id);

  // Update order status
  await supabaseAdmin
    .from('orders')
    .update({ status: 'out_for_delivery', delivery_boy_id: deliveryBoy.id })
    .eq('id', order.id);

  // Notify customer
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select()
    .eq('id', order.customer_id)
    .single();

  if (customer?.phone) {
    await sendTextMessage({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      to: customer.phone,
      message: `🛵 *Order Update — #${order.order_number}*\n\nAapka order pick ho gaya! ${deliveryBoy.name} aapke paas aa rahe hain.\n\nThoda wait karein 😊 🙏`,
    });
  }

  // Confirm to delivery boy
  await sendTextMessage({
    phoneNumberId: business.whatsapp_phone_id,
    accessToken: business.whatsapp_access_token,
    to: deliveryBoy.whatsapp_number,
    message: `✅ Order #${order.order_number} confirm!\n\nPickup karein aur *PICKED* bhejein jab order le lo.\nDeliver karne ke baad *DELIVERED* bhejein. 🙏`,
  });

  // Trigger real-time update
  await triggerPusherEvent(
    businessChannel(business.id),
    PUSHER_EVENTS.DELIVERY_UPDATE,
    { assignmentId, status: 'accepted', deliveryBoyName: deliveryBoy.name }
  );
}

// Mark delivery as picked up
export async function markPicked(assignmentId: string): Promise<void> {
  const { data: assignment } = await supabaseAdmin
    .from('delivery_assignments')
    .update({ status: 'picked', picked_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select('*, order:orders(*, business:businesses(*)), delivery_boy:delivery_boys(*)')
    .single();

  if (!assignment) return;

  const order = assignment.order;
  const business = order.business;
  const deliveryBoy = assignment.delivery_boy;

  // Update order status
  await supabaseAdmin
    .from('orders')
    .update({ status: 'out_for_delivery' })
    .eq('id', order.id);

  // Notify customer
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select()
    .eq('id', order.customer_id)
    .single();

  if (customer?.phone) {
    await sendTextMessage({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      to: customer.phone,
      message: `🚀 *Order #${order.order_number}* — Out for delivery!\n\n${deliveryBoy.name} aapka order lekar nikal gaye hain. Jaldi pahunch jaayenge! 😊 🙏`,
    });
  }

  await triggerPusherEvent(
    businessChannel(business.id),
    PUSHER_EVENTS.DELIVERY_UPDATE,
    { assignmentId, status: 'picked', deliveryBoyName: deliveryBoy.name }
  );
}

// Mark delivery as delivered
export async function markDelivered(
  assignmentId: string,
  deliveryBoy: { id: string; name: string; whatsapp_number: string }
): Promise<void> {
  const { data: assignment } = await supabaseAdmin
    .from('delivery_assignments')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select('*, order:orders(*, business:businesses(*))')
    .single();

  if (!assignment) return;

  const order = assignment.order;
  const business = order.business;

  // Update order status
  await supabaseAdmin
    .from('orders')
    .update({ status: 'delivered' })
    .eq('id', order.id);

  // Free up delivery boy and increment delivery count atomically
  await supabaseAdmin
    .from('delivery_boys')
    .update({ is_available: true, current_order_id: null })
    .eq('id', deliveryBoy.id);

  await supabaseAdmin.rpc('increment_delivery_count', { boy_id: deliveryBoy.id });

  // Notify customer
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select()
    .eq('id', order.customer_id)
    .single();

  if (customer?.phone) {
    await sendTextMessage({
      phoneNumberId: business.whatsapp_phone_id,
      accessToken: business.whatsapp_access_token,
      to: customer.phone,
      message: `✅ *Order Delivered!*\n\nOrder #${order.order_number} deliver ho gaya! 🎉\n\nKhana enjoy karein aur dobara order zaroor karein 🙏😊`,
    });
  }

  // Summary to delivery boy
  await sendTextMessage({
    phoneNumberId: business.whatsapp_phone_id,
    accessToken: business.whatsapp_access_token,
    to: deliveryBoy.whatsapp_number,
    message: `✅ Order #${order.order_number} — Delivery complete!\n\nShukria ${deliveryBoy.name}! Aap ab next order ke liye available hain. 🙏`,
  });

  await triggerPusherEvent(
    businessChannel(business.id),
    PUSHER_EVENTS.DELIVERY_UPDATE,
    { assignmentId, status: 'delivered', orderId: order.id }
  );

  await triggerPusherEvent(
    businessChannel(business.id),
    PUSHER_EVENTS.ORDER_UPDATED,
    { orderId: order.id, status: 'delivered' }
  );
}
