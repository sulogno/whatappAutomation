// hooks/useOrders.ts

'use client';

import { useEffect, useState, useCallback } from 'react';
import { subscribeToBusiness } from '@/lib/pusher-browser';
import type { Order } from '@/types';

export function useOrders(businessId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch('/api/orders?limit=20');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!businessId) return;

    const unsubscribe = subscribeToBusiness(businessId, {
      'new-order': () => fetchOrders(),
      'order-updated': () => fetchOrders(),
    });

    return unsubscribe;
  }, [businessId, fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: status as Order['status'] } : o))
    );
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      fetchOrders();
    }
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders, updateOrderStatus };
}
