'use client';

// components/dashboard/RecentOrders.tsx
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No orders yet today
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.slice(0, 5).map((order) => (
        <div
          key={order.id}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
        >
          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center font-bold text-sm text-foreground/70 flex-shrink-0">
            #{order.order_number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">
                {(order.customer as { name?: string })?.name || order.customer_id?.slice(0, 8) || 'Customer'}
              </p>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''} •{' '}
              {formatDateTime(order.created_at)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold">{formatCurrency(order.total_amount)}</p>
            <p className="text-xs text-muted-foreground capitalize">{order.delivery_type}</p>
          </div>
        </div>
      ))}

      <Link
        href="/dashboard/orders"
        className="block text-center text-sm text-primary font-medium hover:underline pt-1"
      >
        View all orders →
      </Link>
    </div>
  );
}
