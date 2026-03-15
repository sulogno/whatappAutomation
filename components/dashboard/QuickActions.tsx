'use client';

// components/dashboard/QuickActions.tsx
import { useState } from 'react';
import { Power, BellOff, Send } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export function QuickActions() {
  const { business, setBusiness, isAiEnabled, setAiEnabled } = useAppStore();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const toggleOpen = async () => {
    if (!business) return;
    setIsLoading('open');
    try {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !business.is_open }),
      });
      if (res.ok) {
        const data = await res.json();
        setBusiness(data.business);
      }
    } finally {
      setIsLoading(null);
    }
  };

  const toggleAi = async () => {
    setIsLoading('ai');
    setAiEnabled(!isAiEnabled);
    setIsLoading(null);
  };

  const actions = [
    {
      id: 'open',
      label: business?.is_open ? 'Mark Closed' : 'Mark Open',
      icon: Power,
      onClick: toggleOpen,
      active: business?.is_open,
      activeClass: 'bg-green-100 text-green-700 border-green-200',
      inactiveClass: 'bg-red-100 text-red-700 border-red-200',
    },
    {
      id: 'ai',
      label: isAiEnabled ? 'Pause AI' : 'Resume AI',
      icon: BellOff,
      onClick: toggleAi,
      active: isAiEnabled,
      activeClass: 'bg-primary/10 text-primary border-primary/20',
      inactiveClass: 'bg-amber-100 text-amber-700 border-amber-200',
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={isLoading === action.id}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold',
              'transition-all hover:shadow-sm disabled:opacity-60',
              action.active ? action.activeClass : action.inactiveClass
            )}
          >
            <Icon className="w-4 h-4" />
            {isLoading === action.id ? 'Updating...' : action.label}
          </button>
        );
      })}
    </div>
  );
}
