import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Car, 
  ShieldAlert, 
  User, 
  HelpCircle, 
  ArrowRight,
  Info
} from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const preselectedSlot = searchParams.get('slot');

  const { login, setGuestMode, switchRole } = useAuth();
  const { addToast } = useNotification();

  const [email, setEmail] = useState('alex@smartpark.demo');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await login(email, password);
      addToast(`Signed in successfully!`, 'success');
      const target = preselectedSlot ? `${redirect}?slot=${preselectedSlot}` : redirect;
      navigate(target);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('demo1234');
    setError('');
  };

  const handleGuest = () => {
    setGuestMode();
    addToast('Signed in as Guest Explorer (Read-only browsing)', 'info');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 text-charcoal-900 group">
            <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-white shadow-xs">
              <Car className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight">SmartPark</span>
          </Link>
          <h2 className="text-xl font-bold text-charcoal-900">Sign in to SmartPark</h2>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Quick-fill Demo Account buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">
              Quick Demo Fill:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('alex@smartpark.demo')}
                className="p-2 border border-charcoal-200 rounded-lg hover:bg-canvas text-left font-medium text-charcoal-700 transition flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-forest-700" />
                <span>Driver (Alex)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@smartpark.demo')}
                className="p-2 border border-charcoal-200 rounded-lg hover:bg-canvas text-left font-medium text-charcoal-700 transition flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-charcoal-800" />
                <span>Admin (Sarah)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-charcoal-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@smartpark.demo"
                  className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg text-xs bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <label className="font-semibold text-charcoal-700">Password</label>
                <span className="text-[11px] text-charcoal-400">demo1234</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 border border-charcoal-200 rounded-lg text-xs bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-medium shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-charcoal-100 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">Don't have an account?</span>
            <Link to="/register" className="font-semibold text-forest-700 hover:text-forest-800">
              Create account
            </Link>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleGuest}
              className="text-xs font-medium text-charcoal-500 hover:text-charcoal-800 inline-flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Explore as Guest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
