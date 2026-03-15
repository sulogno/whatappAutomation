// components/shared/StatusBadge.tsx

import { cn } from '@/lib/utils';
import type { QueueStatus, OrderStatus, DeliveryAssignmentStatus } from '@/types';

type Status = QueueStatus | OrderStatus | DeliveryAssignmentStatus | string;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Queue
  waiting: { label: 'Waiting', className: 'bg-blue-100 text-blue-700' },
  called: { label: 'Called', className: 'bg-purple-100 text-purple-700' },
  in_service: { label: 'In Service', className: 'bg-green-100 text-green-700' },
  done: { label: 'Done', className: 'bg-gray-100 text-gray-500' },
  no_show: { label: 'No Show', className: 'bg-red-100 text-red-600' },
  // Orders
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparing', className: 'bg-orange-100 text-orange-700' },
  ready: { label: 'Ready', className: 'bg-teal-100 text-teal-700' },
  out_for_delivery: { label: 'Out for Delivery', className: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
  // Delivery
  accepted: { label: 'Accepted', className: 'bg-teal-100 text-teal-700' },
  picked: { label: 'Picked Up', className: 'bg-purple-100 text-purple-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-600' },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-600' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
