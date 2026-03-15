'use client';

// components/queue/QueueStats.tsx
import type { QueueEntry } from '@/types';

interface QueueStatsProps {
  businessId: string;
  queue: QueueEntry[];
}

export function QueueStats({ queue }: QueueStatsProps) {
  const serving = queue.filter((e) => e.status === 'in_service').length;
  const waiting = queue.filter((e) => e.status === 'waiting').length;
  const doneToday = queue.filter((e) => e.status === 'done').length;

  const completedWithTime = queue.filter(
    (e) => e.status === 'done' && e.actual_start && e.actual_end
  );
  const avgWait =
    completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce((sum, e) => {
            const start = new Date(e.actual_start!).getTime();
            const end = new Date(e.actual_end!).getTime();
            return sum + (end - start) / 60000;
          }, 0) / completedWithTime.length
        )
      : 30;

  const stats = [
    { label: 'Serving', value: serving, color: 'text-green-600' },
    { label: 'Waiting', value: waiting, color: 'text-blue-600' },
    { label: 'Done Today', value: doneToday, color: 'text-gray-600' },
    { label: 'Avg Wait', value: `${avgWait}m`, color: 'text-amber-600' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-xl p-3 text-center"
        >
          <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
