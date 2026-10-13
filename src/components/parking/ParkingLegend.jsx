import React from 'react';
import { SLOT_STATUS } from '../../constants/slots';

export function ParkingLegend({ stats }) {
  const items = [
    {
      status: SLOT_STATUS.AVAILABLE,
      label: 'Available',
      count: stats.availableSlots,
      ledClass: 'bg-[#176B4D] shadow-[0_0_8px_rgba(23,107,77,0.5)]',
      bgClass: 'border-[#C6E2D6] bg-[#EBF5F0] text-[#176B4D]',
    },
    {
      status: SLOT_STATUS.OCCUPIED,
      label: 'Occupied',
      count: stats.occupiedSlots,
      ledClass: 'bg-[#DC2626] shadow-[0_0_8px_rgba(220,38,38,0.5)]',
      bgClass: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]',
    },
    {
      status: SLOT_STATUS.RESERVED,
      label: 'Reserved',
      count: stats.reservedSlots,
      ledClass: 'bg-[#D97706] shadow-[0_0_8px_rgba(217,119,6,0.5)]',
      bgClass: 'border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]',
    },
    {
      status: SLOT_STATUS.OFFLINE,
      label: 'Sensor Offline',
      count: stats.offlineSlots,
      ledClass: 'bg-[#64748B]',
      bgClass: 'border-[#E2E8F0] bg-[#F1F5F9] text-[#475569]',
    },
    {
      status: SLOT_STATUS.OUT_OF_SERVICE,
      label: 'Out of Service',
      count: stats.outOfServiceSlots,
      ledClass: 'bg-[#475569]',
      bgClass: 'border-[#E2E8F0] bg-[#F8FAFC] text-[#334155]',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <div
          key={item.status}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${item.bgClass}`}
        >
          <span className={`w-2 h-2 rounded-full ${item.ledClass}`} />
          <span>{item.label}</span>
          <span className="font-bold text-xs bg-white/70 px-1.5 py-0.2 rounded-full">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
