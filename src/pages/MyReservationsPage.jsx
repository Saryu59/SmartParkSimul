import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useParking } from '../contexts/ParkingContext';
import { ReservationCard } from '../components/reservations/ReservationCard';
import { RESERVATION_STATUS } from '../constants/reservations';
import { Bookmark, CalendarPlus, Filter, Clock } from 'lucide-react';

export function MyReservationsPage() {
  const { user } = useAuth();
  const { reservations, cancelReservation, simulatedTime } = useParking();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'ACTIVE' | 'PAST'

  // Filter reservations for current user
  const userReservations = reservations.filter(
    (r) => !user?.id || r.userId === user.id || r.userEmail === user?.email
  );

  const filteredReservations = userReservations.filter((r) => {
    if (activeTab === 'UPCOMING') return r.status === RESERVATION_STATUS.UPCOMING;
    if (activeTab === 'ACTIVE') return r.status === RESERVATION_STATUS.ACTIVE;
    if (activeTab === 'PAST') {
      return (
        r.status === RESERVATION_STATUS.COMPLETED ||
        r.status === RESERVATION_STATUS.CANCELLED ||
        r.status === RESERVATION_STATUS.EXPIRED
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900">My Reservations</h1>
        </div>

        <Link
          to="/reserve"
          className="px-3.5 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-medium shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>New Reservation</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-charcoal-200 gap-2 text-xs font-semibold">
        {[
          { id: 'ALL', label: 'All', count: userReservations.length },
          {
            id: 'UPCOMING',
            label: 'Upcoming',
            count: userReservations.filter((r) => r.status === RESERVATION_STATUS.UPCOMING).length,
          },
          {
            id: 'ACTIVE',
            label: 'Active',
            count: userReservations.filter((r) => r.status === RESERVATION_STATUS.ACTIVE).length,
          },
          {
            id: 'PAST',
            label: 'Past',
            count: userReservations.filter(
              (r) =>
                r.status === RESERVATION_STATUS.COMPLETED ||
                r.status === RESERVATION_STATUS.CANCELLED ||
                r.status === RESERVATION_STATUS.EXPIRED
            ).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-forest-600 text-forest-800'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === tab.id ? 'bg-forest-100 text-forest-800' : 'bg-charcoal-100 text-charcoal-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Reservation Cards List */}
      {filteredReservations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReservations.map((res) => (
            <ReservationCard
              key={res.id}
              reservation={res}
              onCancel={cancelReservation}
              simulatedNow={simulatedTime.toISOString()}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-charcoal-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-canvas border border-charcoal-200 text-charcoal-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-charcoal-900 text-sm">No Reservations</h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            No reservations found in this category.
          </p>
          <div className="pt-2">
            <Link
              to="/reserve"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest-700 text-white text-xs font-medium rounded-lg hover:bg-forest-800 transition"
            >
              <span>Reserve a Slot</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
