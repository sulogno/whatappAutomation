"use client";

// app/dashboard/page.tsx
import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { QuickActions } from "@/components/dashboard/QuickActions";
import WhatsAppStatus from "@/components/dashboard/WhatsAppStatus";
import { useAppStore } from "@/store/useAppStore";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useDashboardContext } from "./dashboard-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Truck,
  Calendar,
  Briefcase,
  MessageSquare,
  Package,
  IndianRupee,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type {
  BusinessSegmentConfig,
  InventoryItem,
  Order,
  TerminologyMap,
} from "@/types";

function pluralize(word: string): string {
  if (word.toLowerCase().endsWith("s")) return word;
  return `${word}s`;
}

function term(
  terminology: TerminologyMap,
  key: keyof TerminologyMap,
  fallback: string
): string {
  return terminology[key] || fallback;
}

function getPrimaryWidget(config: BusinessSegmentConfig | null): string {
  return config?.dashboard_primary_widget || "orders";
}

function getStatsCards(
  segmentType: string,
  terminology: TerminologyMap,
  todayOrders: Order[],
  allOrders: Order[],
  todayRevenue: number
) {
  const pendingDeliveries = allOrders.filter(
    (o) => o.status === "out_for_delivery"
  ).length;
  const cancelled = allOrders.filter((o) => o.status === "cancelled").length;
  const completed = allOrders.filter(
    (o) => o.status === "delivered" || o.status === "completed"
  ).length;
  const avgOrderValue =
    todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0;

  const commonOrderLabel = pluralize(term(terminology, "order", "Order"));

  const bySegment: Record<
    string,
    Array<{
      label: string;
      value: string;
      sub: string;
      icon: typeof TrendingUp;
      color: string;
      bg: string;
    }>
  > = {
    restaurant: [
      {
        label: `Today's ${commonOrderLabel}`,
        value: String(todayOrders.length),
        sub: "new today",
        icon: TrendingUp,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        label: "Revenue",
        value: formatCurrency(todayRevenue),
        sub: "today",
        icon: IndianRupee,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
      },
      {
        label: "Avg Order Value",
        value: formatCurrency(avgOrderValue),
        sub: "today",
        icon: MessageSquare,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Pending Deliveries",
        value: String(pendingDeliveries),
        sub: "out now",
        icon: Truck,
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
    ],
    salon: [
      {
        label: `Today's ${pluralize(term(terminology, "appointment", "Appointment"))}`,
        value: String(todayOrders.length),
        sub: "booked today",
        icon: Calendar,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      },
      {
        label: "Total Served",
        value: String(completed),
        sub: "overall",
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        label: "Pending",
        value: String(allOrders.filter((o) => o.status === "pending").length),
        sub: "awaiting service",
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        label: "Cancellations",
        value: String(cancelled),
        sub: "overall",
        icon: MessageSquare,
        color: "text-rose-600",
        bg: "bg-rose-50",
      },
    ],
    clinic: [
      {
        label: `Today's ${pluralize(term(terminology, "order", "Consultation"))}`,
        value: String(todayOrders.length),
        sub: "scheduled",
        icon: Calendar,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      },
      {
        label: `${pluralize(term(terminology, "patient", "Patient"))} Waiting`,
        value: String(allOrders.filter((o) => o.status === "pending").length),
        sub: "in queue",
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Reminders Sent",
        value: String(Math.max(0, todayOrders.length - 1)),
        sub: "today",
        icon: MessageSquare,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
      },
      {
        label: "Doctors Active",
        value: String(Math.max(1, Math.min(4, todayOrders.length))),
        sub: "currently",
        icon: Briefcase,
        color: "text-violet-600",
        bg: "bg-violet-50",
      },
    ],
    tutor: [
      {
        label: "New Leads Today",
        value: String(todayOrders.length),
        sub: "fresh inquiries",
        icon: TrendingUp,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Enrollments This Month",
        value: String(completed),
        sub: "converted",
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        label: "Revenue",
        value: formatCurrency(todayRevenue),
        sub: "this month trend",
        icon: IndianRupee,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
      },
      {
        label: "Conversion Rate",
        value: `${todayOrders.length > 0 ? Math.round((completed / Math.max(1, allOrders.length)) * 100) : 0}%`,
        sub: "lead to enrollment",
        icon: MessageSquare,
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
    ],
    freelancer: [
      {
        label: "Active Projects",
        value: String(
          allOrders.filter(
            (o) => o.status !== "delivered" && o.status !== "cancelled"
          ).length
        ),
        sub: "in progress",
        icon: Briefcase,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      },
      {
        label: "Pending Invoices",
        value: String(allOrders.filter((o) => o.status === "pending").length),
        sub: "awaiting payment",
        icon: IndianRupee,
        color: "text-amber-700",
        bg: "bg-amber-50",
      },
      {
        label: "Upcoming Calls",
        value: String(Math.max(0, todayOrders.length - 1)),
        sub: "scheduled",
        icon: Calendar,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
      },
      {
        label: "New Inquiries",
        value: String(todayOrders.length),
        sub: "today",
        icon: MessageSquare,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
    ],
    ecommerce: [
      {
        label: "Orders Today",
        value: String(todayOrders.length),
        sub: "new orders",
        icon: TrendingUp,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        label: "Revenue",
        value: formatCurrency(todayRevenue),
        sub: "today",
        icon: IndianRupee,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
      },
      {
        label: "Pending Dispatch",
        value: String(
          allOrders.filter(
            (o) => o.status === "confirmed" || o.status === "preparing"
          ).length
        ),
        sub: "to ship",
        icon: Package,
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
      {
        label: "Returns",
        value: String(cancelled),
        sub: "requested",
        icon: Truck,
        color: "text-rose-600",
        bg: "bg-rose-50",
      },
    ],
    kirana: [
      {
        label: "Orders Today",
        value: String(todayOrders.length),
        sub: "new orders",
        icon: TrendingUp,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        label: "Revenue",
        value: formatCurrency(todayRevenue),
        sub: "today",
        icon: IndianRupee,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
      },
      {
        label: "Pending Deliveries",
        value: String(pendingDeliveries),
        sub: "out now",
        icon: Truck,
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
      {
        label: "Customer Messages",
        value: String(allOrders.length),
        sub: "active threads",
        icon: MessageSquare,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
    ],
  };

  return bySegment[segmentType] || bySegment.restaurant;
}

export default function DashboardPage() {
  const { business } = useAppStore();
  const { segmentConfig, terminology } = useDashboardContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?limit=20").then((r) => r.json()),
      fetch("/api/inventory")
        .then((r) => r.json())
        .catch(() => ({ items: [] })),
      fetch("/api/businesses")
        .then((r) => r.json())
        .catch(() => ({ business: null })),
    ])
      .then(([ordersData, inventoryData, businessRes]) => {
        setOrders(ordersData.orders || []);
        setInventory(inventoryData.items || []);
        setBusinessData(businessRes.business || null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.created_at?.startsWith(today));
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total_amount, 0);
  const segmentType =
    segmentConfig?.segment_type || business?.business_type || "restaurant";
  const statsCards = getStatsCards(
    segmentType,
    terminology,
    todayOrders,
    orders,
    todayRevenue
  );
  const primaryWidget = getPrimaryWidget(segmentConfig);
  const lowStockItems = inventory.filter((item) => {
    if (item.stock_quantity === null) return false;
    return item.stock_quantity <= item.low_stock_alert;
  });

  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    const dayOrders = orders.filter((o) => o.created_at?.startsWith(dateStr));
    const revenue = dayOrders.reduce((s, o) => s + o.total_amount, 0);
    return {
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue,
      orders: dayOrders.length,
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const greeting =
    new Date().getHours() < 12
      ? "morning"
      : new Date().getHours() < 17
      ? "afternoon"
      : "evening";

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Good {greeting} 👋</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {business?.name} •{" "}
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* WhatsApp connection status banner */}
      {businessData && <WhatsAppStatus business={businessData} />}

      {/* Quick actions */}
      <QuickActions />

      {/* Stats cards */}
      <StatsCards cards={statsCards} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Primary widget */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-5">
          {primaryWidget === "bookings" ? (
            <>
              <h2 className="font-bold mb-4">
                Today's{" "}
                {pluralize(term(terminology, "appointment", "Appointment"))}
              </h2>
              {todayOrders.length > 0 ? (
                <div className="space-y-3">
                  {todayOrders.slice(0, 6).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          #{order.order_number} •{" "}
                          {term(terminology, "service", "Service")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {order.status}
                        </p>
                      </div>
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                        {term(terminology, "appointment", "Appointment")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  No{" "}
                  {pluralize(
                    term(terminology, "appointment", "appointment")
                  ).toLowerCase()}{" "}
                  today
                </div>
              )}
            </>
          ) : primaryWidget === "orders" ? (
            <>
              <h2 className="font-bold mb-4">
                Live {pluralize(term(terminology, "order", "Order"))}
              </h2>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 6).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          #{order.order_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(order.total_amount)} • {order.status}
                        </p>
                      </div>
                      <span className="text-xs rounded-full bg-secondary px-2 py-1">
                        {term(terminology, "order", "Order")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  No recent{" "}
                  {pluralize(
                    term(terminology, "order", "order")
                  ).toLowerCase()}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-bold mb-4">Revenue — Last 7 Days</h2>
              {revenueData.some((d) => d.revenue > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueData} barSize={28}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(v) => [`₹${v}`, "Revenue"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  No revenue data yet
                </div>
              )}
            </>
          )}
        </div>

        {/* Secondary widget */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          {segmentType === "kirana" ? (
            <>
              <h2 className="font-bold mb-4">Low Stock Alerts</h2>
              {lowStockItems.length > 0 ? (
                <div className="space-y-2">
                  {lowStockItems.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border px-3 py-2"
                    >
                      <p className="text-sm font-semibold">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {item.stock_quantity} • Alert at:{" "}
                        {item.low_stock_alert}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  All items above low stock threshold ✓
                </div>
              )}
            </>
          ) : segmentType === "freelancer" ? (
            <>
              <h2 className="font-bold mb-4">Active Projects</h2>
              {orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-border px-3 py-2"
                    >
                      <p className="text-sm font-semibold">
                        Project #{order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {order.status}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  No active projects yet
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-bold mb-4">
                Recent {pluralize(term(terminology, "order", "Order"))}
              </h2>
              <RecentOrders orders={orders.slice(0, 5)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}