// lib/intent.ts — Quick intent detection (pre-AI classification)

export type MessageIntent =
  | 'order'
  | 'booking'
  | 'query'
  | 'complaint'
  | 'delivery_status'
  | 'cancel'
  | 'greeting'
  | 'other';

// Quick keyword-based intent detection (before calling AI)
export function quickClassifyIntent(message: string): MessageIntent | null {
  const msg = message.toLowerCase();

  // Delivery/order status
  if (
    msg.includes('status') ||
    msg.includes('kab ayega') ||
    msg.includes('track') ||
    msg.includes('delivery kahan') ||
    msg.includes('order kahan')
  ) {
    return 'delivery_status';
  }

  // Cancel
  if (
    msg.includes('cancel') ||
    msg.includes('band karo') ||
    msg.includes('nahi chahiye') ||
    msg.includes('wapas')
  ) {
    return 'cancel';
  }

  // Greetings
  if (
    /^(hi|hello|hey|namaste|hii|helo|namaskar|good (morning|evening|afternoon))(\s|!|,|\.)*$/i.test(
      msg.trim()
    )
  ) {
    return 'greeting';
  }

  // Complaints
  if (
    msg.includes('complaint') ||
    msg.includes('problem') ||
    msg.includes('issue') ||
    msg.includes('galat') ||
    msg.includes('bura') ||
    msg.includes('khana kharab') ||
    msg.includes('disappointed')
  ) {
    return 'complaint';
  }

  return null; // Let AI classify
}
