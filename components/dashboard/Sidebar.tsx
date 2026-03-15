"use client";

// components/dashboard/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageCircle, X, ChevronRight, type LucideIcon } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function Sidebar({ navItems }: { navItems: SidebarNavItem[] }) {
  const pathname = usePathname();
  const { business, sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 bg-card border-r border-border flex flex-col",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ReplyFast</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Business name */}
        {business && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2.5 bg-secondary rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-lg">
                {business.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {business.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {business.business_type}
                </p>
              </div>
              <div
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  business.is_open ? "bg-green-500" : "bg-red-400",
                )}
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn("sidebar-link", isActive && "active")}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Plan badge */}
        {business && (
          <div className="p-4 border-t border-border">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  {business.plan} Plan
                </span>
                {business.plan === "free" && (
                  <Link
                    href="/dashboard/billing"
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Upgrade →
                  </Link>
                )}
              </div>
              <div className="w-full bg-primary/10 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (business.monthly_message_count / business.monthly_message_limit) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {business.monthly_message_count}/
                {business.monthly_message_limit} messages
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
