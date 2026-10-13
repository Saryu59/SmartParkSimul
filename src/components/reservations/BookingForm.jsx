import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParking } from '../../contexts/ParkingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { SLOT_STATUS } from '../../constants/slots';
import { formatDuration, formatTimeOnly, formatDateOnly } from '../../utils/dateUtils';
import { 
  Calendar, 
  Clock, 
  Car, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Accessibility
} from 'lucide-react';

export function BookingForm({ preselectedSlotId }) {
  const navigate = useNavigate();
  const { slots, reservations, createReservation, simulatedTime } = useParking();
  const { user, isLoggedIn } = useAuth();
  const { addToast } = useNotification();

  // Helper to format default dates/times from simulated clock
  const defaultDateStr = simulatedTime.toISOString().split('T')[0];
  
  // Start in 10 minutes from simulated time
  const defaultStartTime = new Date(simulatedTime.getTime() + 10 * 60000);
  const defaultEndTime = new Date(simulatedTime.getTime() + 70 * 60000);

  const formatTimeInput = (d) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  const [slotId, setSlotId] = useState(preselectedSlotId || 'A2');
  const [bookingDate, setBookingDate] = useState(defaultDateStr);
  const [startTimeStr, setStartTimeStr] = useState(formatTimeInput(defaultStartTime));
  const [endTimeStr, setEndTimeStr] = useState(formatTimeInput(defaultEndTime));
  const [licensePlate, setLicensePlate] = useState(user?.licensePlate || 'ABC-7890');
  const [userName, setUserName] = useState(user?.name || 'Alex Rivera');
  const [userEmail, setUserEmail] = useState(user?.email || 'alex@smartpark.demo');

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  // Sync when preselectedSlotId changes
  useEffect(() => {
    if (preselectedSlotId) {
      setSlotId(preselectedSlotId);
    }
  }, [preselectedSlotId]);

  const selectedSlot = slots.find((s) => s.id === slotId);

  // Construct start/end Date objects
  const startDateTime = new Date(`${bookingDate}T${startTimeStr}:00`);
  const endDateTime = new Date(`${bookingDate}T${endTimeStr}:00`);
  const isValidInterval = !isNaN(startDateTime) && !isNaN(endDateTime) && endDateTime > startDateTime;
  const isPastTime = isValidInterval && startDateTime.getTime() < simulatedTime.getTime() - 2 * 60000;

  // Real-time conflict checking: Slot collision
  const conflict = isValidInterval
    ? reservations.find((r) => {
        if (r.slotId !== slotId) return false;
        if (r.status === 'CANCELLED' || r.status === 'EXPIRED' || r.status === 'COMPLETED') return false;
        const rStart = new Date(r.startTime).getTime();
        const rEnd = new Date(r.endTime).getTime();
        return startDateTime.getTime() < rEnd && endDateTime.getTime() > rStart;
      })
    : null;

  // Real-time conflict checking: Same driver or vehicle holding multiple bays simultaneously
  const driverConflict = isValidInterval
    ? reservations.find((r) => {
        if (r.status === 'CANCELLED' || r.status === 'EXPIRED' || r.status === 'COMPLETED') return false;
        const isSameUser = (user?.id && r.userId === user.id) || (userEmail && r.userEmail?.toLowerCase() === userEmail.toLowerCase());
        const isSamePlate = licensePlate && r.licensePlate?.trim().toUpperCase() === licensePlate.trim().toUpperCase();
        if (!isSameUser && !isSamePlate) return false;

        const rStart = new Date(r.startTime).getTime();
        const rEnd = new Date(r.endTime).getTime();
        return startDateTime.getTime() < rEnd && endDateTime.getTime() > rStart;
      })
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!isLoggedIn) {
      addToast('Please log in with a demo account to confirm a reservation.', 'warning');
      navigate(`/login?redirect=/reserve&slot=${slotId}`);
      return;
    }

    if (!selectedSlot) {
      setValidationError('Please select a valid parking slot.');
      return;
    }

    if (selectedSlot.status === SLOT_STATUS.OUT_OF_SERVICE) {
      setValidationError(`Slot ${slotId} is currently out of service for maintenance.`);
      return;
    }

    if (!selectedSlot.sensor?.isOnline) {
      setValidationError(`Slot ${slotId} sensor is currently offline. Cannot verify slot availability.`);
      return;
    }

    if (!isValidInterval) {
      setValidationError('End time must be after start time.');
      return;
    }

    if (isPastTime) {
      setValidationError(`Start time cannot be in the past. Current reference time is ${formatTimeOnly(simulatedTime.toISOString())}.`);
      return;
    }

    if (conflict) {
      setValidationError(`Conflict detected: Slot ${slotId} is already booked from ${formatTimeOnly(conflict.startTime)} to ${formatTimeOnly(conflict.endTime)}.`);
      return;
    }

    if (driverConflict) {
      setValidationError(
        `Conflict: Vehicle ${licensePlate} already holds Bay ${driverConflict.slotId} during this time.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const newRes = await createReservation({
        slotId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        userId: user.id,
        userName,
        userEmail,
        licensePlate,
      });

      setConfirmedReservation(newRes);
      addToast(`Reservation ${newRes.id} confirmed for Slot ${slotId}!`, 'success');
    } catch (err) {
      setValidationError(err.message || 'Failed to confirm reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedReservation) {
    return (
      <div className="bg-white rounded-2xl border border-charcoal-200 p-8 text-center max-w-lg mx-auto space-y-6 shadow-card animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-forest-50 border border-forest-200 text-forest-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
            Booking Confirmed
          </span>
          <h2 className="text-2xl font-bold text-charcoal-900 mt-2 font-mono">
            {confirmedReservation.id}
          </h2>
          <p className="text-sm text-charcoal-500 mt-1">
            Slot <span className="font-bold text-charcoal-900">{confirmedReservation.slotId}</span> has been locked for your arrival.
          </p>
        </div>

        <div className="bg-canvas rounded-xl p-4 border border-charcoal-200 text-xs text-left space-y-2.5">
          <div className="flex justify-between">
            <span className="text-charcoal-500">Date:</span>
            <span className="font-semibold text-charcoal-800">{formatDateOnly(confirmedReservation.startTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal-500">Reserved Window:</span>
            <span className="font-semibold text-charcoal-800">
              {formatTimeOnly(confirmedReservation.startTime)} – {formatTimeOnly(confirmedReservation.endTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-charcoal-500">Vehicle License:</span>
            <span className="font-mono font-semibold text-charcoal-800">{confirmedReservation.licensePlate}</span>
          </div>
          <div className="flex justify-between border-t border-charcoal-200 pt-2.5">
            <span className="text-charcoal-500">Grace Period:</span>
            <span className="font-semibold text-amber-700">10 mins</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/my-reservations')}
            className="flex-1 py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-lg text-xs transition shadow-xs"
          >
            My Reservations
          </button>
          <button
            onClick={() => {
              setConfirmedReservation(null);
            }}
            className="flex-1 py-2.5 px-4 border border-charcoal-200 text-charcoal-700 font-semibold rounded-lg text-xs hover:bg-canvas transition"
          >
            Book Another Bay
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-charcoal-200 p-6 shadow-xs space-y-6">
      <div className="border-b border-charcoal-100 pb-3">
        <h2 className="text-base font-bold text-charcoal-900">Reserve a Parking Bay</h2>
      </div>

      {validationError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{validationError}</span>
              {validationError.toLowerCase().includes('token') && (
                <p className="text-[11px] text-red-700 mt-0.5">
                  Sign in to authenticate with the backend API before reserving.
                </p>
              )}
            </div>
          </div>
          {validationError.toLowerCase().includes('token') && (
            <button
              type="button"
              onClick={() => navigate(`/login?redirect=/reserve&slot=${slotId}`)}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-md text-xs font-semibold shrink-0 transition"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Slot Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider">
          Select Parking Bay
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {slots.map((s) => {
            const isAvail = s.status === SLOT_STATUS.AVAILABLE;
            const isSelected = s.id === slotId;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => setSlotId(s.id)}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-between ${
                  isSelected
                    ? 'border-forest-600 bg-forest-50 text-forest-900 ring-2 ring-forest-500/20 shadow-xs'
                    : isAvail
                    ? 'border-charcoal-200 hover:border-charcoal-300 bg-white text-charcoal-800'
                    : 'border-charcoal-100 bg-charcoal-50 opacity-60 text-charcoal-400'
                }`}
              >
                <span className="font-extrabold text-sm">{s.id}</span>
                <span className="text-[10px] text-charcoal-500">{s.zone === 'A' ? 'Zn A' : 'Zn B'}</span>
                {s.isAccessible && <Accessibility className="w-3 h-3 text-forest-700 mt-1" />}
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                  s.status === SLOT_STATUS.AVAILABLE ? 'bg-forest-600' :
                  s.status === SLOT_STATUS.OCCUPIED ? 'bg-red-500' :
                  s.status === SLOT_STATUS.RESERVED ? 'bg-amber-500' : 'bg-charcoal-400'
                }`} />
              </button>
            );
          })}
        </div>
        {selectedSlot && (
          <div className="text-[11px] text-charcoal-500 flex items-center justify-between px-1">
            <span>Selected: {selectedSlot.name} ({selectedSlot.distanceToEntranceMeters}m to entrance)</span>
            <span className="font-semibold text-charcoal-700">Current Status: {selectedSlot.status}</span>
          </div>
        )}
      </div>

      {/* Schedule Interval */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider">
          Date & Time
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-charcoal-600 font-medium mb-1">Reservation Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                min={defaultDateStr}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg text-xs bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-charcoal-600 font-medium mb-1">Start Time</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg text-xs bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-charcoal-600 font-medium mb-1">End Time</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg text-xs bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
              />
            </div>
          </div>
        </div>

        {isValidInterval && (
          <div className="text-xs text-charcoal-600 bg-canvas p-2.5 rounded-lg border border-charcoal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Duration: <strong className="text-charcoal-900">{formatDuration(startDateTime.toISOString(), endDateTime.toISOString())}</strong></span>
            {isPastTime ? (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Start time cannot be in the past ({formatTimeOnly(simulatedTime.toISOString())})
              </span>
            ) : conflict ? (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Bay conflict with {conflict.id}
              </span>
            ) : driverConflict ? (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Driver holds overlapping Bay {driverConflict.slotId} ({driverConflict.id})
              </span>
            ) : (
              <span className="text-forest-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bay available
              </span>
            )}
          </div>
        )}
      </div>

      {/* Driver & Vehicle Details */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider">
          Vehicle & Driver
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-charcoal-600 font-medium mb-1">Driver Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg text-xs bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-charcoal-600 font-medium mb-1">Vehicle License Plate</label>
            <div className="relative">
              <Car className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                required
                className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg text-xs bg-canvas text-charcoal-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-charcoal-600 font-medium mb-1">Email</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-charcoal-200 rounded-lg text-xs bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
            />
          </div>
        </div>
      </div>

      {/* Confirmation CTA */}
      <button
        type="submit"
        disabled={isSubmitting || !isValidInterval || isPastTime || !!conflict || !!driverConflict}
        className="w-full py-3 px-4 bg-forest-700 hover:bg-forest-800 text-white font-medium rounded-lg text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isSubmitting ? 'Verifying & Reserving...' : `Confirm Reservation for Bay ${slotId}`}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
