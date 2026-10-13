import { isDemoMode } from './config';
import { mockStore } from './mock/mockStore';
import { apiClient } from './api/apiClient';

const AUTH_USER_KEY = 'smartpark_auth_user';

export const authService = {
  getCurrentUser() {
    if (!isDemoMode()) {
      const token = localStorage.getItem('smartpark_token');
      if (!token) return null;
    }
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    // Default to the demo regular user in demo mode for instant frictionless testing
    if (isDemoMode()) {
      return mockStore.users[0]; // Alex Rivera (USER)
    }
    return null;
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
    window.dispatchEvent(new CustomEvent('smartpark:auth-changed', { detail: { user } }));
  },

  async login(email, password) {
    if (isDemoMode()) {
      // Demo validation
      const user = mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('No demo account found with this email. Try alex@smartpark.demo or admin@smartpark.demo.');
      }
      if (password && password.length < 4) {
        throw new Error('Password must be at least 4 characters in demo mode.');
      }
      this.setCurrentUser(user);
      return user;
    }

    // Real API login
    const res = await apiClient.post('/auth/login', { username: email, password });
    apiClient.setToken(res.access_token);
    const user = res.user;
    this.setCurrentUser(user);
    return user;
  },

  async register({ name, email, password, licensePlate, role = 'USER' }) {
    if (isDemoMode()) {
      const existing = mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        throw new Error('An account with this email already exists.');
      }
      const newUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role: role.toUpperCase(),
        licensePlate: licensePlate || 'ABC-1234',
        registeredAt: new Date().toISOString(),
      };
      mockStore.users.push(newUser);
      mockStore.save();
      this.setCurrentUser(newUser);
      return newUser;
    }

    const res = await apiClient.post('/auth/register', { name, email, password, licensePlate, role });
    apiClient.setToken(res.access_token);
    this.setCurrentUser(res.user);
    return res.user;
  },

  setGuestMode() {
    const guestUser = {
      id: 'guest',
      name: 'Guest Explorer',
      email: 'guest@smartpark.local',
      role: 'GUEST',
      isGuest: true,
    };
    this.setCurrentUser(guestUser);
    return guestUser;
  },

  switchRole(role) {
    if (!isDemoMode()) {
      throw new Error('Role switching is only allowed in Demo Mode.');
    }
    const targetUser = mockStore.users.find((u) => u.role === role);
    if (targetUser) {
      this.setCurrentUser(targetUser);
      return targetUser;
    }
    // Create or set role
    const cur = this.getCurrentUser() || mockStore.users[0];
    const updated = { ...cur, role };
    this.setCurrentUser(updated);
    return updated;
  },

  logout() {
    this.setCurrentUser(null);
    if (!isDemoMode()) {
      apiClient.setToken(null);
    }
  },
};
