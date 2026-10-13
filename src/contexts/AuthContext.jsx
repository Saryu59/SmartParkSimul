import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleAuthChange = (e) => {
      setUser(e.detail?.user || null);
    };
    window.addEventListener('smartpark:auth-changed', handleAuthChange);
    return () => window.removeEventListener('smartpark:auth-changed', handleAuthChange);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const u = await authService.login(email, password);
      setUser(u);
      return u;
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    setIsLoading(true);
    try {
      const u = await authService.register(data);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const setGuestMode = () => {
    const g = authService.setGuestMode();
    setUser(g);
    return g;
  };

  const switchRole = (role) => {
    const u = authService.switchRole(role);
    setUser(u);
    return u;
  };

  const isGuest = user?.role === 'GUEST';
  const isAdmin = user?.role === 'ADMIN';
  const isLoggedIn = !!user && !isGuest;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'ANONYMOUS',
        isLoggedIn,
        isGuest,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        setGuestMode,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
