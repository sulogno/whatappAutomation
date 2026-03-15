'use client';

// components/delivery/DeliveryBoard.tsx
import { useState } from 'react';
import { useDelivery } from '@/hooks/useDelivery';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, Truck, Phone, CheckCircle, XCircle } from 'lucide-react';

interface DeliveryBoardProps {
  businessId: string;
}

export function DeliveryBoard({ businessId }: DeliveryBoardProps) {
  const { deliveryBoys, isLoading, refetch } = useDelivery(businessId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', whatsappNumber: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: '', phone: '', whatsappNumber: '' });
        setShowAddForm(false);
        refetch();
      }
    } finally {
      setIsAdding(false);
    }
  };

  const toggleAvailability = async (boyId: string, isAvailable: boolean) => {
    await fetch(`/api/delivery/${boyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: isAvailable }),
    });
    refetch();
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Delivery Team</h2>
          <p className="text-sm text-muted-foreground">
            {deliveryBoys.filter((b) => b.is_available).length} of {deliveryBoys.length} available
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Delivery Boy
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-fade-in">
          <h3 className="font-bold">Add Delivery Boy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Full Name', placeholder: 'Rahul Kumar' },
              { key: 'phone', label: 'Phone Number', placeholder: '9876543210' },
              { key: 'whatsappNumber', label: 'WhatsApp Number', placeholder: '9876543210' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1.5">{label}</label>
                <input
                  type="text"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  required
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isAdding}
              className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-secondary text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {deliveryBoys.length === 0 ? (
        <EmptyState
          icon="🛵"
          title="No delivery boys yet"
          description="Add your delivery team to start coordinating deliveries via WhatsApp."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveryBoys.map((boy) => (
            <div key={boy.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center font-bold text-lg">
                  {boy.name.charAt(0)}
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${
                  boy.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {boy.is_available ? (
                    <><CheckCircle className="w-3 h-3" /> Available</>
                  ) : (
                    <><XCircle className="w-3 h-3" /> Busy</>
                  )}
                </div>
              </div>
              <h3 className="font-bold">{boy.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Phone className="w-3 h-3" />
                {boy.whatsapp_number}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Truck className="w-3 h-3" />
                {boy.total_deliveries} deliveries total
              </div>
              <button
                onClick={() => toggleAvailability(boy.id, !boy.is_available)}
                className="mt-3 w-full text-xs py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium"
              >
                Mark {boy.is_available ? 'Unavailable' : 'Available'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
