// lib/pusher.ts — Pusher server client

import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherInstance;
}

// Trigger a Pusher event
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const pusher = getPusher();
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error('[Pusher] Failed to trigger event:', { channel, event, error });
  }
}

// Channel naming helpers
export const businessChannel = (businessId: string) => `business-${businessId}`;

// Event names
export const PUSHER_EVENTS = {
  QUEUE_UPDATED: 'queue-updated',
  NEW_ORDER: 'new-order',
  ORDER_UPDATED: 'order-updated',
  DELIVERY_UPDATE: 'delivery-update',
  NEW_MESSAGE: 'new-message',
} as const;
