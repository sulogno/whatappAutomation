'use client';

// components/queue/AddWalkinModal.tsx
import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

interface AddWalkinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddWalkinModal({ open, onClose, onSuccess }: AddWalkinModalProps) {
  const [form, setForm] = useState({ customerName: '', serviceType: '', customerPhone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ tokenNumber?: number; estimatedWait?: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/queue/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ tokenNumber: data.tokenNumber, estimatedWait: data.estimatedWait });
        onSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ customerName: '', serviceType: '', customerPhone: '' });
    setResult(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-bold text-lg">Add Walk-in</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-secondary rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {result ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-primary">#{result.tokenNumber}</span>
            </div>
            <h3 className="text-xl font-bold mb-1">Token Assigned!</h3>
            <p className="text-muted-foreground text-sm">
              Estimated wait: ~{result.estimatedWait || 0} minutes
            </p>
            <button
              onClick={handleClose}
              className="mt-6 w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Customer Name *</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Service Type</label>
              <input
                type="text"
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                placeholder="e.g. Haircut, Consultation"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Phone Number{' '}
                <span className="text-muted-foreground font-normal">(for WhatsApp notification)</span>
              </label>
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !form.customerName.trim()}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add to Queue
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
