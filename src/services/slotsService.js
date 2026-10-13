import { isDemoMode } from './config';
import { mockStore } from './mock/mockStore';
import { apiClient } from './api/apiClient';

/**
 * Slots Service Layer
 * Abstracts data source (MockStore in demo mode vs FastAPI in production)
 */
export const slotsService = {
  async getSlots() {
    if (isDemoMode()) {
      return [...mockStore.slots];
    }
    return await apiClient.get('/slots');
  },

  async getSlotById(id) {
    if (isDemoMode()) {
      const slot = mockStore.slots.find((s) => s.id === id);
      if (!slot) throw new Error(`Slot ${id} not found.`);
      return { ...slot };
    }
    return await apiClient.get(`/slots/${id}`);
  },

  async toggleSlotMaintenance(id) {
    if (isDemoMode()) {
      return mockStore.toggleSlotMaintenance(id);
    }
    return await apiClient.post(`/slots/${id}/maintenance`);
  },

  // Simulated hardware triggers for demo testing
  async simulateSensorTrigger(id) {
    if (!isDemoMode()) {
      throw new Error('Simulated sensor triggers are only available in Demo Mode.');
    }
    return mockStore.toggleSlotOccupancy(id);
  },

  async simulateSensorOnline(id) {
    if (!isDemoMode()) {
      throw new Error('Simulated sensor online/offline triggers are only available in Demo Mode.');
    }
    return mockStore.toggleSlotOnline(id);
  },

  subscribe(callback) {
    if (isDemoMode()) {
      return mockStore.subscribe(() => {
        callback([...mockStore.slots]);
      });
    }

    // Real WebSocket subscription
    const ws = apiClient.connectWebSocket(
      '/slots/live',
      (data) => {
        if (data.type === 'SLOTS_UPDATE') {
          callback(data.slots);
        }
      },
      (err) => console.error('Slots WS error:', err),
      () => console.warn('Slots WS disconnected.')
    );

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  },
};
