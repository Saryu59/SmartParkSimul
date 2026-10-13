import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, CheckCircle, ArrowRight, Accessibility } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function RecommendationCard({ recommendation, rank }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { slot, score, reasons } = recommendation;

  const handleBook = () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=/reserve&slot=${slot.id}`);
    } else {
      navigate(`/reserve?slot=${slot.id}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs hover:shadow-card transition space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center font-extrabold text-xl">
            {slot.id}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-charcoal-900 text-base">{slot.name}</span>
              <span className="text-[11px] bg-charcoal-100 text-charcoal-700 font-semibold px-2 py-0.5 rounded-full border border-charcoal-200">
                Rank #{rank} ({score} pts)
              </span>
            </div>
            <div className="text-xs text-charcoal-500 flex items-center gap-2 mt-0.5">
              <span>{slot.zone === 'A' ? 'Zone A' : 'Zone B'}</span>
              <span>•</span>
              <span>{slot.distanceToEntranceMeters}m to main lobby</span>
              {slot.isAccessible && (
                <span className="inline-flex items-center gap-1 text-forest-700 font-medium">
                  • <Accessibility className="w-3.5 h-3.5" /> Accessible Bay
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleBook}
          className="py-2 px-3.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
        >
          <span>Reserve Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Explanations list */}
      <div className="bg-canvas rounded-lg p-2.5 border border-charcoal-100">
        <ul className="space-y-1">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-charcoal-700">
              <CheckCircle className="w-3.5 h-3.5 text-forest-600 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
