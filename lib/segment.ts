import { supabaseAdmin } from "./supabase";
import type {
  Business,
  BusinessSegmentConfig,
  DashboardFeature,
  InventoryItem,
  SegmentType,
  TerminologyMap,
} from "@/types";
import { isBusinessOpen } from "./utils";

const configCache = new Map<string, BusinessSegmentConfig>();

const DEFAULT_TERMINOLOGY: TerminologyMap = {
  customer: "Customer",
  order: "Order",
  menu: "Menu",
  booking: "Booking",
  appointment: "Appointment",
  patient: "Patient",
  client: "Client",
  student: "Student",
  service: "Service",
  slot: "Slot",
  invoice: "Invoice",
  product: "Product",
  item: "Item",
};

const DEFAULT_FEATURES: DashboardFeature[] = [
  "orders",
  "bookings",
  "delivery",
  "inventory",
  "queue",
  "conversations",
  "settings",
  "billing",
];

export async function getSegmentConfig(
  segmentType: string,
): Promise<BusinessSegmentConfig | null> {
  const key = (segmentType || "other").toLowerCase();
  if (configCache.has(key)) {
    return configCache.get(key) || null;
  }

  const { data, error } = await supabaseAdmin
    .from("business_segment_config")
    .select("*")
    .eq("segment_type", key)
    .maybeSingle();

  if (error || !data) {
    if (key !== "other") {
      const { data: fallback } = await supabaseAdmin
        .from("business_segment_config")
        .select("*")
        .eq("segment_type", "other")
        .maybeSingle();

      if (fallback) {
        const typedFallback = fallback as BusinessSegmentConfig;
        configCache.set("other", typedFallback);
        return typedFallback;
      }
    }
    return null;
  }

  const typed = data as BusinessSegmentConfig;
  configCache.set(key, typed);
  return typed;
}

export function getTerminology(
  config: BusinessSegmentConfig | null,
): TerminologyMap {
  return {
    ...DEFAULT_TERMINOLOGY,
    ...(config?.terminology_map || {}),
  };
}

export function getVisibleFeatures(
  config: BusinessSegmentConfig | null,
): DashboardFeature[] {
  if (!config?.visible_features?.length) {
    return DEFAULT_FEATURES;
  }
  return config.visible_features;
}

export function buildSegmentPrompt(
  config: BusinessSegmentConfig,
  business: Business,
  inventory: InventoryItem[],
): string {
  const menuItems =
    inventory.length > 0
      ? inventory
          .map(
            (item) =>
              `${item.item_name} - ₹${item.price ?? "?"}${item.unit ? `/${item.unit}` : ""}${item.is_available ? "" : " (Unavailable)"}`,
          )
          .join("\n")
      : business.ai_context || "No structured menu/services provided.";

  const closedDays =
    business.closed_days.length > 0 ? business.closed_days.join(", ") : "None";

  const replacements: Record<string, string> = {
    business_name: business.name,
    business_type: business.business_type,
    menu_items: menuItems,
    opening_time: business.opening_time,
    closing_time: business.closing_time,
    closed_days: closedDays,
    is_open: isBusinessOpen(business) ? "Open" : "Closed",
    business_description: business.ai_context || "Not provided",
  };

  return config.ai_base_prompt.replace(/\{(.*?)\}/g, (match, token: string) => {
    const key = token.trim();
    return replacements[key] ?? match;
  });
}

export function getPrimaryWidget(config: BusinessSegmentConfig | null): string {
  return config?.dashboard_primary_widget || "orders";
}

export function isFeatureVisible(
  feature: DashboardFeature,
  config: BusinessSegmentConfig | null,
): boolean {
  if (!config) {
    return true;
  }
  return getVisibleFeatures(config).includes(feature);
}

export function getTerm(
  genericTerm: keyof TerminologyMap,
  config: BusinessSegmentConfig | null,
): string {
  const terminology = getTerminology(config);
  return (
    terminology[genericTerm] || DEFAULT_TERMINOLOGY[genericTerm] || genericTerm
  );
}

export async function preloadSegmentConfigs(): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("business_segment_config")
    .select("*");

  if (error || !data) {
    return;
  }

  for (const row of data) {
    const config = row as BusinessSegmentConfig;
    configCache.set(config.segment_type as SegmentType, config);
  }
}
