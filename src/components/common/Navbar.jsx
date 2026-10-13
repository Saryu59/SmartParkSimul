import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useParking } from '../../contexts/ParkingContext';
import { 
  Menu, 
  X, 
  Wifi, 
  Clock, 
  User, 
  ShieldCheck, 
  LogOut, 
  Layers, 
  HelpCircle,
  Sliders,
  ChevronDown
} from 'lucide-react';

export function Navbar({ onMobileMenuToggle }) {
  const location = useLocation();
  const { user, isAdmin, isGuest, logout, switchRole } = useAuth();
  const { stats, simulatedTime, isClockOffset } = useParking();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview';
      case '/dashboard':
        return 'Dashboard';
      case '/map':
        return 'Live Parking Map';
      case '/recommendations':
        return 'Recommendations';
      case '/reserve':
        return 'Reserve a Bay';
      case '/my-reservations':
        return 'My Reservations';
      case '/check-in':
        return 'Check-In & Exit';
      case '/admin':
        return 'Admin Console';
      case '/settings':
        return 'Settings';
      case '/login':
        return 'Authentication';
      case '/register':
        return 'Register';
      default:
        return 'SmartPark';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-[#E2E6E2] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-[#5E6962] hover:text-[#202923] hover:bg-[#F7F8F6] transition"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm sm:text-base font-semibold text-[#202923] tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hardware connectivity badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F7F8F6] border border-[#E2E6E2] text-xs font-mono font-medium text-[#5E6962]">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              stats.offlineSlots > 0 ? 'bg-amber-400' : 'bg-[#176B4D]'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              stats.offlineSlots > 0 ? 'bg-amber-500' : 'bg-[#176B4D]'
            }`} />
          </span>
          <span className="text-[11px]">
            {stats.offlineSlots > 0 ? `${stats.offlineSlots} Offline` : 'ESP32 Online'}
          </span>
        </div>

        {/* User Role / Account Dropdown */}
        <div className="relative">
          {user ? (
            <div>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg border border-[#E2E6E2] hover:border-[#CDD2CD] bg-white transition text-xs font-medium text-[#202923]"
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-[#202923] text-white' : 'bg-[#EBF5F0] text-[#176B4D]'
                }`}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="font-semibold text-[#202923] block leading-tight text-xs">{user.name}</span>
                  <span className="text-[10px] text-[#8A968F] capitalize">{user.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8A968F] hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#E2E6E2] shadow-elevated py-2 z-40 text-xs animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-2.5 border-b border-[#E2E6E2]">
                      <div className="font-semibold text-[#202923]">{user.name}</div>
                      <div className="text-[#8A968F] text-[11px] truncate">{user.email}</div>
                    </div>

                    <div className="py-1.5">
                      <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8A968F]">
                        Switch Role
                      </div>
                      <button
                        onClick={() => {
                          switchRole('USER');
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-[#F7F8F6] ${
                          user.role === 'USER' ? 'font-semibold text-[#176B4D]' : 'text-[#5E6962]'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Driver</span>
                      </button>
                      <button
                        onClick={() => {
                          switchRole('ADMIN');
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-1.5 text-left flex items-center gap-2 hover:bg-[#F7F8F6] ${
                          user.role === 'ADMIN' ? 'font-semibold text-[#202923]' : 'text-[#5E6962]'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Administrator</span>
                      </button>
                    </div>

                    <div className="border-t border-[#E2E6E2] pt-1">
                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3.5 py-1.5 text-[#5E6962] hover:bg-[#F7F8F6] hover:text-[#202923]"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-[#5E6962] hover:text-[#202923] hover:bg-[#F7F8F6] rounded-lg transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#176B4D] hover:bg-[#135C42] text-white rounded-lg transition shadow-xs"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
