'use client';

// components/queue/QueueCard.tsx
import { cn } from '@/lib/utils';
import { Check, UserX, Trash2, Phone } from 'lucide-react';
import type { QueueEntry } from '@/types';

interface QueueCardProps {
  entry: QueueEntry;
  position: number;
  onMarkDone: () => void;
  onMarkNoShow: () => void;
  onRemove: () => void;
  dimmed?: boolean;
}

const ENTRY_TYPE_CONFIG = {
  walkin: { label: 'Walk-in', className: 'bg-blue-100 text-blue-700' },
  booking: { label: 'Booked', className: 'bg-amber-100 text-amber-700' },
  online: { label: 'Online', className: 'bg-green-100 text-green-700' },
};

const STATUS_BORDER = {
  waiting: 'border-l-blue-400',
  called: 'border-l-purple-400',
  in_service: 'border-l-green-500',
  done: 'border-l-gray-300',
  no_show: 'border-l-red-400',
};

const TOKEN_BG = {
  waiting: 'bg-blue-100 text-blue-800',
  called: 'bg-purple-100 text-purple-800',
  in_service: 'bg-green-100 text-green-800 animate-token-pulse',
  done: 'bg-gray-100 text-gray-500',
  no_show: 'bg-red-100 text-red-700',
};

export function QueueCard({ entry, position, onMarkDone, onMarkNoShow, onRemove, dimmed }: QueueCardProps) {
  const typeConfig = ENTRY_TYPE_CONFIG[entry.entry_type];
  const isActive = ['waiting', 'in_service', 'called'].includes(entry.status);

  return (
    <div
      className={cn(
        'queue-card border-l-4 animate-slide-up',
        STATUS_BORDER[entry.status] || 'border-l-gray-300',
        dimmed && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Token number */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0',
            TOKEN_BG[entry.status] || 'bg-gray-100 text-gray-600'
          )}
        >
          {entry.token_number}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">
              {entry.customer_name || `Token #${entry.token_number}`}
            </p>
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                typeConfig.className
              )}
            >
              {typeConfig.label}
            </span>
            {entry.status === 'in_service' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                ● In Service
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {entry.service_type && (
              <span className="text-xs text-muted-foreground">{entry.service_type}</span>
            )}
            {entry.customer_phone && (
              <a
                href={`tel:${entry.customer_phone}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                <Phone className="w-3 h-3" />
                {entry.customer_phone}
              </a>
            )}
            {entry.estimated_wait !== null && entry.status === 'waiting' && (
              <span className="text-xs text-muted-foreground">
                ~{entry.estimated_wait}m wait
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {isActive && !dimmed && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {entry.status === 'in_service' && (
              <button
                onClick={onMarkDone}
                className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Done
              </button>
            )}
            {entry.status === 'waiting' && (
              <button
                onClick={onMarkNoShow}
                className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors"
              >
                <UserX className="w-3.5 h-3.5" />
                No Show
              </button>
            )}
            <button
              onClick={onRemove}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
