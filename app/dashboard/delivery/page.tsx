'use client';

// app/dashboard/delivery/page.tsx
import { useAppStore } from '@/store/useAppStore';
import { DeliveryBoard } from '@/components/delivery/DeliveryBoard';

export default function DeliveryPage() {
  const { business } = useAppStore();
  if (!business) return null;
  return <DeliveryBoard businessId={business.id} />;
}
