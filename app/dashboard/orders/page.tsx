'use client';

// app/dashboard/orders/page.tsx
import { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { useAppStore } from '@/store/useAppStore';
import { OrdersList } from '@/components/orders/OrdersList';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const { business } = useAppStore();
  const { orders, isLoading, updateOrderStatus } = useOrders(business?.id);
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = activeFilter === 'all' ? orders : orders.filter((o) => o.status === activeFilter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">All orders from WhatsApp customers</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFilter === status
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
            {status !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                {orders.filter((o) => o.status === status).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <OrdersList orders={filtered} onStatusUpdate={updateOrderStatus} />
      )}
    </div>
  );
}
