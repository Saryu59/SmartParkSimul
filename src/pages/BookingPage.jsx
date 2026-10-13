import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookingForm } from '../components/reservations/BookingForm';

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const preselectedSlot = searchParams.get('slot');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-charcoal-900">Reserve a Parking Bay</h1>
      </div>

      <BookingForm preselectedSlotId={preselectedSlot} />
    </div>
  );
}
