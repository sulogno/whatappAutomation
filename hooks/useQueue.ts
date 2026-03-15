// hooks/useQueue.ts

'use client';

import { useEffect, useState, useCallback } from 'react';
import { subscribeToBusiness } from '@/lib/pusher-browser';
import type { QueueEntry } from '@/types';

export function useQueue(businessId: string | undefined) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch('/api/queue');
      if (!res.ok) throw new Error('Failed to fetch queue');
      const data = await res.json();
      setQueue(data.queue || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (!businessId) return;

    const unsubscribe = subscribeToBusiness(businessId, {
      'queue-updated': () => {
        fetchQueue();
      },
    });

    return unsubscribe;
  }, [businessId, fetchQueue]);

  const markDone = useCallback(async (entryId: string) => {
    // Optimistic update
    setQueue((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, status: 'done' as const } : e))
    );

    try {
      await fetch(`/api/queue/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
    } catch {
      // Revert on error
      fetchQueue();
    }
  }, [fetchQueue]);

  const markNoShow = useCallback(async (entryId: string) => {
    setQueue((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, status: 'no_show' as const } : e))
    );

    try {
      await fetch(`/api/queue/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'no_show' }),
      });
    } catch {
      fetchQueue();
    }
  }, [fetchQueue]);

  const removeEntry = useCallback(async (entryId: string) => {
    setQueue((prev) => prev.filter((e) => e.id !== entryId));

    try {
      await fetch(`/api/queue/${entryId}`, { method: 'DELETE' });
    } catch {
      fetchQueue();
    }
  }, [fetchQueue]);

  return { queue, isLoading, error, refetch: fetchQueue, markDone, markNoShow, removeEntry };
}
