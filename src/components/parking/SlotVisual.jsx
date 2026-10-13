import React from 'react';
import { SLOT_STATUS } from '../../constants/slots';
import { Car, Accessibility, WifiOff, Wrench, Clock, CheckCircle2 } from 'lucide-react';

export function SlotVisual({ slot, onSelect, isSelected = false }) {
  const isAvailable = slot.status === SLOT_STATUS.AVAILABLE;
  const isOccupied = slot.status === SLOT_STATUS.OCCUPIED;
  const isReserved = slot.status === SLOT_STATUS.RESERVED;
  const isOffline = slot.status === SLOT_STATUS.OFFLINE;
  const isMaintenance = slot.status === SLOT_STATUS.OUT_OF_SERVICE;

  // Status-driven styling
  const getBayStyle = () => {
    if (isMaintenance) {
      return 'bg-[#222724] border-[#475569]/60 text-slate-200 hover:border-[#64748B]';
    }
    if (isOffline) {
      return 'bg-[#1F2421] border-[#64748B]/50 text-slate-300 hover:border-[#94A3B8]';
    }
    if (isOccupied) {
      return 'bg-[#2A1D20] border-[#DC2626]/60 text-rose-100 hover:border-[#DC2626]';
    }
    if (isReserved) {
      return 'bg-[#2A2318] border-[#D97706]/60 text-amber-100 hover:border-[#D97706]';
    }
    // Available
    return 'bg-[#18261F] border-[#176B4D]/70 text-emerald-100 hover:border-[#176B4D] hover:shadow-[0_0_15px_rgba(23,107,77,0.25)]';
  };

  const getLedGlow = () => {
    if (isMaintenance) return 'bg-[#64748B] shadow-[0_0_8px_rgba(100,116,139,0.7)]';
    if (isOffline) return 'bg-[#94A3B8]';
    if (isOccupied) return 'bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.8)]';
    if (isReserved) return 'bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.8)]';
    return 'bg-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.8)]';
  };

  const getStatusBadge = () => {
    if (isMaintenance) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Maintenance
        </span>
      );
    }
    if (isOffline) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Sensor Offline
        </span>
      );
    }
    if (isOccupied) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Occupied
        </span>
      );
    }
    if (isReserved) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Reserved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Available
      </span>
    );
  };

  return (
    <button
      onClick={() => onSelect(slot)}
      className={`relative w-full aspect-[4/5] rounded-xl border-2 p-3 transition-all flex flex-col justify-between text-left group focus:outline-none ${getBayStyle()} ${
        isSelected ? 'ring-2 ring-offset-2 ring-offset-[#161D19] ring-[#22C55E] border-white shadow-lg' : 'hover:scale-[1.02]'
      }`}
    >
      {/* Top Stall Curb & Wheel Stop bar */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/20 rounded-full" />

      {/* Header: Stall ID, Sensor LED & Pin */}
      <div className="flex items-center justify-between w-full pt-1">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-base tracking-tight text-white font-mono">
            {slot.id}
          </span>
          {slot.isAccessible && (
            <span title="Accessible Priority Bay" className="text-sky-400">
              <Accessibility className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Optical Sensor LED status indicator */}
        <div className="flex items-center gap-1.5" title={`IR Obstacle Sensor (GPIO ${slot.sensor?.gpioPin || 'N/A'})`}>
          <span className={`w-2 h-2 rounded-full ${getLedGlow()}`} />
          <span className="text-[10px] font-mono font-medium text-white/50">
            P{slot.sensor?.gpioPin || '??'}
          </span>
        </div>
      </div>

      {/* Center Top-Down Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center py-2 relative">
        {/* State: OCCUPIED (Detailed Top-Down Architectural Vehicle) */}
        {isOccupied && (
          <div className="relative flex flex-col items-center animate-in zoom-in-95 duration-200">
            {/* Top-down vehicle vector */}
            <div className="w-14 h-22 sm:w-16 sm:h-24 bg-gradient-to-b from-[#2E3732] to-[#1F2722] rounded-lg shadow-lg border border-white/20 flex flex-col items-center justify-between p-1 relative">
              {/* Front windshield & hood */}
              <div className="w-10 h-3.5 bg-sky-400/30 rounded-t-sm border border-sky-300/30 flex items-center justify-center">
                <div className="w-6 h-0.5 bg-sky-200/40 rounded-full" />
              </div>

              {/* Tinted panoramic roof with side mirrors */}
              <div className="relative w-full flex items-center justify-center my-0.5">
                {/* Left mirror */}
                <span className="absolute -left-1.5 top-0 w-1 h-2 bg-[#2E3732] rounded-l" />
                {/* Center roof */}
                <div className="w-9 h-10 bg-[#161D19] rounded border border-white/10 flex items-center justify-center">
                  <Car className="w-4 h-4 text-white/40" />
                </div>
                {/* Right mirror */}
                <span className="absolute -right-1.5 top-0 w-1 h-2 bg-[#2E3732] rounded-r" />
              </div>

              {/* Rear windshield & taillights */}
              <div className="w-10 h-3 bg-sky-400/20 rounded-b-sm border border-sky-300/20 flex items-center justify-between px-1">
                <span className="w-1.5 h-1 bg-rose-500 rounded-xs shadow-xs shadow-rose-500" />
                <span className="w-1.5 h-1 bg-rose-500 rounded-xs shadow-xs shadow-rose-500" />
              </div>
            </div>
          </div>
        )}

        {/* State: RESERVED */}
        {isReserved && !isOccupied && (
          <div className="flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <span className="text-[10px] font-mono text-amber-300 font-semibold truncate max-w-[95px]">
              {slot.activeReservationId ? `#${slot.activeReservationId}` : 'Pass Held'}
            </span>
            <span className="text-[9px] text-amber-400/70">Awaiting vehicle</span>
          </div>
        )}

        {/* State: AVAILABLE */}
        {isAvailable && (
          <div className="flex flex-col items-center text-center group-hover:scale-105 transition-transform duration-200">
            <div className="w-11 h-11 rounded-full bg-[#176B4D]/30 border border-[#22C55E]/40 flex items-center justify-center mb-1.5 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
              <span className="font-extrabold text-base text-[#4ADE80] font-mono">P</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300/80 font-medium">
              {slot.distanceToEntranceMeters}m walk
            </span>
            <span className="text-[9px] text-[#22C55E] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Click to reserve
            </span>
          </div>
        )}

        {/* State: OFFLINE */}
        {isOffline && (
          <div className="flex flex-col items-center text-center text-slate-400">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-1">
              <WifiOff className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-[9px] font-mono text-slate-400">Signal Lost</span>
          </div>
        )}

        {/* State: OUT OF SERVICE */}
        {isMaintenance && (
          <div className="flex flex-col items-center text-center text-slate-300">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-1">
              <Wrench className="w-5 h-5 text-slate-300" />
            </div>
            <span className="text-[9px] font-mono text-slate-400">Maintenance</span>
          </div>
        )}
      </div>

      {/* Footer: Text status badge and Bay details */}
      <div className="w-full pt-1.5 border-t border-white/10 flex items-center justify-between">
        {getStatusBadge()}
        <span className="text-[10px] font-mono text-white/50">
          {slot.zone === 'A' ? 'Zn A' : 'Zn B'}
        </span>
      </div>
    </button>
  );
}
