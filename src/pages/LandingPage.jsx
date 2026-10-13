import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useParking } from '../contexts/ParkingContext';
import { 
  Car, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  QrCode, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Wifi, 
  Clock, 
  Sliders, 
  Layers, 
  Activity 
} from 'lucide-react';
import { SLOT_STATUS } from '../constants/slots';

export function LandingPage() {
  const navigate = useNavigate();
  const { setGuestMode } = useAuth();
  const { slots, stats } = useParking();

  const handleExploreGuest = () => {
    setGuestMode();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col text-charcoal-900 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-charcoal-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-forest-700 flex items-center justify-center text-white shadow-xs">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-charcoal-900 text-lg tracking-tight">SmartPark</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-200">
              IoT Parking
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <button
            onClick={handleExploreGuest}
            className="px-3.5 py-2 text-charcoal-600 hover:text-charcoal-900 transition hidden sm:block"
          >
            Explore as Guest
          </button>
          <Link
            to="/login"
            className="px-3.5 py-2 text-charcoal-700 hover:bg-canvas rounded-lg transition"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg transition shadow-xs"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-12 md:py-20 max-w-6xl mx-auto flex-1 w-full space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-forest-700" />
            <span>IoT Smart Parking</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal-900 tracking-tight leading-tight">
            Smart Parking & Slot Management
          </h1>

          <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed max-w-xl mx-auto">
            Real-time slot availability, smart recommendations, and seamless reservations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={handleExploreGuest}
              className="w-full sm:w-auto px-6 py-3.5 bg-forest-700 hover:bg-forest-800 text-white font-medium rounded-xl transition shadow-card flex items-center justify-center gap-2 text-sm"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 bg-white border border-charcoal-200 hover:bg-canvas text-charcoal-800 font-medium rounded-xl transition shadow-xs text-sm"
            >
              Demo Sign In
            </Link>
          </div>
        </div>

        {/* Live Availability Preview Widget */}
        <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 md:p-8 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-charcoal-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-charcoal-900 text-base">Live Parking Availability</h3>
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
                {stats.availableSlots} of 6 Available
              </span>
              <span className="text-charcoal-500 font-medium">
                Occupancy: {stats.occupancyPercentage}%
              </span>
            </div>
          </div>

          {/* 6 mini slot pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {slots.map((slot) => {
              const isAvail = slot.status === SLOT_STATUS.AVAILABLE;
              const isOcc = slot.status === SLOT_STATUS.OCCUPIED;
              const isRes = slot.status === SLOT_STATUS.RESERVED;

              return (
                <div
                  key={slot.id}
                  className={`p-3.5 rounded-xl border text-center transition space-y-1 ${
                    isAvail
                      ? 'bg-forest-50/70 border-forest-200 text-forest-900'
                      : isOcc
                      ? 'bg-red-50/70 border-red-200 text-red-950'
                      : isRes
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-canvas border-charcoal-200 text-charcoal-700'
                  }`}
                >
                  <div className="font-extrabold text-base">{slot.id}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider">{slot.status}</div>
                  <div className="text-[10px] text-charcoal-500">
                    {slot.isOccupied ? 'Occupied' : 'Free'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleExploreGuest}
              className="text-xs font-semibold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1"
            >
              <span>View Live Parking Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Prototype Architecture & Engineering Specs */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-charcoal-900">Key Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-charcoal-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-canvas border border-charcoal-200 text-charcoal-800 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-forest-700" />
              </div>
              <h3 className="font-bold text-charcoal-900 text-sm">ESP32 & Optical Sensors</h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                6 infrared obstacle sensors monitor physical vehicle presence with instant telemetry updates.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-charcoal-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-canvas border border-charcoal-200 text-charcoal-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-forest-700" />
              </div>
              <h3 className="font-bold text-charcoal-900 text-sm">Independent Occupancy & Booking</h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                Physical sensor state never overwrites reservation status. Grace period rules handle no-shows safely.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-charcoal-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-canvas border border-charcoal-200 text-charcoal-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-forest-700" />
              </div>
              <h3 className="font-bold text-charcoal-900 text-sm">Real-Time Alerts</h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                Instant notification when unreserved parking or offline hardware is detected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-charcoal-200/80 bg-white px-6 py-6 text-center text-xs text-charcoal-500">
        <p>SmartPark IoT Management System</p>
      </footer>
    </div>
  );
}
