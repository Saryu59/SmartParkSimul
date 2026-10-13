import React, { useState, useMemo } from 'react';
import { SlotVisual } from './SlotVisual';
import { SlotDetailModal } from './SlotDetailModal';
import { ParkingLegend } from './ParkingLegend';
import { SLOT_STATUS, ZONES } from '../../constants/slots';
import { Search, Filter, ArrowUp, ArrowDown, LogIn, LogOut as GateExit, Building2 } from 'lucide-react';

export function ParkingGrid({ slots, stats }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filter slots based on user criteria
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Search query (e.g. "A1", "Zone A")
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesId = slot.id.toLowerCase().includes(query);
        const matchesName = slot.name.toLowerCase().includes(query);
        const matchesZone = `zone ${slot.zone}`.toLowerCase().includes(query);
        if (!matchesId && !matchesName && !matchesZone) return false;
      }

      // Zone filter
      if (zoneFilter !== 'ALL' && slot.zone !== zoneFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && slot.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [slots, searchQuery, zoneFilter, statusFilter]);

  // Split into Zone A and Zone B for physical layout rendering
  const zoneASlots = filteredSlots.filter((s) => s.zone === 'A');
  const zoneBSlots = filteredSlots.filter((s) => s.zone === 'B');

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E6E2] shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8A968F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter slot ID or zone (e.g. A1, B2)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E2E6E2] rounded-lg bg-[#F7F8F6] text-[#202923] focus:outline-none focus:ring-2 focus:ring-[#176B4D]/20 focus:border-[#176B4D] transition"
            />
          </div>

          {/* Quick Zone Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-[#8A968F] font-medium">Zone:</span>
            {['ALL', 'A', 'B'].map((z) => (
              <button
                key={z}
                onClick={() => setZoneFilter(z)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  zoneFilter === z
                    ? 'bg-[#176B4D] text-white shadow-xs'
                    : 'bg-[#F7F8F6] text-[#5E6962] hover:bg-[#EBF5F0] hover:text-[#176B4D] border border-[#E2E6E2]'
                }`}
              >
                {z === 'ALL' ? 'All Bays' : `Zone ${z}`}
              </button>
            ))}

            <span className="text-xs text-[#8A968F] font-medium ml-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-[#E2E6E2] rounded-lg px-2.5 py-1.5 bg-[#F7F8F6] text-[#202923] focus:outline-none focus:ring-2 focus:ring-[#176B4D]/20"
            >
              <option value="ALL">All Statuses</option>
              <option value={SLOT_STATUS.AVAILABLE}>Available</option>
              <option value={SLOT_STATUS.OCCUPIED}>Occupied</option>
              <option value={SLOT_STATUS.RESERVED}>Reserved</option>
              <option value={SLOT_STATUS.OFFLINE}>Sensor Offline</option>
              <option value={SLOT_STATUS.OUT_OF_SERVICE}>Out of Service</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-[#E2E6E2]">
          <ParkingLegend stats={stats} />
        </div>
      </div>

      {/* Realistic Architectural Top-Down Parking Lot View (The Visual Centerpiece) */}
      <div className="bg-[#161D19] rounded-2xl p-5 sm:p-7 border-2 border-[#28322B] shadow-card overflow-hidden text-slate-100 relative">
        {/* Entrance Gate and Facility Lobby Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-dashed border-white/15 mb-5 gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#4ADE80] bg-[#176B4D]/30 border border-[#176B4D]/60 px-3 py-1 rounded-lg">
            <LogIn className="w-3.5 h-3.5 text-[#4ADE80]" />
            <span>Entry Gate</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-white/90 bg-white/10 px-3 py-1 rounded-lg border border-white/15">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Main Lobby</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-800/60 px-3 py-1 rounded-lg">
            <GateExit className="w-3.5 h-3.5 text-rose-400" />
            <span>Exit Gate</span>
          </div>
        </div>

        {/* Parking Lot Lanes */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-5 items-center">
          {/* Zone A Bays (Left / North) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-white/70">
              <span className="flex items-center gap-1.5 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                Zone A
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {zoneASlots.length > 0 ? (
                zoneASlots.map((slot) => (
                  <SlotVisual
                    key={slot.id}
                    slot={slot}
                    onSelect={setSelectedSlot}
                    isSelected={selectedSlot?.id === slot.id}
                  />
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-xs text-white/40 bg-white/5 rounded-xl border border-white/10">
                  No slots match filter in Zone A.
                </div>
              )}
            </div>
          </div>

          {/* Central Two-Way Drive Lane */}
          <div className="lg:col-span-1 hidden lg:flex flex-col items-center justify-between py-3 h-full border-x border-dashed border-white/20 bg-black/20 rounded-md px-1 min-h-[220px]">
            <div className="flex flex-col items-center gap-1 text-[10px] font-mono font-medium text-white/60">
              <ArrowDown className="w-3 h-3 text-white/60" />
              <span>IN</span>
            </div>
            
            <div className="w-6 h-6 rounded-full border border-white/20 bg-white/5 flex items-center justify-center font-mono text-[9px] text-white/60">
              10
            </div>

            <div className="flex flex-col items-center gap-1 text-[10px] font-mono font-medium text-white/60">
              <span>OUT</span>
              <ArrowUp className="w-3 h-3 text-white/60" />
            </div>
          </div>

          {/* Zone B Bays (Right / South) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-white/70">
              <span className="flex items-center gap-1.5 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Zone B
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {zoneBSlots.length > 0 ? (
                zoneBSlots.map((slot) => (
                  <SlotVisual
                    key={slot.id}
                    slot={slot}
                    onSelect={setSelectedSlot}
                    isSelected={selectedSlot?.id === slot.id}
                  />
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-xs text-white/40 bg-white/5 rounded-xl border border-white/10">
                  No slots match filter in Zone B.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slot Inspection & Booking Modal */}
      <SlotDetailModal
        slot={selectedSlot}
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
      />
    </div>
  );
}
