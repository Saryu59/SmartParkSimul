import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useParking } from '../contexts/ParkingContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatDateTime, getRelativeTimeFromNow } from '../utils/dateUtils';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  LogOut as ExitGate, 
  ArrowRight,
  Sparkles,
  Search,
  ScanLine,
  UserCheck,
  Lock,
  Loader2,
  Car
} from 'lucide-react';
import { RESERVATION_STATUS } from '../constants/reservations';

export function CheckInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCode = searchParams.get('code') || '';

  const { user, isAdmin, isGuest } = useAuth();
  const { reservations, slots, toggleSensorOccupancy, checkIn, checkOut, events, simulatedTime } = useParking();
  const { addToast } = useNotification();

  const [code, setCode] = useState(initialCode);
  const [isScanning, setIsScanning] = useState(true);
  const [result, setResult] = useState(null); // { success?: boolean, isProcessing?: boolean, message: string, reservation?: object }
  const [loading, setLoading] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState(null); // { code, reservation, slotId }

  // Sync if query param changes
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Active listener: when pendingCheckIn is waiting, monitor assigned slot until car is physically present
  useEffect(() => {
    if (!pendingCheckIn) return;

    const assignedSlot = slots.find((s) => s.id === pendingCheckIn.slotId);
    if (assignedSlot && assignedSlot.isOccupied) {
      // Vehicle has physically entered the bay! Finalize check-in!
      const finalizeCheckIn = async () => {
        try {
          setLoading(true);
          const updatedRes = await checkIn(pendingCheckIn.code);
          setPendingCheckIn(null);
          setResult({
            success: true,
            isProcessing: false,
            message: `Vehicle ${updatedRes.licensePlate} physically detected in Bay ${updatedRes.slotId}! Check-in verified and parking session is now ACTIVE.`,
            reservation: updatedRes,
          });
          addToast(`Vehicle physically detected in Bay ${updatedRes.slotId}! Check-in complete.`, 'success');
        } catch (err) {
          setResult({
            success: false,
            isProcessing: false,
            message: err.message || 'Check-in completion failed.',
          });
          setPendingCheckIn(null);
        } finally {
          setLoading(false);
        }
      };

      finalizeCheckIn();
    }
  }, [slots, pendingCheckIn, checkIn, addToast]);

  // Handle Check In attempt
  const handlePerformCheckIn = async (codeToVerify) => {
    const targetCode = (codeToVerify || code).trim();
    if (!targetCode) {
      setResult({
        success: false,
        message: 'Please provide a reservation reference code.',
      });
      return;
    }

    // Match upcoming reservation
    const targetRes = reservations.find(
      (r) =>
        r.id.toUpperCase() === targetCode.toUpperCase() ||
        (r.qrCodePayload && r.qrCodePayload.toUpperCase().includes(targetCode.toUpperCase()))
    );

    if (targetRes) {
      const assignedSlot = slots.find((s) => s.id === targetRes.slotId);
      // If car is not physically present in bay yet, enter Processing state
      if (!assignedSlot?.isOccupied) {
        setPendingCheckIn({
          code: targetCode,
          reservation: targetRes,
          slotId: targetRes.slotId,
        });
        setResult({
          isProcessing: true,
          message: `Check-in initiated for vehicle ${targetRes.licensePlate}. Processing check-in... Waiting for vehicle to be physically parked in Bay ${targetRes.slotId}.`,
          reservation: targetRes,
        });
        addToast(`Waiting for car to park in Bay ${targetRes.slotId}...`, 'info');
        return;
      }
    }

    try {
      setLoading(true);
      setResult(null);
      const updatedRes = await checkIn(targetCode);
      setResult({
        success: true,
        isProcessing: false,
        message: `Vehicle physically detected in Bay ${updatedRes.slotId}! Check-in verified and session ACTIVE.`,
        reservation: updatedRes,
      });
      addToast(`Vehicle verified for Slot ${updatedRes.slotId}!`, 'success');
    } catch (err) {
      // Do not display loud validation error notifications
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle Check Out attempt
  const handlePerformCheckOut = async (resId) => {
    try {
      setLoading(true);
      const checkedOut = await checkOut(resId, user);
      setResult({
        success: true,
        message: `Check-out completed for Slot ${checkedOut.slotId}. Barrier gate opened and bay released.`,
        reservation: checkedOut,
      });
      addToast(`Slot ${checkedOut.slotId} check-out completed!`, 'info');
    } catch (err) {
      setResult({
        success: false,
        message: err.message || 'Check-out failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter active sessions: regular drivers can ONLY view and exit their OWN vehicle
  // Administrators can view all sessions for facility gate operation
  const userActiveSessions = reservations.filter(
    (r) => r.status === RESERVATION_STATUS.ACTIVE && (isAdmin || r.userId === user?.id || r.userEmail === user?.email)
  );

  // Filter upcoming passes available for quick scanning to the current user
  const userUpcomingReservations = reservations.filter(
    (r) => r.status === RESERVATION_STATUS.UPCOMING && (isAdmin || r.userId === user?.id || r.userEmail === user?.email)
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-charcoal-900">Check-In & Exit</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner Simulation Card */}
        <div className="bg-white rounded-xl border border-charcoal-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-forest-700" />
              <h2 className="font-bold text-charcoal-900 text-sm">Scanner</h2>
            </div>
            <button
              onClick={() => setIsScanning(!isScanning)}
              className="text-xs text-charcoal-500 hover:text-charcoal-800 font-medium"
            >
              {isScanning ? 'Pause Camera' : 'Resume Camera'}
            </button>
          </div>

          {/* Camera Viewfinder Mockup */}
          <div className="relative aspect-video bg-[#121815] rounded-xl overflow-hidden border border-charcoal-300 flex flex-col items-center justify-center p-4 text-center">
            {isScanning ? (
              <>
                {/* Viewfinder Target Reticle */}
                <div className="relative w-36 h-36 border-2 border-dashed border-forest-400/80 rounded-xl flex items-center justify-center">
                  <div className="absolute inset-0 bg-forest-500/10 animate-pulse rounded-xl" />
                  <div className="w-full h-0.5 bg-forest-400 shadow-forest-400 shadow-md animate-bounce" />
                  <QrCode className="w-10 h-10 text-charcoal-600" />
                </div>
                <div className="absolute bottom-3 text-[11px] text-charcoal-300 bg-black/80 px-2.5 py-1 rounded-md font-mono">
                  Align Pass QR Code
                </div>
              </>
            ) : (
              <div className="space-y-2 text-charcoal-500">
                <CameraOff className="w-8 h-8 mx-auto text-charcoal-600" />
                <span className="text-xs block">Camera Feed Suspended</span>
              </div>
            )}
          </div>

          {/* Quick Test Demo Barcodes (User scoped) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">
                {isAdmin ? 'All Passes:' : 'Your Passes:'}
              </span>
              <span className="text-[10px] text-charcoal-400">
                {userUpcomingReservations.length} available
              </span>
            </div>

            {userUpcomingReservations.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {userUpcomingReservations.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setCode(r.id);
                      handlePerformCheckIn(r.id);
                    }}
                    className="px-2.5 py-1 bg-canvas hover:bg-forest-50 hover:border-forest-300 border border-charcoal-200 rounded text-xs font-mono font-medium text-charcoal-800 transition"
                  >
                    Scan {r.id} ({r.slotId})
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-charcoal-400">
                No upcoming bookings found.
              </p>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div className="pt-2 border-t border-charcoal-100 space-y-2">
            <label className="text-xs font-bold text-charcoal-700">
              Manual Pass Reference
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SP-8041"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border border-charcoal-200 rounded-lg text-xs font-mono uppercase bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
              />
              <button
                onClick={() => handlePerformCheckIn(code)}
                disabled={loading || !code.trim()}
                className="py-2 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-medium shadow-xs transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Validate'}
              </button>
            </div>
          </div>
        </div>

        {/* Validation Result & Active Checkout Column */}
        <div className="space-y-6">
          {/* Result Card */}
          {result && (result.isProcessing || result.success) && (
            <div
              className={`rounded-xl border p-5 space-y-3 animate-in zoom-in-95 ${
                result.isProcessing
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-forest-50/90 border-forest-200 text-forest-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.isProcessing ? (
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-forest-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-sm">
                    {result.isProcessing
                      ? 'Processing Check-In (Awaiting Physical Vehicle Arrival)...'
                      : 'Verification Successful'}
                  </h4>
                  <p className="text-xs leading-relaxed">{result.message}</p>
                </div>
              </div>

              {result.reservation && (
                <div className="bg-white rounded-lg p-3 text-xs space-y-1.5 border border-charcoal-200">
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Bay Assigned:</span>
                    <span className="font-bold text-charcoal-900">Bay {result.reservation.slotId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Vehicle Plate:</span>
                    <span className="font-mono font-semibold text-charcoal-800">{result.reservation.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Session Status:</span>
                    <span className={`font-bold ${result.isProcessing ? 'text-amber-700 flex items-center gap-1.5' : 'text-forest-700'}`}>
                      {result.isProcessing && (
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      )}
                      {result.isProcessing ? 'Processing / Waiting for Sensor Detection' : result.reservation.status}
                    </span>
                  </div>
                </div>
              )}

              {result.isProcessing && (
                <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSensorOccupancy(result.reservation.slotId)}
                    className="flex-1 py-2 px-3 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Car className="w-4 h-4" />
                    <span>Park Vehicle in Bay {result.reservation.slotId} (Simulate Arrival)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingCheckIn(null);
                      setResult(null);
                    }}
                    className="py-2 px-3 border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Parking Sessions */}
          <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-2.5">
              <div className="flex items-center gap-2">
                <ExitGate className="w-4 h-4 text-forest-700" />
                <h3 className="font-bold text-charcoal-900 text-sm">
                  {isAdmin
                    ? `Active Sessions (${userActiveSessions.length})`
                    : `Active Session (${userActiveSessions.length})`}
                </h3>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isAdmin ? 'bg-charcoal-100 text-charcoal-700' : 'bg-forest-100 text-forest-800'
              }`}>
                {isAdmin ? 'Attendant' : 'Driver'}
              </span>
            </div>

            {userActiveSessions.length > 0 ? (
              <div className="space-y-2">
                {userActiveSessions.map((res) => (
                  <div
                    key={res.id}
                    className="p-3 rounded-lg border border-charcoal-200 bg-canvas flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-charcoal-900">
                        Bay {res.slotId} • <span className="font-mono">{res.licensePlate}</span>
                      </div>
                      <div className="text-[11px] text-charcoal-500 mt-0.5">
                        {isAdmin && (
                          <span className="font-semibold text-charcoal-700 block">
                            Driver: {res.userName} ({res.userEmail})
                          </span>
                        )}
                        Checked in {getRelativeTimeFromNow(res.checkedInAt, simulatedTime.toISOString())}
                      </div>
                    </div>

                    <button
                      onClick={() => handlePerformCheckOut(res.id)}
                      disabled={loading}
                      className="py-1.5 px-3 bg-charcoal-900 hover:bg-black text-white rounded text-xs font-medium transition"
                    >
                      {isAdmin ? 'Clear Barrier' : 'Exit Bay'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-charcoal-500">
                <p>No active vehicle session for this account.</p>
              </div>
            )}
          </div>

          {/* Gate Event Log */}
          <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-charcoal-900 text-sm border-b border-charcoal-100 pb-2">
              Recent Gate Events
            </h3>
            <div className="space-y-2 text-xs">
              {events
                .filter(
                  (e) =>
                    e.type === 'CHECK_IN_SUCCESS' ||
                    e.type === 'CHECK_OUT_SUCCESS' ||
                    e.type === 'RESERVATION_EXPIRED'
                )
                .slice(0, 4)
                .map((e) => (
                  <div key={e.id} className="flex justify-between items-start text-charcoal-600">
                    <span className="font-medium text-charcoal-800">{e.title}</span>
                    <span className="text-[10px] text-charcoal-400 shrink-0">
                      {getRelativeTimeFromNow(e.timestamp, simulatedTime.toISOString())}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
