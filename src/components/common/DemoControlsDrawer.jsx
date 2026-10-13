import React, { useState } from 'react';
import { useParking } from '../../contexts/ParkingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDateTime, formatTimeOnly } from '../../utils/dateUtils';
import { 
  Sliders, 
  Clock, 
  Cpu, 
  RotateCcw, 
  X, 
  Car, 
  Wifi, 
  WifiOff, 
  Wrench, 
  ShieldCheck, 
  User, 
  HelpCircle,
  Radio
} from 'lucide-react';

export function DemoControlsDrawer({ isOpen, onClose }) {
  const {
    slots,
    simulatedTime,
    isClockOffset,
    clockOffsetMinutes,
    advanceClock,
    resetClock,
    toggleSensorOccupancy,
    toggleSensorOnline,
    toggleSlotMaintenance,
    resetDemoData,
  } = useParking();

  const { user, switchRole, setGuestMode } = useAuth();
  const { addToast } = useNotification();
  const [activeTab, setActiveTab] = useState('sensors'); // 'sensors' | 'clock' | 'roles'

  if (!isOpen) return null;

  const handleSensorToggle = async (slotId, currentOccupied) => {
    try {
      await toggleSensorOccupancy(slotId);
      addToast(
        `Slot ${slotId}: IR sensor toggled to ${!currentOccupied ? 'OCCUPIED (LOW)' : 'VACANT (HIGH)'}`,
        'info'
      );
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleOnlineToggle = async (slotId, currentOnline) => {
    try {
      await toggleSensorOnline(slotId);
      addToast(
        `Slot ${slotId}: Sensor connection marked ${!currentOnline ? 'ONLINE' : 'OFFLINE'}`,
        !currentOnline ? 'success' : 'warning'
      );
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleMaintenanceToggle = async (slotId, isMaint) => {
    try {
      await toggleSlotMaintenance(slotId);
      addToast(
        `Slot ${slotId}: Maintenance mode ${!isMaint ? 'ENABLED' : 'DISABLED'}`,
        'warning'
      );
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleReset = () => {
    resetDemoData();
    addToast('Demo environment reset to initial defaults.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="font-semibold text-slate-900 text-sm">Interactive Demo Controls</h2>
                <p className="text-xs text-slate-500">Hardware & Time simulation test harness</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-2 pt-2 gap-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('sensors')}
              className={`flex-1 pb-2 px-3 border-b-2 text-center transition ${
                activeTab === 'sensors'
                  ? 'border-indigo-600 text-indigo-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 inline mr-1" />
              IR Sensors (6)
            </button>
            <button
              onClick={() => setActiveTab('clock')}
              className={`flex-1 pb-2 px-3 border-b-2 text-center transition ${
                activeTab === 'clock'
                  ? 'border-indigo-600 text-indigo-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Simulated Clock
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-1 pb-2 px-3 border-b-2 text-center transition ${
                activeTab === 'roles'
                  ? 'border-indigo-600 text-indigo-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 inline mr-1" />
              Roles & Reset
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'sensors' && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
                  <strong>Hardware Prototype Simulator:</strong> Toggling a sensor simulates an ESP32 GPIO pin event (e.g. car blocking the infrared obstacle detector beam). Test unreserved parking alerts by placing a car in a slot without a booking!
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="border border-slate-200 rounded-lg p-3 bg-white hover:border-slate-300 transition text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{slot.id}</span>
                          <span className="text-slate-500 text-[11px]">
                            GPIO {slot.sensor?.gpioPin || 'N/A'} • {slot.zone === 'A' ? 'Zone A' : 'Zone B'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          slot.isOccupied ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {slot.isOccupied ? 'CAR PRESENT' : 'VACANT'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleSensorToggle(slot.id, slot.isOccupied)}
                          className={`flex-1 py-1.5 px-2 rounded font-medium border text-center transition flex items-center justify-center gap-1 ${
                            slot.isOccupied
                              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Car className="w-3.5 h-3.5" />
                          {slot.isOccupied ? 'Simulate Exit' : 'Simulate Car Arrival'}
                        </button>

                        <button
                          onClick={() => handleOnlineToggle(slot.id, slot.sensor?.isOnline)}
                          title="Toggle sensor Wi-Fi connection"
                          className={`p-1.5 rounded border transition ${
                            slot.sensor?.isOnline
                              ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                          }`}
                        >
                          {slot.sensor?.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleMaintenanceToggle(slot.id, slot.isMaintenance)}
                          title="Toggle maintenance mode"
                          className={`p-1.5 rounded border transition ${
                            slot.isMaintenance
                              ? 'bg-purple-50 border-purple-200 text-purple-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'clock' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-center space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Simulated Reference Time
                  </div>
                  <div className="text-xl font-mono font-bold text-slate-900">
                    {formatTimeOnly(simulatedTime.toISOString())}
                  </div>
                  <div className="text-slate-600">
                    {formatDateTime(simulatedTime.toISOString())}
                  </div>
                  {isClockOffset && (
                    <div className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[11px] font-medium">
                      Offset: +{clockOffsetMinutes} min ahead of system
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 text-xs leading-relaxed">
                  <strong>10-Minute Waiting & Arrival Window Test:</strong>
                  <br />
                  A 10-minute waiting window applies after making a reservation. Fast-forwarding time past this 10-minute arrival window without checking in triggers automatic no-show release.
                </div>

                <div className="space-y-2">
                  <span className="font-semibold text-slate-700">Fast Forward Time:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => advanceClock(5)}
                      className="py-2 px-3 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-800 font-medium transition"
                    >
                      + 5 Minutes
                    </button>
                    <button
                      onClick={() => advanceClock(10)}
                      className="py-2 px-3 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-800 font-medium transition"
                    >
                      + 10 Minutes (Arrival Exp.)
                    </button>
                    <button
                      onClick={() => advanceClock(30)}
                      className="py-2 px-3 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-800 font-medium transition"
                    >
                      + 30 Minutes
                    </button>
                    <button
                      onClick={() => advanceClock(60)}
                      className="py-2 px-3 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-800 font-medium transition"
                    >
                      + 1 Hour
                    </button>
                  </div>

                  <button
                    onClick={resetClock}
                    disabled={!isClockOffset}
                    className="w-full mt-2 py-2 px-3 bg-slate-100 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Sync with Actual Real-World Clock
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Simulated Role Switching</h4>
                  <p className="text-slate-500 mb-3">
                    Switch between roles instantly to inspect access control and permissions:
                  </p>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        switchRole('USER');
                        addToast('Switched to Demo Driver (USER: Alex Rivera)', 'info');
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                        user?.role === 'USER'
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="font-semibold text-slate-900">Standard User / Driver</div>
                          <div className="text-[11px] text-slate-500">Alex Rivera (alex@smartpark.demo)</div>
                        </div>
                      </div>
                      {user?.role === 'USER' && (
                        <span className="text-[10px] font-bold text-indigo-600 uppercase">Active</span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        switchRole('ADMIN');
                        addToast('Switched to Demo Administrator (ADMIN: Sarah Jenkins)', 'info');
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                        user?.role === 'ADMIN'
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <div>
                          <div className="font-semibold text-slate-900">System Administrator</div>
                          <div className="text-[11px] text-slate-500">Sarah Jenkins (admin@smartpark.demo)</div>
                        </div>
                      </div>
                      {user?.role === 'ADMIN' && (
                        <span className="text-[10px] font-bold text-purple-600 uppercase">Active</span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setGuestMode();
                        addToast('Switched to Guest Mode (Browse only)', 'info');
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                        user?.isGuest
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        <div>
                          <div className="font-semibold text-slate-900">Guest Explorer</div>
                          <div className="text-[11px] text-slate-500">Can view live map, must log in to reserve</div>
                        </div>
                      </div>
                      {user?.isGuest && (
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Active</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">Reset Test Environment</h4>
                  <p className="text-slate-500 mb-3">
                    Restores initial 6 slots, initial reservations, reset event logs, and real-time clock:
                  </p>
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 px-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold hover:bg-rose-100 transition flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All Demo Data to Defaults
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Isolated Frontend Demo Service
            </span>
            <span>ESP32 Physical Sim</span>
          </div>
        </div>
      </div>
    </div>
  );
}
