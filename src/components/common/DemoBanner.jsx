import React, { useState } from 'react';
import { isDemoMode } from '../../services/config';
import { useParking } from '../../contexts/ParkingContext';
import { formatTimeOnly } from '../../utils/dateUtils';
import { Sliders, Clock, AlertCircle } from 'lucide-react';
import { DemoControlsDrawer } from './DemoControlsDrawer';

export function DemoBanner() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { simulatedTime, isClockOffset, clockOffsetMinutes } = useParking();

  if (!isDemoMode()) return null;

  return (
    <>
      <aside 
        aria-label="Demo mode status and controls"
        className="bg-[#F0F7F4] border-b border-[#C6E2D6] px-4 py-1.5 text-xs text-[#176B4D] transition flex items-center justify-between z-30"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono font-semibold text-[10px] bg-[#176B4D] text-white tracking-wider uppercase shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Demo Mode
          </span>
          {isClockOffset && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#C6E2D6] text-[#176B4D] font-mono text-[11px] shrink-0 font-medium">
              <Clock className="w-3 h-3 text-[#176B4D]" />
              {formatTimeOnly(simulatedTime.toISOString())} (+{clockOffsetMinutes}m)
            </span>
          )}
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#C6E2D6] text-[#176B4D] hover:bg-[#EBF5F0] font-medium text-xs shadow-xs transition shrink-0 ml-2"
        >
          <Sliders className="w-3.5 h-3.5 text-[#176B4D]" />
          <span>Simulate Hardware</span>
        </button>
      </aside>

      <DemoControlsDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
