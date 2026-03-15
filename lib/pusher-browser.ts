// lib/pusher-browser.ts — Pusher browser client

import PusherJS from 'pusher-js';

let pusherInstance: PusherJS | null = null;

export function getPusherClient(): PusherJS {
  if (!pusherInstance && typeof window !== 'undefined') {
    pusherInstance = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherInstance!;
}

export function subscribeToBusiness(
  businessId: string,
  events: Record<string, (data: unknown) => void>
) {
  const pusher = getPusherClient();
  const channel = pusher.subscribe(`business-${businessId}`);

  Object.entries(events).forEach(([event, handler]) => {
    channel.bind(event, handler);
  });

  return () => {
    pusher.unsubscribe(`business-${businessId}`);
  };
}
