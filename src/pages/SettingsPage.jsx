import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParking } from '../contexts/ParkingContext';
import { useNotification } from '../contexts/NotificationContext';
import { isDemoMode, setDemoMode, getApiBaseUrl, getWsUrl, APP_CONFIG } from '../services/config';
import { reservationsService } from '../services/reservationsService';
import { 
  Settings, 
  User, 
  Sliders, 
  Cpu, 
  Clock, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Download, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { resetDemoData, events, slots, reservations } = useParking();
  const { addToast } = useNotification();

  const [gracePeriod, setGracePeriod] = useState(() => reservationsService.getGracePeriodMinutes());
  const [demoModeEnabled, setDemoModeEnabled] = useState(() => isDemoMode());
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePlate, setProfilePlate] = useState(user?.licensePlate || '');
  const [prefZone, setPrefZone] = useState('A');

  const handleSavePreferences = (e) => {
    e.preventDefault();
    if (isAdmin) {
      reservationsService.setGracePeriodMinutes(gracePeriod);
    }
    addToast('Preferences saved for current session.', 'success');
  };

  const handleToggleDemoMode = (enabled) => {
    setDemoMode(enabled);
    setDemoModeEnabled(enabled);
    addToast(
      enabled
        ? 'Demo mode enabled. Standalone frontend simulation active.'
        : 'Demo mode disabled. App will attempt connecting to FastAPI endpoints.',
      enabled ? 'info' : 'warning'
    );
  };

  const handleExportTelemetryLogs = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      slots,
      reservations,
      events,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartpark-telemetry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Simulation telemetry log exported as JSON.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-charcoal-900">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile & Parking Preferences */}
        <div className="md:col-span-2 space-y-6">
          {/* User Profile Form */}
          <form onSubmit={handleSavePreferences} className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-charcoal-100 pb-3">
              <User className="w-4 h-4 text-forest-700" />
              <h2 className="font-bold text-charcoal-900 text-sm">Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-charcoal-700">Display Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-200 rounded-lg bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-charcoal-700">Default License Plate</label>
                <input
                  type="text"
                  value={profilePlate}
                  onChange={(e) => setProfilePlate(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-charcoal-200 rounded-lg bg-canvas text-charcoal-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-charcoal-700">Preferred Parking Zone</label>
                <select
                  value={prefZone}
                  onChange={(e) => setPrefZone(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-lg bg-canvas text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
                >
                  <option value="A">Zone A (Closest to Elevator / Lobby)</option>
                  <option value="B">Zone B (Standard Clearance)</option>
                </select>
              </div>

              {/* Admin configurable grace period */}
              {isAdmin && (
                <div className="space-y-1">
                  <label className="font-semibold text-charcoal-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-forest-700" />
                    <span>No-Show Grace Period (Admin)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(parseInt(e.target.value, 10))}
                      className="w-24 px-3 py-2 border border-charcoal-200 rounded-lg bg-canvas font-semibold text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
                    />
                    <span className="text-charcoal-500 font-medium">Minutes</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-charcoal-100 flex items-center justify-end">
              <button
                type="submit"
                className="py-2 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-medium shadow-xs transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>

          {/* Integration & Backend Roadmap Card */}
          <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-charcoal-100 pb-3">
              <Cpu className="w-4 h-4 text-forest-700" />
              <h2 className="font-bold text-charcoal-900 text-sm">Backend Configuration</h2>
            </div>

            <div className="space-y-3 text-xs text-charcoal-600">
              <div className="bg-canvas rounded-lg p-3 border border-charcoal-200 font-mono text-[11px] space-y-1">
                <div>REST API Base: <span className="text-forest-800 font-semibold">{getApiBaseUrl()}</span></div>
                <div>WebSocket Live Feed: <span className="text-forest-800 font-semibold">{getWsUrl()}</span></div>
                <div>Firmware Version: <span className="text-charcoal-800">{APP_CONFIG.firmwareVersion}</span></div>
                <div>Max Target Bays: <span className="text-charcoal-800">{APP_CONFIG.maxSlots} Bays</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Demo Mode Toggle & Diagnostics */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-charcoal-100 pb-3">
              <Sliders className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-charcoal-900 text-sm">Simulation</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                <div className="font-bold text-amber-950">Demo Simulation</div>
                <input
                  type="checkbox"
                  checked={demoModeEnabled}
                  onChange={(e) => handleToggleDemoMode(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {!demoModeEnabled && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>
                    Demo mode disabled. Connecting to live backend.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-charcoal-100 space-y-2">
              <button
                onClick={handleExportTelemetryLogs}
                className="w-full py-2 px-3 border border-charcoal-200 hover:bg-canvas rounded-lg text-xs font-medium text-charcoal-700 transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit Logs (JSON)</span>
              </button>

              <button
                onClick={() => {
                  resetDemoData();
                  addToast('All demo slots, bookings, and clock states reset.', 'info');
                }}
                className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
