import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Lock, 
  Mail, 
  User, 
  Car, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  ArrowRight 
} from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useNotification();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [role, setRole] = useState('USER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('Password must be at least 4 characters for this demo.');
      return;
    }

    try {
      setLoading(true);
      await register({ name, email, password, licensePlate, role });
      addToast(`Account created for ${name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 text-charcoal-900 group">
            <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-white shadow-xs">
              <Car className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight">SmartPark</span>
          </Link>
          <h2 className="text-xl font-bold text-charcoal-900">Create Account</h2>
        </div>

        <div className="bg-white rounded-2xl border border-charcoal-200/80 p-6 shadow-card space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-charcoal-700">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-charcoal-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-charcoal-700">Vehicle License Plate</label>
              <div className="relative">
                <Car className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="e.g. CA-4921"
                  className="w-full pl-9 pr-3 py-2 border border-charcoal-200 rounded-lg bg-canvas text-charcoal-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-charcoal-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border border-charcoal-200 rounded-lg bg-canvas font-medium text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
              >
                <option value="USER">Driver</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-charcoal-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 border border-charcoal-200 rounded-lg bg-canvas text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600"
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
              className="w-full py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white rounded-lg font-medium shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Creating...' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-charcoal-100 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">Already registered?</span>
            <Link to="/login" className="font-semibold text-forest-700 hover:text-forest-800">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
