import React, { useState, useMemo } from 'react';
import { useParking } from '../contexts/ParkingContext';
import { PreferencesForm } from '../components/recommendations/PreferencesForm';
import { RecommendationCard } from '../components/recommendations/RecommendationCard';
import { getRecommendedSlots } from '../utils/recommendationUtils';
import { Sparkles, AlertCircle } from 'lucide-react';

export function RecommendationsPage() {
  const { slots } = useParking();

  const [preferences, setPreferences] = useState({
    preferredZone: 'ANY',
    prioritizeEntrance: true,
    requiresAccessible: false,
  });

  const rankedRecommendations = useMemo(() => {
    return getRecommendedSlots(slots, preferences);
  }, [slots, preferences]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Slot Recommendations</h1>
      </div>

      {/* Preferences Form */}
      <PreferencesForm preferences={preferences} onChange={setPreferences} />

      {/* Recommendations Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              Eligible Bays ({rankedRecommendations.length})
            </h2>
          </div>
        </div>

        {rankedRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankedRecommendations.map((rec, index) => (
              <RecommendationCard
                key={rec.slot.id}
                recommendation={rec}
                rank={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Eligible Slots Available</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No vacant parking slots match your current criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
