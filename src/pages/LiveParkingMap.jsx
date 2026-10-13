import React from 'react';
import { useParking } from '../contexts/ParkingContext';
import { ParkingGrid } from '../components/parking/ParkingGrid';

export function LiveParkingMap() {
  const { slots, stats } = useParking();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#202923] tracking-tight">Live Parking Map</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#EBF5F0] border border-[#C6E2D6] text-[#176B4D] text-xs font-semibold font-mono">
            {stats.availableSlots} Available
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-semibold font-mono">
            {stats.occupiedSlots} Occupied
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-semibold font-mono">
            {stats.reservedSlots} Reserved
          </div>
        </div>
      </div>

      {/* Main Interactive Map & Visualizer */}
      <ParkingGrid slots={slots} stats={stats} />
    </div>
  );
}
