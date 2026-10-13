import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { SLOT_STATUS } from '../../constants/slots';
import { formatDateTime, getRelativeTimeFromNow } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useParking } from '../../contexts/ParkingContext';
import { 
  Car, 
  Clock, 
  Cpu, 
  Wifi, 
  Battery, 
  MapPin, 
  Accessibility, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  AlertTriangle,
  Info
} from 'lucide-react';

export function SlotDetailModal({ slot, isOpen, onClose }) {
  const navigate = useNavigate();
  const { isLoggedIn, isGuest } = useAuth();
  const { reservations, simulatedTime } = useParking();

  if (!slot) return null;

  const isBookable = slot.status === SLOT_STATUS.AVAILABLE;
  const activeRes = slot.activeReservationId
    ? reservations.find((r) => r.id === slot.activeReservationId)
    : null;

  const getDisabledReason = () => {
    switch (slot.status) {
      case SLOT_STATUS.OCCUPIED:
        return 'Physical vehicle is present in this parking bay.';
      case SLOT_STATUS.RESERVED:
        return 'An active or upcoming booking is held for this slot.';
      case SLOT_STATUS.OFFLINE:
        return 'Sensor communication is offline; availability cannot be verified.';
      case SLOT_STATUS.OUT_OF_SERVICE:
        return 'This slot is designated out of service for maintenance.';
      default:
        return null;
    }
  };

  const handleBookClick = () => {
    onClose();
    if (!isLoggedIn) {
      navigate('/login?redirect=/reserve&slot=' + slot.id);
    } else {
      navigate(`/reserve?slot=${slot.id}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Slot ${slot.id} Details`} maxWidth="max-w-xl">
      <div className="space-y-4 text-xs">
        {/* Top summary card */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#F7F8F6] border border-[#E2E6E2]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#E2E6E2] flex items-center justify-center font-extrabold text-lg text-[#202923] shadow-xs font-mono">
              {slot.id}
            </div>
            <div>
              <div className="font-semibold text-sm text-[#202923]">{slot.name}</div>
              <div className="text-[11px] text-[#5E6962] flex items-center gap-2 mt-0.5 font-mono">
                <span>{slot.zone === 'A' ? 'Zone A' : 'Zone B'}</span>
                <span>•</span>
                <span>{slot.distanceToEntranceMeters}m to entrance</span>
              </div>
            </div>
          </div>
          <StatusBadge status={slot.status} size="lg" />
        </div>

        {/* Accessibility Tag if applicable */}
        {slot.isAccessible && (
          <div className="flex items-center gap-2 p-2.5 bg-[#EBF5F0] border border-[#C6E2D6] rounded-xl text-[#176B4D] text-xs font-medium">
            <Accessibility className="w-4 h-4 text-[#176B4D] shrink-0" />
            <span>Accessible Priority Bay</span>
          </div>
        )}

        {/* Physical Occupancy vs Reservation Separation Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-[#E2E6E2] bg-white">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8A968F] uppercase tracking-wider mb-2">
              <Car className="w-3.5 h-3.5 text-[#202923]" />
              <span>Physical Presence</span>
            </div>
            <div className="flex items-center gap-2">
              {slot.isOccupied ? (
                <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  Vehicle Detected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[#176B4D] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4D]" />
                  Bay Vacant
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E6E2] bg-white">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8A968F] uppercase tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5 text-[#202923]" />
              <span>Reservation State</span>
            </div>
            {activeRes ? (
              <div>
                <span className="text-amber-700 font-bold text-xs font-mono">
                  #{activeRes.id} ({activeRes.status})
                </span>
                <p className="text-[11px] text-[#5E6962] mt-0.5">
                  {activeRes.userName} • {activeRes.licensePlate}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-[#5E6962] font-medium text-xs">No active reservation</span>
              </div>
            )}
          </div>
        </div>

        {/* Hardware & IoT Sensor Telemetry */}
        <div className="p-4 rounded-xl border border-[#E2E6E2] bg-[#F7F8F6] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-xs text-[#202923] uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-[#176B4D]" />
              <span>Sensor Telemetry</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              slot.sensor?.isOnline 
                ? 'bg-[#EBF5F0] text-[#176B4D] border-[#C6E2D6]' 
                : 'bg-slate-200 text-slate-700 border-slate-300'
            }`}>
              <Wifi className="w-3 h-3" />
              {slot.sensor?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-2 rounded-lg border border-[#E2E6E2]">
              <div className="text-[10px] text-[#8A968F] font-medium font-mono">GPIO</div>
              <div className="font-mono font-bold text-[#202923]">
                Pin {slot.sensor?.gpioPin || 'N/A'}
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#E2E6E2]">
              <div className="text-[10px] text-[#8A968F] font-medium font-mono">SIGNAL</div>
              <div className="font-bold text-[#202923] font-mono">
                {slot.sensor?.signalDbm ? `${slot.sensor.signalDbm} dBm` : '-55 dBm'}
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#E2E6E2]">
              <div className="text-[10px] text-[#8A968F] font-medium font-mono">BATTERY</div>
              <div className="font-bold text-[#202923] flex items-center gap-1 font-mono">
                <Battery className="w-3 h-3 text-[#176B4D]" />
                {slot.sensor?.batteryPercent || 95}%
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#E2E6E2]">
              <div className="text-[10px] text-[#8A968F] font-medium font-mono">HEARTBEAT</div>
              <div className="font-medium text-[#5E6962] truncate text-[11px]" title={slot.sensor?.lastHeartbeat}>
                {getRelativeTimeFromNow(slot.sensor?.lastHeartbeat, simulatedTime.toISOString())}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isBookable ? (
            <button
              onClick={handleBookClick}
              className="w-full py-2.5 px-4 bg-[#176B4D] text-white font-semibold rounded-xl hover:bg-[#135C42] shadow-xs transition flex items-center justify-center gap-2 text-xs"
            >
              <span>{isGuest ? 'Log In & Reserve Slot' : `Reserve Slot ${slot.id}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-2">
              <button
                disabled
                className="w-full py-2.5 px-4 bg-[#F7F8F6] text-[#8A968F] border border-[#E2E6E2] font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2 text-xs"
              >
                <span>Slot Not Available for Booking</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-[#FEF3C7] border border-[#FDE68A] p-2.5 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{getDisabledReason()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
