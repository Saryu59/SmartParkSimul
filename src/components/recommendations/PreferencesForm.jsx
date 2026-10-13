import React from 'react';
import { SlidersHorizontal, Accessibility, MapPin, Compass } from 'lucide-react';

export function PreferencesForm({ preferences, onChange }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E2E6E2] shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-[#E2E6E2] pb-3">
        <SlidersHorizontal className="w-4 h-4 text-[#176B4D]" />
        <h3 className="font-semibold text-[#202923] text-sm">Preferences</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {/* Preferred Zone */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#202923] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#8A968F]" />
            Preferred Zone
          </label>
          <select
            value={preferences.preferredZone}
            onChange={(e) => onChange({ ...preferences, preferredZone: e.target.value })}
            className="w-full p-2 border border-[#E2E6E2] rounded-xl bg-[#F7F8F6] text-[#202923] focus:outline-none focus:ring-2 focus:ring-[#176B4D]/20 focus:border-[#176B4D]"
          >
            <option value="ANY">Any Zone</option>
            <option value="A">Zone A</option>
            <option value="B">Zone B</option>
          </select>
        </div>

        {/* Proximity Priority */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#202923] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#8A968F]" />
            Distance Priority
          </label>
          <label className="flex items-center gap-2.5 p-2 border border-[#E2E6E2] rounded-xl bg-[#F7F8F6] cursor-pointer hover:bg-[#EBF5F0]/50 transition">
            <input
              type="checkbox"
              checked={preferences.prioritizeEntrance}
              onChange={(e) => onChange({ ...preferences, prioritizeEntrance: e.target.checked })}
              className="rounded text-[#176B4D] focus:ring-[#176B4D] w-4 h-4 accent-[#176B4D]"
            />
            <span className="text-[#5E6962] font-medium">Nearest to entrance</span>
          </label>
        </div>

        {/* Accessibility Needs */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#202923] flex items-center gap-1.5">
            <Accessibility className="w-3.5 h-3.5 text-blue-500" />
            Accessibility
          </label>
          <label className="flex items-center gap-2.5 p-2 border border-[#E2E6E2] rounded-xl bg-[#F7F8F6] cursor-pointer hover:bg-blue-50/50 transition">
            <input
              type="checkbox"
              checked={preferences.requiresAccessible}
              onChange={(e) => onChange({ ...preferences, requiresAccessible: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-[#5E6962] font-medium">Accessible bay only (A1)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
