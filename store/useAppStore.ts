// store/useAppStore.ts

import { create } from 'zustand';
import type { Business, QueueEntry, Order } from '@/types';

interface AppState {
  business: Business | null;
  setBusiness: (business: Business | null) => void;

  queue: QueueEntry[];
  setQueue: (queue: QueueEntry[]) => void;
  updateQueueEntry: (id: string, updates: Partial<QueueEntry>) => void;

  orders: Order[];
  setOrders: (orders: Order[]) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;

  unreadMessages: number;
  incrementUnread: () => void;
  clearUnread: () => void;

  isAiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  business: null,
  setBusiness: (business) => set({ business }),

  queue: [],
  setQueue: (queue) => set({ queue }),
  updateQueueEntry: (id, updates) =>
    set((state) => ({
      queue: state.queue.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    })),

  orders: [],
  setOrders: (orders) => set({ orders }),
  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id ? { ...order, ...updates } : order
      ),
    })),

  unreadMessages: 0,
  incrementUnread: () =>
    set((state) => ({ unreadMessages: state.unreadMessages + 1 })),
  clearUnread: () => set({ unreadMessages: 0 }),

  isAiEnabled: true,
  setAiEnabled: (enabled) => set({ isAiEnabled: enabled }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
