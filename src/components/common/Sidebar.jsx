import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useParking } from '../../contexts/ParkingContext';
import { 
  LayoutDashboard, 
  MapPin, 
  Sparkles, 
  CalendarCheck, 
  Bookmark, 
  QrCode, 
  ShieldAlert, 
  Settings, 
  Car, 
  LogOut,
  ChevronRight
} from 'lucide-react';

export function Sidebar({ className = '' }) {
  const { user, isAdmin, isGuest, logout } = useAuth();
  const { stats } = useParking();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/map',
      label: 'Live Parking Map',
      icon: MapPin,
      badge: `${stats.availableSlots} free`,
      badgeColor: stats.availableSlots > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600',
    },
    {
      to: '/recommendations',
      label: 'Smart Recommendations',
      icon: Sparkles,
    },
    {
      to: '/reserve',
      label: 'Reserve a Slot',
      icon: CalendarCheck,
    },
    {
      to: '/my-reservations',
      label: 'My Reservations',
      icon: Bookmark,
    },
    {
      to: '/check-in',
      label: 'QR Check-In',
      icon: QrCode,
    },
  ];

  const adminItem = {
    to: '/admin',
    label: 'Admin',
    icon: ShieldAlert,
    badge: stats.unreservedOccupancyCount > 0 ? `${stats.unreservedOccupancyCount} alert` : null,
    badgeColor: 'bg-rose-100 text-rose-800',
  };

  return (
    <aside className={`w-64 bg-white border-r border-[#E2E6E2] flex flex-col shrink-0 ${className}`}>
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E2E6E2] flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#176B4D] flex items-center justify-center text-white shadow-xs group-hover:bg-[#135C42] transition">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[#202923] text-sm tracking-tight leading-tight flex items-center gap-1.5">
              <span>SmartPark</span>
              <span className="text-[9px] font-mono font-semibold px-1 py-0.2 bg-[#EBF5F0] text-[#176B4D] rounded border border-[#C6E2D6]">
                IoT
              </span>
            </div>
          </div>
        </NavLink>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A968F]">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition relative ${
                      isActive
                        ? 'bg-[#EBF5F0] text-[#176B4D] font-semibold border border-[#C6E2D6]/80'
                        : 'text-[#5E6962] hover:bg-[#F7F8F6] hover:text-[#202923] font-medium'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full border ${
                      stats.availableSlots > 0 
                        ? 'bg-[#EBF5F0] text-[#176B4D] border-[#C6E2D6]' 
                        : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Administration Section */}
        <div>
          <div className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A968F] flex items-center justify-between">
            <span>Administration</span>
            {isAdmin && (
              <span className="text-[9px] text-[#176B4D] font-bold bg-[#EBF5F0] px-1.5 py-0.2 rounded border border-[#C6E2D6]">
                ADMIN
              </span>
            )}
          </div>
          <nav className="space-y-1">
            <NavLink
              to={adminItem.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition ${
                  isActive
                    ? 'bg-[#EBF5F0] text-[#176B4D] font-semibold border border-[#C6E2D6]/80'
                    : 'text-[#5E6962] hover:bg-[#F7F8F6] hover:text-[#202923] font-medium'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <adminItem.icon className="w-4 h-4 shrink-0" />
                <span>{adminItem.label}</span>
              </div>
              {adminItem.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                  {adminItem.badge}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition ${
                  isActive
                    ? 'bg-[#EBF5F0] text-[#176B4D] font-semibold border border-[#C6E2D6]/80'
                    : 'text-[#5E6962] hover:bg-[#F7F8F6] hover:text-[#202923] font-medium'
                }`
              }
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-[#E2E6E2] bg-white">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F8F6] border border-[#E2E6E2]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isAdmin ? 'bg-[#202923] text-white' : 'bg-[#EBF5F0] text-[#176B4D]'
            }`}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-[#202923] truncate leading-tight">
                {user?.name || 'Guest Driver'}
              </div>
              <div className="text-[10px] text-[#8A968F] font-mono truncate">
                {user?.licensePlate || user?.email || 'Demo Mode'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-[#8A968F] hover:text-[#202923] hover:bg-white rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
