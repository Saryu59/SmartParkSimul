import React, { useState } from 'react';
import { RESERVATION_STATUS, RESERVATION_STATUS_CONFIG } from '../../constants/reservations';
import { formatDateTime, formatTimeOnly, formatDuration } from '../../utils/dateUtils';
import { QRCodeModal } from './QRCodeModal';
import { 
  QrCode, 
  XCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Car, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ReservationCard({ reservation, onCancel, simulatedNow }) {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const statusConfig = RESERVATION_STATUS_CONFIG[reservation.status] || RESERVATION_STATUS_CONFIG[RESERVATION_STATUS.UPCOMING];

  const isUpcoming = reservation.status === RESERVATION_STATUS.UPCOMING;
  const isActive = reservation.status === RESERVATION_STATUS.ACTIVE;
  const isCancellable = isUpcoming && !reservation.checkedIn;

  // Calculate countdown to start or grace period
  const startTime = new Date(reservation.startTime).getTime();
  const nowTime = simulatedNow ? new Date(simulatedNow).getTime() : Date.now();
  const minutesUntilStart = Math.round((startTime - nowTime) / 60000);
  const graceMinutes = reservation.gracePeriodMinutes || 10;
  const graceDeadline = startTime + graceMinutes * 60000;
  const minutesUntilGraceExpiry = Math.round((graceDeadline - nowTime) / 60000);

  const handleCancelClick = async () => {
    if (window.confirm(`Are you sure you want to cancel reservation ${reservation.id} for Slot ${reservation.slotId}?`)) {
      try {
        setIsCancelling(true);
        await onCancel(reservation.id);
      } finally {
        setIsCancelling(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs hover:shadow-card transition space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-charcoal-900 text-white flex items-center justify-center font-bold text-base">
            {reservation.slotId}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-charcoal-900 text-sm">{reservation.id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}>
                {statusConfig.label}
              </span>
            </div>
            <div className="text-xs text-charcoal-500 mt-0.5">
              Plate: <span className="font-mono font-semibold text-charcoal-800">{reservation.licensePlate}</span>
            </div>
          </div>
        </div>

        {/* Action Button: QR Code */}
        {(isUpcoming || isActive) && (
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-charcoal-200 hover:bg-canvas text-charcoal-800 text-xs font-medium transition shadow-xs"
          >
            <QrCode className="w-4 h-4 text-forest-700" />
            <span>Show QR Pass</span>
          </button>
        )}
      </div>

      {/* Middle details: times & countdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3.5 rounded-lg bg-canvas border border-charcoal-100 text-xs">
        <div>
          <span className="text-[10px] text-charcoal-400 font-bold block uppercase tracking-wider">DATE & TIME</span>
          <span className="font-semibold text-charcoal-900">
            {formatTimeOnly(reservation.startTime)} – {formatTimeOnly(reservation.endTime)}
          </span>
          <span className="text-[11px] text-charcoal-500 block">
            {formatDateTime(reservation.startTime).split(',')[0]}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-charcoal-400 font-bold block uppercase tracking-wider">DURATION</span>
          <span className="font-semibold text-charcoal-900">
            {formatDuration(reservation.startTime, reservation.endTime)}
          </span>
          <span className="text-[11px] text-charcoal-500 block">
            {graceMinutes}-min grace period
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] text-charcoal-400 font-bold block uppercase tracking-wider">CHECK-IN STATUS</span>
          {reservation.checkedIn ? (
            <span className="font-semibold text-forest-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
              Checked In ({formatTimeOnly(reservation.checkedInAt)})
            </span>
          ) : isUpcoming ? (
            <div>
              {minutesUntilStart > 0 ? (
                <span className="text-forest-700 font-medium">Starts in {minutesUntilStart} min</span>
              ) : minutesUntilGraceExpiry > 0 ? (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  Grace expires in {minutesUntilGraceExpiry} min
                </span>
              ) : (
                <span className="text-red-700 font-bold">Lapsed</span>
              )}
            </div>
          ) : (
            <span className="text-charcoal-500">Not checked in</span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-charcoal-100 text-xs">
        <div className="text-charcoal-400 text-[11px]">
          Created {formatDateTime(reservation.createdAt)}
        </div>

        <div className="flex items-center gap-2">
          {isUpcoming && (
            <button
              onClick={() => navigate(`/check-in?code=${reservation.id}`)}
              className="py-1.5 px-3 bg-forest-700 hover:bg-forest-800 text-white font-medium rounded-lg transition flex items-center gap-1"
            >
              <span>Check In Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isCancellable && (
            <button
              onClick={handleCancelClick}
              disabled={isCancelling}
              className="py-1.5 px-3 border border-red-200 text-red-700 hover:bg-red-50 font-medium rounded-lg transition disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Reservation'}
            </button>
          )}
        </div>
      </div>

      <QRCodeModal
        reservation={reservation}
        isOpen={showQR}
        onClose={() => setShowQR(false)}
      />
    </div>
  );
}
