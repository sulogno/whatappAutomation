'use client';

// components/orders/OrdersList.tsx
import { useState } from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types';
import { ChevronDown, Package } from 'lucide-react';

interface OrdersListProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, status: string) => void;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export function OrdersList({ orders, onStatusUpdate }: OrdersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No orders yet</p>
        <p className="text-sm mt-1">Orders from WhatsApp will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const isExpanded = expandedId === order.id;
        const customer = order.customer as { name?: string; phone?: string } | undefined;

        return (
          <div
            key={order.id}
            className="bg-card border border-border rounded-2xl overflow-hidden transition-all"
          >
            {/* Header row */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
            >
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                #{order.order_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{customer?.name || 'Customer'}</p>
                  <StatusBadge status={order.status} />
                  <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-0.5 rounded-full">
                    {order.delivery_type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {formatDateTime(order.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-bold text-sm">{formatCurrency(order.total_amount)}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-border p-4 space-y-4 bg-secondary/30">
                {/* Items */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items</p>
                  <div className="space-y-1.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{item.name} × {item.qty}</span>
                        <span className="font-medium">{formatCurrency(item.price * item.qty)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm font-bold border-t border-border pt-2 mt-2">
                      <span>Total</span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {customer?.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="font-medium uppercase">{order.payment_method}</p>
                  </div>
                  {order.delivery_address && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Delivery Address</p>
                      <p className="font-medium">{order.delivery_address}</p>
                    </div>
                  )}
                  {order.special_instructions && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Special Instructions</p>
                      <p className="font-medium">{order.special_instructions}</p>
                    </div>
                  )}
                </div>

                {/* Status update */}
                {!['delivered', 'cancelled'].includes(order.status) && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {ORDER_STATUSES.filter((s) => s !== order.status).map((status) => (
                        <button
                          key={status}
                          onClick={() => onStatusUpdate(order.id, status)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-secondary border border-border hover:border-primary/30 hover:text-primary transition-colors font-medium capitalize"
                        >
                          {status.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
