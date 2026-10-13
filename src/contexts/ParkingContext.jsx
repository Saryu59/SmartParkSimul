import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { slotsService } from '../services/slotsService';
import { reservationsService } from '../services/reservationsService';
import { analyticsService } from '../services/analyticsService';
import { clockService } from '../services/clockService';
import { isDemoMode } from '../services/config';
import { mockStore } from '../services/mock/mockStore';

const ParkingContext = createContext(null);

export function ParkingProvider({ children }) {
  const [slots, setSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [events, setEvents] = useState([]);
  const [simulatedTime, setSimulatedTime] = useState(clockService.getCurrentTime());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial fetch and subscription
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedSlots, fetchedReservations, fetchedEvents] = await Promise.all([
        slotsService.getSlots(),
        reservationsService.getReservations(),
        analyticsService.getRecentEvents(20),
      ]);
      setSlots(fetchedSlots);
      setReservations(fetchedReservations);
      setEvents(fetchedEvents);
    } catch (err) {
      console.error('Failed to load parking system data:', err);
      setError(err.message || 'Unable to connect to parking service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to slots and reservations updates
    const unsubSlots = slotsService.subscribe((updatedSlots) => {
      setSlots(updatedSlots);
    });

    const unsubReservations = reservationsService.subscribe((updatedReservations) => {
      setReservations(updatedReservations);
    });

    // Subscribe to clock ticks
    const unsubClock = clockService.subscribe((now) => {
      setSimulatedTime(now);
    });

    return () => {
      if (unsubSlots) unsubSlots();
      if (unsubReservations) unsubReservations();
      if (unsubClock) unsubClock();
    };
  }, [loadData]);

  // Sync events whenever mock store or data updates
  useEffect(() => {
    if (isDemoMode()) {
      const unsub = mockStore.subscribe(() => {
        setEvents([...mockStore.events]);
      });
      return () => unsub();
    }
  }, []);

  // Compute live statistics dynamically
  const stats = useMemo(() => {
    return analyticsService.getStats(slots, reservations);
  }, [slots, reservations]);

  // Reservation actions
  const createReservation = async (bookingData) => {
    const newRes = await reservationsService.createReservation(bookingData);
    await loadData();
    return newRes;
  };

  const cancelReservation = async (reservationId) => {
    const cancelled = await reservationsService.cancelReservation(reservationId);
    await loadData();
    return cancelled;
  };

  const checkIn = async (code) => {
    const checked = await reservationsService.checkIn(code);
    await loadData();
    return checked;
  };

  const checkOut = async (id, requestingUser) => {
    const checkedOut = await reservationsService.checkOut(id, requestingUser);
    await loadData();
    return checkedOut;
  };

  // Sensor simulation actions (Demo mode only)
  const toggleSensorOccupancy = async (slotId) => {
    const res = await slotsService.simulateSensorTrigger(slotId);
    await loadData();
    return res;
  };

  const toggleSensorOnline = async (slotId) => {
    const res = await slotsService.simulateSensorOnline(slotId);
    await loadData();
    return res;
  };

  const toggleSlotMaintenance = async (slotId) => {
    const res = await slotsService.toggleSlotMaintenance(slotId);
    await loadData();
    return res;
  };

  const advanceClock = (minutes) => {
    clockService.advanceMinutes(minutes);
    setSimulatedTime(clockService.getCurrentTime());
  };

  const resetClock = () => {
    clockService.resetToRealTime();
    setSimulatedTime(clockService.getCurrentTime());
  };

  const resetDemoData = () => {
    if (isDemoMode()) {
      mockStore.resetDefaults();
      clockService.resetToRealTime();
      loadData();
    }
  };

  return (
    <ParkingContext.Provider
      value={{
        slots,
        reservations,
        events,
        stats,
        simulatedTime,
        isClockOffset: clockService.isOffset(),
        clockOffsetMinutes: clockService.getOffsetMinutes(),
        loading,
        error,
        refreshData: loadData,
        createReservation,
        cancelReservation,
        checkIn,
        checkOut,
        toggleSensorOccupancy,
        toggleSensorOnline,
        toggleSlotMaintenance,
        advanceClock,
        resetClock,
        resetDemoData,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking() {
  const ctx = useContext(ParkingContext);
  if (!ctx) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return ctx;
}
