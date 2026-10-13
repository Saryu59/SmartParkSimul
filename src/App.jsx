import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ParkingProvider } from './contexts/ParkingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/common/Layout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboard } from './pages/UserDashboard';
import { LiveParkingMap } from './pages/LiveParkingMap';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { BookingPage } from './pages/BookingPage';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { CheckInPage } from './pages/CheckInPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <ParkingProvider>
            <Routes>
              {/* Standalone Landing Page */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Main Application Layout */}
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/map" element={<LiveParkingMap />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/reserve" element={<BookingPage />} />
                <Route path="/my-reservations" element={<MyReservationsPage />} />
                <Route path="/check-in" element={<CheckInPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </ParkingProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
