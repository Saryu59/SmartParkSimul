import { isDemoMode } from './config';
import { mockStore } from './mock/mockStore';
import { apiClient } from './api/apiClient';
import { SLOT_STATUS } from '../constants/slots';
import { RESERVATION_STATUS } from '../constants/reservations';

export const analyticsService = {
  getStats(slots, reservations) {
    const totalSlots = slots.length;
    let availableSlots = 0;
    let occupiedSlots = 0;
    let reservedSlots = 0;
    let offlineSlots = 0;
    let outOfServiceSlots = 0;

    slots.forEach((s) => {
      if (s.status === SLOT_STATUS.AVAILABLE) availableSlots++;
      else if (s.status === SLOT_STATUS.OCCUPIED) occupiedSlots++;
      else if (s.status === SLOT_STATUS.RESERVED) reservedSlots++;
      else if (s.status === SLOT_STATUS.OFFLINE) offlineSlots++;
      else if (s.status === SLOT_STATUS.OUT_OF_SERVICE) outOfServiceSlots++;
    });

    const activeReservationsCount = reservations.filter(
      (r) => r.status === RESERVATION_STATUS.ACTIVE || r.status === RESERVATION_STATUS.UPCOMING
    ).length;

    // Occupancy percentage = (occupied + reserved) / total usable slots
    const usableSlots = totalSlots - outOfServiceSlots;
    const occupancyPercentage = usableSlots > 0 ? Math.round(((occupiedSlots + reservedSlots) / usableSlots) * 100) : 0;

    // Check for unreserved occupancy slots (sensor is occupied but no active/upcoming reservation)
    const unreservedOccupancySlots = slots.filter((s) => {
      if (!s.isOccupied) return false;
      const matchingRes = reservations.find(
        (r) => r.slotId === s.id && (r.status === RESERVATION_STATUS.ACTIVE || r.status === RESERVATION_STATUS.UPCOMING)
      );
      return !matchingRes;
    });

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      offlineSlots,
      outOfServiceSlots,
      occupancyPercentage,
      activeReservationsCount,
      unreservedOccupancyCount: unreservedOccupancySlots.length,
      unreservedOccupancySlots,
    };
  },

  async getRecentEvents(limit = 10) {
    if (isDemoMode()) {
      return mockStore.events.slice(0, limit);
    }
    return await apiClient.get('/events', { limit });
  },

  getHistoricalHourlyTrends() {
    // Realistic hourly distribution curve for prototype charts
    return [
      { time: '06:00', occupancy: 1, available: 5, zoneA: 1, zoneB: 0 },
      { time: '08:00', occupancy: 3, available: 3, zoneA: 2, zoneB: 1 },
      { time: '10:00', occupancy: 5, available: 1, zoneA: 3, zoneB: 2 },
      { time: '12:00', occupancy: 6, available: 0, zoneA: 3, zoneB: 3 },
      { time: '14:00', occupancy: 4, available: 2, zoneA: 2, zoneB: 2 },
      { time: '16:00', occupancy: 5, available: 1, zoneA: 3, zoneB: 2 },
      { time: '18:00', occupancy: 3, available: 3, zoneA: 1, zoneB: 2 },
      { time: '20:00', occupancy: 2, available: 4, zoneA: 1, zoneB: 1 },
      { time: '22:00', occupancy: 1, available: 5, zoneA: 1, zoneB: 0 },
    ];
  },
};
