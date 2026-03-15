'use client';

// app/dashboard/bookings/page.tsx
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatTime, getTodayDate } from '@/lib/utils';
import { Calendar, Clock, Phone } from 'lucide-react';
import type { Booking } from '@/types';

export default function BookingsPage() {
  const { business } = useAppStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const fetchBookings = async () => {
    if (!business) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [business, selectedDate]);

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchBookings();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground">Appointments booked via WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No bookings for this date"
          description="Customers can book appointments via WhatsApp and they'll appear here."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{booking.customer_name || 'Customer'}</h3>
                    <StatusBadge status={booking.status} />
                    {booking.reminder_sent && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Reminded ✓
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {booking.service_type && (
                      <span className="font-medium text-foreground">{booking.service_type}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(booking.slot_time)}
                    </span>
                    {booking.customer_phone && (
                      <a
                        href={`tel:${booking.customer_phone}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {booking.customer_phone}
                      </a>
                    )}
                    <span>~{booking.slot_duration} min</span>
                  </div>
                  {booking.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">"{booking.notes}"</p>
                  )}
                </div>
                {booking.status === 'confirmed' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'completed')}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-200 transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'no_show')}
                      className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-200 transition-colors"
                    >
                      No Show
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                      className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
