import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useParking } from '../contexts/ParkingContext';
import { 
  Car, 
  MapPin, 
  Sparkles, 
  Bookmark, 
  QrCode, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  CalendarPlus,
  Wifi
} from 'lucide-react';
import { getRecommendedSlots } from '../utils/recommendationUtils';
import { formatTimeOnly, formatDateOnly } from '../utils/dateUtils';
import { RESERVATION_STATUS } from '../constants/reservations';
import { ParkingGrid } from '../components/parking/ParkingGrid';
import { QRCodeModal } from '../components/reservations/QRCodeModal';

export function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { slots, reservations, events, stats, simulatedTime } = useParking();
  const [selectedPassForQr, setSelectedPassForQr] = useState(null);

  // Next upcoming or active reservation for this user
  const activeOrUpcoming = reservations.find(
    (r) =>
      (!user?.id || r.userId === user?.id || r.userEmail === user?.email) &&
      (r.status === RESERVATION_STATUS.ACTIVE || r.status === RESERVATION_STATUS.UPCOMING)
  );

  // Top recommendation
  const recommendations = getRecommendedSlots(slots, {
    preferredZone: user?.preferredZone || 'ANY',
    prioritizeEntrance: true,
  });
  const topSlot = recommendations[0]?.slot;
  const topReason = recommendations[0]?.reasons[0];


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with greeting and primary CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#202923] tracking-tight">
            Hello, {user?.name ? user.name.split(' ')[0] : 'Driver'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/check-in"
            className="px-3.5 py-2 bg-white hover:bg-[#F7F8F6] text-[#202923] border border-[#E2E6E2] rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-[#176B4D]" />
            <span>Gate Scanner</span>
          </Link>
          <Link
            to="/reserve"
            className="px-4 py-2 bg-[#176B4D] hover:bg-[#135C42] text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Reserve Bay</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Performance Indicators Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Available Bays */}
        <div className="bg-white rounded-2xl border border-[#E2E6E2] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A968F]">
              Available
            </span>
            <span className="w-2 h-2 rounded-full bg-[#176B4D]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#202923] font-mono">
              {stats.availableSlots}
            </span>
            <span className="text-xs text-[#8A968F] font-mono">/ {stats.totalSlots}</span>
          </div>
        </div>

        {/* KPI 2: Occupied Bays */}
        <div className="bg-white rounded-2xl border border-[#E2E6E2] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A968F]">
              Occupied
            </span>
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#202923] font-mono">
              {stats.occupiedSlots}
            </span>
            <span className="text-xs text-[#8A968F] font-mono">/ {stats.totalSlots}</span>
          </div>
        </div>

        {/* KPI 3: Scheduled Holds */}
        <div className="bg-white rounded-2xl border border-[#E2E6E2] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A968F]">
              Reserved
            </span>
            <span className="w-2 h-2 rounded-full bg-[#D97706]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#202923] font-mono">
              {stats.reservedSlots}
            </span>
            <span className="text-xs text-[#8A968F] font-mono">/ {stats.totalSlots}</span>
          </div>
        </div>

        {/* KPI 4: Node Health */}
        <div className="bg-white rounded-2xl border border-[#E2E6E2] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A968F]">
              Online Sensors
            </span>
            <Wifi className="w-3.5 h-3.5 text-[#176B4D]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#202923] font-mono">
              {stats.totalSlots - stats.offlineSlots}
            </span>
            <span className="text-xs text-[#8A968F] font-mono">/ {stats.totalSlots}</span>
          </div>
        </div>
      </div>

      {/* 3. Parking Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#176B4D]" />
            <h2 className="text-sm font-bold text-[#202923] tracking-tight">
              Parking Map
            </h2>
          </div>
          <Link
            to="/map"
            className="text-xs text-[#176B4D] hover:underline font-medium flex items-center gap-1"
          >
            <span>Full Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ParkingGrid slots={slots} stats={stats} />
      </div>

      {/* 4. Driver Session & Smart Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card A: Your Active Driver Pass */}
        <div className="bg-white rounded-2xl border border-[#E2E6E2] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E6E2] pb-2.5">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#176B4D]" />
                <h2 className="font-bold text-[#202923] text-sm">Your Parking Pass</h2>
              </div>
              <Link to="/my-reservations" className="text-xs text-[#5E6962] hover:text-[#202923] font-medium">
                View All
              </Link>
            </div>

            {activeOrUpcoming ? (
              <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E2E6E2] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#176B4D] text-white font-mono font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                    {activeOrUpcoming.slotId}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#202923] text-sm">{activeOrUpcoming.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                        activeOrUpcoming.status === RESERVATION_STATUS.ACTIVE
                          ? 'bg-[#EBF5F0] text-[#176B4D] border-[#C6E2D6]'
                          : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                      }`}>
                        {activeOrUpcoming.status === RESERVATION_STATUS.ACTIVE ? 'Checked In' : 'Upcoming'}
                      </span>
                    </div>
                    <div className="text-xs text-[#5E6962] mt-0.5 font-mono">
                      {formatTimeOnly(activeOrUpcoming.startTime)} – {formatTimeOnly(activeOrUpcoming.endTime)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPassForQr(activeOrUpcoming)}
                    className="px-3 py-1.5 bg-white hover:bg-[#F7F8F6] border border-[#E2E6E2] text-[#202923] rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#176B4D]" />
                    <span>Pass</span>
                  </button>
                  <button
                    onClick={() => navigate(`/check-in?code=${activeOrUpcoming.id}`)}
                    className="px-3 py-1.5 bg-[#176B4D] hover:bg-[#135C42] text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
                  >
                    Gate
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#5E6962] space-y-1">
                <p className="font-semibold text-[#202923]">No active bookings</p>
                <p className="text-[11px] text-[#8A968F]">Reserve a slot to hold your space.</p>
              </div>
            )}
          </div>

          <div>
            {!activeOrUpcoming && (
              <Link
                to="/reserve"
                className="w-full py-2.5 px-3 bg-[#176B4D] hover:bg-[#135C42] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Reserve a Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Card B: Smart Slot Recommendation */}
        <div className="bg-white rounded-2xl border border-[#E2E6E2] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E6E2] pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#176B4D]" />
                <h2 className="font-bold text-[#202923] text-sm">Recommended Bay</h2>
              </div>
              <Link to="/recommendations" className="text-xs text-[#5E6962] hover:text-[#202923] font-medium">
                Preferences
              </Link>
            </div>

            {topSlot ? (
              <div className="p-4 rounded-xl bg-[#EBF5F0] border border-[#C6E2D6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#176B4D] text-white font-mono font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                    {topSlot.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#202923] text-sm">{topSlot.name}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-[#176B4D] border border-[#C6E2D6]">
                        Available
                      </span>
                    </div>
                    <div className="text-xs text-[#5E6962] mt-0.5 font-mono">
                      {topSlot.distanceToEntranceMeters}m to entrance • {topSlot.zone === 'A' ? 'Zone A' : 'Zone B'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/reserve?slot=${topSlot.id}`)}
                  className="px-3.5 py-1.5 bg-[#176B4D] hover:bg-[#135C42] text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 shrink-0"
                >
                  <span>Reserve</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#8A968F]">
                All bays are currently occupied.
              </div>
            )}
          </div>

          {topReason && (
            <div className="text-[11px] text-[#5E6962] flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#176B4D] shrink-0" />
              <span>{topReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Pass Modal */}
      {selectedPassForQr && (
        <QRCodeModal
          reservation={selectedPassForQr}
          isOpen={!!selectedPassForQr}
          onClose={() => setSelectedPassForQr(null)}
        />
      )}
    </div>
  );
}
