'use client';

// app/dashboard/queue/page.tsx
import { useAppStore } from '@/store/useAppStore';
import { QueueBoard } from '@/components/queue/QueueBoard';

export default function QueuePage() {
  const { business } = useAppStore();

  if (!business) return null;

  return (
    <div>
      <QueueBoard businessId={business.id} />
    </div>
  );
}
