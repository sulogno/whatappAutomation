// hooks/useDelivery.ts

'use client';

import { useEffect, useState, useCallback } from 'react';
import { subscribeToBusiness } from '@/lib/pusher-browser';
import type { DeliveryBoy } from '@/types';

export function useDelivery(businessId: string | undefined) {
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeliveryBoys = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch('/api/delivery');
      if (!res.ok) return;
      const data = await res.json();
      setDeliveryBoys(data.delivery_boys || []);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchDeliveryBoys();
  }, [fetchDeliveryBoys]);

  useEffect(() => {
    if (!businessId) return;
    const unsubscribe = subscribeToBusiness(businessId, {
      'delivery-update': () => fetchDeliveryBoys(),
    });
    return unsubscribe;
  }, [businessId, fetchDeliveryBoys]);

  return { deliveryBoys, isLoading, refetch: fetchDeliveryBoys };
}
