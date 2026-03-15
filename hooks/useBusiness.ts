// hooks/useBusiness.ts

'use client';

import { useEffect, useState } from 'react';
import type { Business } from '@/types';

export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch('/api/businesses');
        if (res.status === 404) {
          setBusiness(null);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch business');
        const data = await res.json();
        setBusiness(data.business);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchBusiness();
  }, []);

  const updateBusiness = async (id: string, updates: Partial<Business>) => {
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setBusiness(data.business);
    }
    return res;
  };

  return { business, isLoading, error, updateBusiness };
}
