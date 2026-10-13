import { isDemoMode } from './config';
import { mockStore } from './mock/mockStore';
import { apiClient } from './api/apiClient';

/**
 * Reservations Service Layer
 * Enforces booking logic, cancellation, check-in, and conflict avoidance
 */
export const reservationsService = {
  async getReservations(filters = {}) {
    if (isDemoMode()) {
      let list = [...mockStore.reservations];
      if (filters.userId) {
        list = list.filter((r) => r.userId === filters.userId);
      }
      if (filters.status) {
        list = list.filter((r) => r.status === filters.status);
      }
      if (filters.slotId) {
        list = list.filter((r) => r.slotId === filters.slotId);
      }
      return list;
    }
    return await apiClient.get('/reservations', filters);
  },

  async getReservationById(id) {
    if (isDemoMode()) {
      const res = mockStore.reservations.find((r) => r.id === id);
      if (!res) throw new Error(`Reservation ${id} not found.`);
      return { ...res };
    }
    return await apiClient.get(`/reservations/${id}`);
  },

  async createReservation(data) {
    if (isDemoMode()) {
      return mockStore.createReservation(data);
    }
    return await apiClient.post('/reservations', data);
  },

  async cancelReservation(id) {
    if (isDemoMode()) {
      return mockStore.cancelReservation(id);
    }
    return await apiClient.post(`/reservations/${id}/cancel`);
  },

  async checkIn(reservationIdOrCode) {
    if (isDemoMode()) {
      return mockStore.checkIn(reservationIdOrCode);
    }
    return await apiClient.post('/check-in', { code: reservationIdOrCode });
  },

  async checkOut(id, requestingUser) {
    if (isDemoMode()) {
      return mockStore.checkOut(id, requestingUser);
    }
    return await apiClient.post(`/reservations/${id}/checkout`);
  },

  getGracePeriodMinutes() {
    if (isDemoMode()) {
      return mockStore.gracePeriodMinutes;
    }
    return 10;
  },

  setGracePeriodMinutes(minutes) {
    if (isDemoMode()) {
      mockStore.setGracePeriod(minutes);
    }
  },

  subscribe(callback) {
    if (isDemoMode()) {
      return mockStore.subscribe(() => {
        callback([...mockStore.reservations]);
      });
    }

    const ws = apiClient.connectWebSocket(
      '/reservations/live',
      (data) => {
        if (data.type === 'RESERVATIONS_UPDATE') {
          callback(data.reservations);
        }
      },
      (err) => console.error('Reservations WS error:', err),
      () => console.warn('Reservations WS disconnected.')
    );

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  },
};
