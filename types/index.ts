// types/index.ts — Shared app types

export type BusinessType =
  | "restaurant"
  | "salon"
  | "clinic"
  | "kirana"
  | "tutor"
  | "ecommerce"
  | "freelancer"
  | "other";

export type PlanType = "free" | "starter" | "growth" | "pro";

export type Language = "hindi" | "english" | "hinglish";

export interface Business {
  id: string;
  created_at: string;
  owner_phone: string;
  owner_email: string;
  name: string;
  business_type: BusinessType;
  whatsapp_number: string;
  whatsapp_phone_id: string;
  whatsapp_access_token: string;
  ai_context: string;
  language: Language;
  timezone: string;
  is_open: boolean;
  opening_time: string;
  closing_time: string;
  closed_days: string[];
  plan: PlanType;
  plan_expires_at: string | null;
  razorpay_subscription_id: string | null;
  monthly_message_count: number;
  monthly_message_limit: number;
  is_active: boolean;
}

export interface Customer {
  id: string;
  created_at: string;
  business_id: string;
  phone: string;
  name: string | null;
  total_orders: number;
  last_interaction: string | null;
  notes: string | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  business_id: string;
  customer_id: string;
  message_text: string;
  direction: "inbound" | "outbound";
  sender: "customer" | "ai" | "owner";
  wa_message_id: string | null;
  intent: string | null;
  is_ai_handled: boolean;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  created_at: string;
  business_id: string;
  customer_id: string;
  order_number: number;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  payment_method: "cod" | "upi" | "online";
  delivery_address: string | null;
  delivery_type: "pickup" | "delivery";
  delivery_boy_id: string | null;
  special_instructions: string | null;
  estimated_time: number | null;
  notes: string | null;
  customer?: Customer;
  delivery_boy?: DeliveryBoy;
}

export type QueueStatus =
  | "waiting"
  | "called"
  | "in_service"
  | "done"
  | "no_show";
export type QueueEntryType = "walkin" | "booking" | "online";

export interface QueueEntry {
  id: string;
  created_at: string;
  business_id: string;
  customer_id: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  token_number: number;
  service_type: string | null;
  entry_type: QueueEntryType;
  status: QueueStatus;
  booking_id: string | null;
  estimated_wait: number | null;
  actual_start: string | null;
  actual_end: string | null;
  notified_at: string | null;
  date: string;
}

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export interface Booking {
  id: string;
  created_at: string;
  business_id: string;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  service_type: string | null;
  slot_date: string;
  slot_time: string;
  slot_duration: number;
  status: BookingStatus;
  reminder_sent: boolean;
  notes: string | null;
}

export interface DeliveryBoy {
  id: string;
  created_at: string;
  business_id: string;
  name: string;
  phone: string;
  whatsapp_number: string;
  is_available: boolean;
  is_active: boolean;
  current_order_id: string | null;
  total_deliveries: number;
}

export type DeliveryAssignmentStatus =
  | "pending"
  | "accepted"
  | "picked"
  | "delivered"
  | "failed";

export interface DeliveryAssignment {
  id: string;
  created_at: string;
  order_id: string;
  delivery_boy_id: string;
  business_id: string;
  status: DeliveryAssignmentStatus;
  assigned_at: string;
  accepted_at: string | null;
  picked_at: string | null;
  delivered_at: string | null;
  attempt_number: number;
}

export interface InventoryItem {
  id: string;
  created_at: string;
  business_id: string;
  item_name: string;
  category: string | null;
  price: number | null;
  stock_quantity: number | null;
  unit: string | null;
  low_stock_alert: number;
  is_available: boolean;
  description: string | null;
}

export interface SlotConfig {
  id: string;
  business_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  max_concurrent: number;
  is_active: boolean;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  bookedBy?: string;
  bookingId?: string;
}

export type MessageIntent =
  | "order"
  | "booking"
  | "query"
  | "complaint"
  | "delivery_status"
  | "cancel"
  | "greeting"
  | "other";

export interface ApiError {
  error: string;
  code: string;
}

export const PLAN_LIMITS = {
  free: {
    monthly_messages: 50,
    delivery_boys: 1,
    inventory_items: 20,
    queue_per_day: 20,
  },
  starter: {
    monthly_messages: 500,
    delivery_boys: 2,
    inventory_items: 100,
    queue_per_day: 100,
  },
  growth: {
    monthly_messages: 2000,
    delivery_boys: 5,
    inventory_items: 500,
    queue_per_day: 500,
  },
  pro: {
    monthly_messages: 10000,
    delivery_boys: 20,
    inventory_items: -1,
    queue_per_day: -1,
  },
} as const;

export const PLAN_PRICES = {
  free: 0,
  starter: 199,
  growth: 399,
  pro: 999,
} as const;

export const RAZORPAY_PLAN_IDS = {
  starter: "plan_starter_199",
  growth: "plan_growth_399",
  pro: "plan_pro_999",
} as const;

// Business segment configuration
export interface BusinessSegmentConfig {
  id: string;
  segment_type: SegmentType;
  display_name: string;
  ai_base_prompt: string;
  visible_features: DashboardFeature[];
  terminology_map: TerminologyMap;
  keyword_cache_set: string;
  onboarding_schema: OnboardingField[];
  default_language: string;
  default_formality: string;
  dashboard_primary_widget: string;
}

export type SegmentType =
  | "restaurant"
  | "salon"
  | "clinic"
  | "kirana"
  | "tutor"
  | "ecommerce"
  | "freelancer"
  | "other";

export type DashboardFeature =
  | "orders"
  | "bookings"
  | "delivery"
  | "inventory"
  | "queue"
  | "conversations"
  | "settings"
  | "billing";

export interface TerminologyMap {
  customer: string;
  order: string;
  menu: string;
  booking: string;
  appointment: string;
  patient: string;
  client: string;
  student: string;
  service: string;
  slot: string;
  invoice: string;
  product: string;
  item: string;
}

export interface OnboardingField {
  step: string;
  question: string;
  hint: string;
  required: boolean;
}

// Extend the existing Business type
export interface BusinessWithSegment extends Business {
  segment_config?: BusinessSegmentConfig;
}
