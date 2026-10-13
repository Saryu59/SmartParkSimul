import React from 'react';
import { Cpu, Wifi, WifiOff, Battery, Clock, Radio, Activity } from 'lucide-react';
import { getRelativeTimeFromNow } from '../../utils/dateUtils';

export function SensorHealthCard({ slots, simulatedNow }) {
  return (
    <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-forest-700" />
          <h3 className="font-bold text-charcoal-900 text-sm">Sensor Diagnostics</h3>
        </div>
        <span className="text-xs text-charcoal-500 font-mono">6 Sensors</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {slots.map((slot) => {
          const isOnline = slot.sensor?.isOnline;
          return (
            <div
              key={slot.id}
              className={`p-3 rounded-lg border transition ${
                isOnline
                  ? 'border-charcoal-200 bg-canvas hover:bg-white hover:border-charcoal-300'
                  : 'border-red-200 bg-red-50/50 text-red-950'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-charcoal-900">
                  <span className="w-6 h-6 rounded bg-charcoal-900 text-white flex items-center justify-center text-xs">
                    {slot.id}
                  </span>
                  <span>{slot.sensor?.id || `IR-${slot.id}`}</span>
                </div>

                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isOnline ? 'bg-forest-100 text-forest-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-charcoal-600">
                <div className="flex justify-between">
                  <span className="text-charcoal-400">GPIO Pin:</span>
                  <span className="font-mono font-medium text-charcoal-800">Pin {slot.sensor?.gpioPin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Battery Level:</span>
                  <span className="font-medium text-forest-700">{slot.sensor?.batteryPercent || 95}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-400">Wi-Fi RSSI:</span>
                  <span className="font-mono text-charcoal-700">{slot.sensor?.signalDbm || -55} dBm</span>
                </div>
                <div className="flex justify-between border-t border-charcoal-100 pt-1">
                  <span className="text-charcoal-400">Last Heartbeat:</span>
                  <span className="text-charcoal-700">
                    {getRelativeTimeFromNow(slot.sensor?.lastHeartbeat, simulatedNow)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
