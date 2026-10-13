import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

export function UnreservedAlertBanner({ unreservedSlots, onReview }) {
  if (!unreservedSlots || unreservedSlots.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200/90 rounded-xl p-4 text-red-900 shadow-xs space-y-2 animate-in slide-in-from-top-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-red-950">
              Unreserved Occupancy Alert ({unreservedSlots.length})
            </h4>
            <p className="text-xs text-red-800">
              Vehicle detected without active booking.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-red-600 text-white font-semibold text-[11px] rounded-full uppercase tracking-wider">
          Action Required
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {unreservedSlots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-red-200 text-xs shadow-xs"
          >
            <span className="font-bold text-red-950">Bay {slot.id}</span>
            <span className="text-charcoal-400 text-[11px]">GPIO {slot.sensor?.gpioPin}</span>
            <span className="text-red-700 font-medium text-[11px]">No active reservation</span>
          </div>
        ))}
      </div>
    </div>
  );
}
