'use client';

// components/queue/QueueBoard.tsx
import { useState } from 'react';
import { useQueue } from '@/hooks/useQueue';
import { QueueCard } from './QueueCard';
import { AddWalkinModal } from './AddWalkinModal';
import { QueueStats } from './QueueStats';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, ChevronRight } from 'lucide-react';

interface QueueBoardProps {
  businessId: string;
}

export function QueueBoard({ businessId }: QueueBoardProps) {
  const { queue, isLoading, markDone, markNoShow, removeEntry, refetch } = useQueue(businessId);
  const [showAddModal, setShowAddModal] = useState(false);

  const activeQueue = queue.filter((e) => ['waiting', 'in_service', 'called'].includes(e.status));
  const inService = queue.find((e) => e.status === 'in_service');

  const handleNext = async () => {
    if (!inService) return;
    await markDone(inService.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Queue — Today</h2>
          <p className="text-sm text-muted-foreground">
            {activeQueue.length} customer{activeQueue.length !== 1 ? 's' : ''} waiting
          </p>
        </div>
        <div className="flex gap-3">
          {inService && (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              Next Customer Done
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-all border border-border"
          >
            <Plus className="w-4 h-4" />
            Add Walk-in
          </button>
        </div>
      </div>

      {/* Stats */}
      <QueueStats businessId={businessId} queue={queue} />

      {/* Queue list */}
      {activeQueue.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="Queue is empty"
          description="No customers waiting right now. Walk-ins can be added using the button above."
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Walk-in
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {activeQueue.map((entry, index) => (
            <QueueCard
              key={entry.id}
              entry={entry}
              position={index + 1}
              onMarkDone={() => markDone(entry.id)}
              onMarkNoShow={() => markNoShow(entry.id)}
              onRemove={() => removeEntry(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Done today */}
      {queue.filter((e) => e.status === 'done').length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Completed Today ({queue.filter((e) => e.status === 'done').length})
          </h3>
          <div className="space-y-2">
            {queue
              .filter((e) => e.status === 'done')
              .slice(-5)
              .reverse()
              .map((entry) => (
                <QueueCard
                  key={entry.id}
                  entry={entry}
                  position={0}
                  onMarkDone={() => {}}
                  onMarkNoShow={() => {}}
                  onRemove={() => removeEntry(entry.id)}
                  dimmed
                />
              ))}
          </div>
        </div>
      )}

      {/* Add walk-in modal */}
      <AddWalkinModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
