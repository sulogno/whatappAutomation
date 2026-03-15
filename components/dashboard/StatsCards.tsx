"use client";

// components/dashboard/StatsCards.tsx
import { TrendingUp, Users, Truck, MessageSquare } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardsProps {
  cards?: Array<{
    label: string;
    value: string;
    sub: string;
    icon: LucideIcon;
    color: string;
    bg: string;
  }>;
  stats?: {
    todayOrders: number;
    todayRevenue: number;
    activeQueue: number;
    pendingDeliveries: number;
    aiMessages: number;
  };
}

export function StatsCards({ stats, cards: customCards }: StatsCardsProps) {
  const cards = customCards || [
    {
      label: "Today's Orders",
      value: (stats?.todayOrders || 0).toString(),
      sub: formatCurrency(stats?.todayRevenue || 0),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Live Queue",
      value: (stats?.activeQueue || 0).toString(),
      sub: "waiting now",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Deliveries",
      value: (stats?.pendingDeliveries || 0).toString(),
      sub: "in progress",
      icon: Truck,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "AI Messages",
      value: (stats?.aiMessages || 0).toString(),
      sub: "handled today",
      icon: MessageSquare,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="stat-card animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            <p className="text-sm font-medium text-foreground/70 mt-2">
              {card.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
