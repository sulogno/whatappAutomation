"use client";

// app/dashboard/layout.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, type SidebarNavItem } from "@/components/dashboard/Sidebar";
import { useAppStore } from "@/store/useAppStore";
import {
  Menu,
  Bell,
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Users,
  Truck,
  Package,
  MessageCircle,
  Settings,
  CreditCard,
} from "lucide-react";
import type {
  Business,
  BusinessSegmentConfig,
  DashboardFeature,
  TerminologyMap,
} from "@/types";
import { DashboardContext } from "./dashboard-context";

const DEFAULT_TERMS: TerminologyMap = {
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

const ALL_NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: SidebarNavItem["icon"];
  feature: DashboardFeature | null;
}> = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    feature: null,
  },
  {
    href: "/dashboard/orders",
    label: "orders",
    icon: ShoppingBag,
    feature: "orders",
  },
  {
    href: "/dashboard/bookings",
    label: "bookings",
    icon: Calendar,
    feature: "bookings",
  },
  { href: "/dashboard/queue", label: "Queue", icon: Users, feature: "queue" },
  {
    href: "/dashboard/delivery",
    label: "Delivery",
    icon: Truck,
    feature: "delivery",
  },
  {
    href: "/dashboard/inventory",
    label: "inventory",
    icon: Package,
    feature: "inventory",
  },
  {
    href: "/dashboard/conversations",
    label: "Conversations",
    icon: MessageCircle,
    feature: "conversations",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    feature: "settings",
  },
  {
    href: "/dashboard/billing",
    label: "Billing",
    icon: CreditCard,
    feature: "billing",
  },
];

function pluralize(word: string): string {
  if (word.toLowerCase().endsWith("s")) {
    return word;
  }
  return `${word}s`;
}

function mapNavLabel(rawLabel: string, terminology: TerminologyMap): string {
  if (rawLabel === "orders") {
    return pluralize(terminology.order);
  }
  if (rawLabel === "bookings") {
    return pluralize(terminology.booking);
  }
  if (rawLabel === "inventory") {
    return terminology.menu;
  }
  return rawLabel;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setBusiness, setSidebarOpen, sidebarOpen } = useAppStore();
  const router = useRouter();
  const [business, setBusinessLocal] = useState<Business | null>(null);
  const [segmentConfig, setSegmentConfig] =
    useState<BusinessSegmentConfig | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.business) {
          // ✅ FIX: No business found → redirect to onboarding
          router.replace("/onboarding");
          return;
        }

        const loadedBusiness = d.business as Business;
        setBusiness(loadedBusiness);
        setBusinessLocal(loadedBusiness);

        try {
          const configRes = await fetch(
            `/api/segment-config?type=${loadedBusiness.business_type}`,
          );
          if (configRes.ok) {
            const configData = await configRes.json();
            setSegmentConfig(configData as BusinessSegmentConfig);
          } else {
            setSegmentConfig(null);
          }
        } catch {
          setSegmentConfig(null);
        }
      })
      .catch(() => {});
  }, [setBusiness]);

  const terminology = useMemo(
    () => ({ ...DEFAULT_TERMS, ...(segmentConfig?.terminology_map || {}) }),
    [segmentConfig],
  );

  const visibleNav = useMemo(() => {
    const visibleFeatures = segmentConfig?.visible_features || null;
    return ALL_NAV_ITEMS.filter(
      (item) =>
        item.feature === null ||
        !visibleFeatures ||
        visibleFeatures.includes(item.feature),
    ).map((item) => ({
      href: item.href,
      icon: item.icon,
      label: mapNavLabel(item.label, terminology),
    }));
  }, [segmentConfig, terminology]);

  return (
    <DashboardContext.Provider value={{ business, segmentConfig, terminology }}>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar navItems={visibleNav} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
              <Bell className="w-5 h-5" />
            </button>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
