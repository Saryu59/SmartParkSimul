import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParking } from '../contexts/ParkingContext';
import { useNotification } from '../contexts/NotificationContext';
import { analyticsService } from '../services/analyticsService';
import { UnreservedAlertBanner } from '../components/admin/UnreservedAlertBanner';
import { SensorHealthCard } from '../components/admin/SensorHealthCard';
import { formatDateTime, getRelativeTimeFromNow } from '../utils/dateUtils';
import { SLOT_STATUS } from '../constants/slots';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { 
  ShieldAlert, 
  Cpu, 
  Activity, 
  Wrench, 
  Sliders, 
  AlertTriangle, 
  Car, 
  Search, 
  Filter, 
  Wifi, 
  WifiOff, 
  Radio, 
  UserCheck, 
  Lock 
} from 'lucide-react';

export function AdminDashboard() {
  const { user, isAdmin, switchRole } = useAuth();
  const { 
    slots, 
    reservations, 
    events, 
    stats, 
    simulatedTime, 
    toggleSensorOccupancy, 
    toggleSensorOnline, 
    toggleSlotMaintenance 
  } = useParking();
  const { addToast } = useNotification();

  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationFilter, setReservationFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'slots' | 'reservations' | 'sensors' | 'events'

  // Admin access guard
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto border border-forest-200">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-charcoal-900">Administrator Clearance Required</h2>
        <p className="text-xs text-charcoal-500 leading-relaxed">
          The operations dashboard is restricted to facility operators and systems engineers. In Demo Mode, you can switch to the Administrator role with a single click.
        </p>
        <button
          onClick={() => {
            switchRole('ADMIN');
            addToast('Switched to Administrator role (Sarah Jenkins)', 'success');
          }}
          className="py-2.5 px-5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          <span>Switch to Demo Admin (Sarah Jenkins)</span>
        </button>
      </div>
    );
  }

  const chartData = analyticsService.getHistoricalHourlyTrends();

  const filteredReservations = reservations.filter((r) => {
    if (reservationFilter !== 'ALL' && r.status !== reservationFilter) return false;
    if (reservationSearch.trim()) {
      const q = reservationSearch.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.slotId.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.licensePlate.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900">Admin Console</h1>
        </div>
      </div>

      {/* Critical Alert: Unreserved Occupancy */}
      <UnreservedAlertBanner
        unreservedSlots={stats.unreservedOccupancySlots}
        onReview={() => setActiveTab('slots')}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-charcoal-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Total Bays</span>
          <div className="text-2xl font-extrabold text-charcoal-900">{stats.totalSlots}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-charcoal-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Occupancy</span>
          <div className="text-2xl font-extrabold text-forest-700">{stats.occupancyPercentage}%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-charcoal-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Hardware Health</span>
          <div className={`text-2xl font-extrabold ${stats.offlineSlots > 0 ? 'text-amber-600' : 'text-forest-700'}`}>
            {stats.totalSlots - stats.offlineSlots}/{stats.totalSlots}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-charcoal-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">Exceptions</span>
          <div className={`text-2xl font-extrabold ${stats.unreservedOccupancyCount > 0 ? 'text-red-600' : 'text-charcoal-800'}`}>
            {stats.unreservedOccupancyCount}
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex border-b border-charcoal-200 gap-2 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'slots', label: 'Bay Controls' },
          { id: 'reservations', label: `Reservations (${reservations.length})` },
          { id: 'sensors', label: 'Sensors' },
          { id: 'events', label: `Audit Log (${events.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 px-3 border-b-2 whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'border-forest-600 text-forest-800 font-bold'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & RECHARTS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Occupancy Trend Area Chart */}
          <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
              <div>
                <h3 className="font-bold text-charcoal-900 text-sm">Hourly Lot Occupancy</h3>
              </div>
              <span className="text-[11px] font-mono text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                Live Data
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#176B4D" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#176B4D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E6E2" />
                  <XAxis dataKey="time" stroke="#8A968F" fontSize={11} />
                  <YAxis stroke="#8A968F" fontSize={11} domain={[0, 6]} ticks={[0, 2, 4, 6]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E6E2', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#176B4D"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOccupancy)"
                    name="Occupied Bays"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Zone Distribution Bar Chart */}
          <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
              <div>
                <h3 className="font-bold text-charcoal-900 text-sm">Zone Utilization</h3>
              </div>
              <span className="text-[11px] text-charcoal-500">Zone A vs Zone B</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E6E2" />
                  <XAxis dataKey="time" stroke="#8A968F" fontSize={11} />
                  <YAxis stroke="#8A968F" fontSize={11} domain={[0, 3]} ticks={[0, 1, 2, 3]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E6E2', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="zoneA" fill="#176B4D" name="Zone A (North)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="zoneB" fill="#475569" name="Zone B (South)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SLOT MANAGEMENT & SIMULATION TABLE */}
      {activeTab === 'slots' && (
        <div className="bg-white rounded-xl border border-charcoal-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-charcoal-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-charcoal-900 text-sm">Bay Controls</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-canvas border-b border-charcoal-200 text-charcoal-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Bay ID</th>
                  <th className="p-3">Zone</th>
                  <th className="p-3">GPIO Pin</th>
                  <th className="p-3">Physical State</th>
                  <th className="p-3">Reservation</th>
                  <th className="p-3">Computed Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100 font-medium text-charcoal-700">
                {slots.map((s) => (
                  <tr key={s.id} className="hover:bg-canvas/80 transition">
                    <td className="p-3 font-bold text-charcoal-900">{s.id}</td>
                    <td className="p-3 text-charcoal-600">{s.zone === 'A' ? 'Zone A' : 'Zone B'}</td>
                    <td className="p-3 font-mono text-charcoal-700">GPIO {s.sensor?.gpioPin}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.isOccupied ? 'bg-red-100 text-red-800' : 'bg-forest-100 text-forest-800'
                      }`}>
                        {s.isOccupied ? 'OCCUPIED' : 'VACANT'}
                      </span>
                    </td>
                    <td className="p-3 text-charcoal-600">
                      {s.activeReservationId ? (
                        <span className="font-mono text-amber-700 font-semibold">{s.activeReservationId}</span>
                      ) : (
                        <span className="text-charcoal-400">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-charcoal-800">{s.status}</span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => toggleSensorOccupancy(s.id)}
                        className="px-2 py-1 bg-white hover:bg-forest-50 hover:border-forest-300 rounded border border-charcoal-200 text-charcoal-800 text-[11px] transition shadow-2xs"
                      >
                        {s.isOccupied ? 'Vacate' : 'Park Car'}
                      </button>
                      <button
                        onClick={() => toggleSensorOnline(s.id)}
                        className={`px-2 py-1 rounded border text-[11px] transition shadow-2xs ${
                          s.sensor?.isOnline
                            ? 'bg-white hover:bg-canvas border-charcoal-200 text-charcoal-700'
                            : 'bg-red-50 border-red-300 text-red-700 font-medium'
                        }`}
                      >
                        {s.sensor?.isOnline ? 'Disconnect' : 'Reconnect'}
                      </button>
                      <button
                        onClick={() => toggleSlotMaintenance(s.id)}
                        className={`px-2 py-1 rounded border text-[11px] transition shadow-2xs ${
                          s.isMaintenance
                            ? 'bg-charcoal-900 border-charcoal-900 text-white font-semibold'
                            : 'bg-white hover:bg-canvas border-charcoal-200 text-charcoal-700'
                        }`}
                      >
                        {s.isMaintenance ? 'Restore' : 'Out of Svc'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RESERVATIONS SEARCH & AUDIT */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, plate, or driver..."
                value={reservationSearch}
                onChange={(e) => setReservationSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg text-xs bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-charcoal-400 font-medium">Filter Status:</span>
              <select
                value={reservationFilter}
                onChange={(e) => setReservationFilter(e.target.value)}
                className="text-xs border border-charcoal-200 rounded-lg px-2.5 py-1.5 bg-canvas text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
              >
                <option value="ALL">All Records</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-canvas border-b border-charcoal-200 text-charcoal-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Bay</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">License Plate</th>
                  <th className="p-3">Time Window</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100 font-medium text-charcoal-700">
                {filteredReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-canvas/80 transition">
                    <td className="p-3 font-mono font-bold text-charcoal-900">{r.id}</td>
                    <td className="p-3 font-bold text-charcoal-800">{r.slotId}</td>
                    <td className="p-3 text-charcoal-700">{r.userName}</td>
                    <td className="p-3 font-mono text-charcoal-600">{r.licensePlate}</td>
                    <td className="p-3 text-charcoal-600">{formatDateTime(r.startTime)}</td>
                    <td className="p-3">
                      {r.checkedIn ? (
                        <span className="text-forest-700 font-semibold">Yes ({r.checkedInAt?.slice(11, 16)})</span>
                      ) : (
                        <span className="text-charcoal-400">Pending</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-charcoal-800">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SENSORS HEALTH */}
      {activeTab === 'sensors' && (
        <SensorHealthCard slots={slots} simulatedNow={simulatedTime.toISOString()} />
      )}

      {/* TAB 5: EVENTS AUDIT LOG */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-xl border border-charcoal-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
            <div>
              <h3 className="font-bold text-charcoal-900 text-sm">Event Log</h3>
            </div>
          </div>

          <div className="divide-y divide-charcoal-100 text-xs">
            {events.map((e) => (
              <div key={e.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      e.severity === 'ALERT' ? 'bg-red-500' :
                      e.severity === 'WARNING' ? 'bg-amber-500' :
                      e.severity === 'SUCCESS' ? 'bg-forest-600' : 'bg-charcoal-400'
                    }`} />
                    <span className="font-bold text-charcoal-900">{e.title}</span>
                    {e.slotId && (
                      <span className="px-1.5 py-0.2 bg-canvas rounded text-[10px] font-mono text-charcoal-600 font-semibold border border-charcoal-200">
                        Bay {e.slotId}
                      </span>
                    )}
                  </div>
                  <p className="text-charcoal-600 leading-relaxed">{e.description}</p>
                </div>
                <span className="text-[11px] text-charcoal-400 font-medium shrink-0">
                  {formatDateTime(e.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
