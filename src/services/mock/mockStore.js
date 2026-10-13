import { SLOT_STATUS } from '../../constants/slots';
import { RESERVATION_STATUS, DEFAULT_GRACE_PERIOD_MINUTES } from '../../constants/reservations';
import { EVENT_TYPES, EVENT_SEVERITY } from '../../constants/events';
import { getInitialSlots, getInitialReservations, getInitialEvents, getInitialUsers } from './initialData';
import { clockService } from '../clockService';

class MockStore {
  constructor() {
    this.listeners = new Set();
    this.load();

    // Check expirations on clock ticks
    clockService.subscribe((simulatedNow) => {
      this.evaluateExpirations(simulatedNow);
    });
  }

  load() {
    try {
      const storedSlots = localStorage.getItem('smartpark_mock_slots');
      const storedReservations = localStorage.getItem('smartpark_mock_reservations');
      const storedEvents = localStorage.getItem('smartpark_mock_events');
      const storedUsers = localStorage.getItem('smartpark_mock_users');
      const storedGrace = localStorage.getItem('smartpark_grace_period');

      this.slots = storedSlots ? JSON.parse(storedSlots) : getInitialSlots();
      this.reservations = storedReservations ? JSON.parse(storedReservations) : getInitialReservations();
      this.events = storedEvents ? JSON.parse(storedEvents) : getInitialEvents();
      this.users = storedUsers ? JSON.parse(storedUsers) : getInitialUsers();
      this.gracePeriodMinutes = storedGrace ? parseInt(storedGrace, 10) : DEFAULT_GRACE_PERIOD_MINUTES;

      // Enforce strict single active session per vehicle / driver on load
      const seenActivePlates = new Set();
      const seenActiveUsers = new Set();
      this.reservations.forEach((r) => {
        if (r.status === RESERVATION_STATUS.ACTIVE) {
          const normPlate = (r.licensePlate || '').trim().toUpperCase();
          const userId = r.userId || '';
          const isDuplicatePlate = normPlate && seenActivePlates.has(normPlate);
          const isDuplicateUser = userId && seenActiveUsers.has(userId);

          if (isDuplicatePlate || isDuplicateUser) {
            // Demote duplicate active session to completed
            r.status = RESERVATION_STATUS.COMPLETED;
            r.checkedOutAt = clockService.getCurrentIso();
          } else {
            if (normPlate) seenActivePlates.add(normPlate);
            if (userId) seenActiveUsers.add(userId);
          }
        }
      });

      // Recalculate computed slot statuses upon load
      this.recalculateAllSlotStatuses();
    } catch (e) {
      console.error('Failed to load mock store from localStorage, resetting defaults:', e);
      this.resetDefaults();
    }
  }

  save() {
    try {
      localStorage.setItem('smartpark_mock_slots', JSON.stringify(this.slots));
      localStorage.setItem('smartpark_mock_reservations', JSON.stringify(this.reservations));
      localStorage.setItem('smartpark_mock_events', JSON.stringify(this.events));
      localStorage.setItem('smartpark_mock_users', JSON.stringify(this.users));
      localStorage.setItem('smartpark_grace_period', this.gracePeriodMinutes.toString());
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Store listener error:', err);
      }
    });
  }

  resetDefaults() {
    this.slots = getInitialSlots();
    this.reservations = getInitialReservations();
    this.events = getInitialEvents();
    this.users = getInitialUsers();
    this.gracePeriodMinutes = DEFAULT_GRACE_PERIOD_MINUTES;
    this.recalculateAllSlotStatuses();
    this.save();
  }

  computeSlotStatus(slot) {
    if (slot.isMaintenance) {
      return SLOT_STATUS.OUT_OF_SERVICE;
    }
    if (!slot.sensor?.isOnline) {
      return SLOT_STATUS.OFFLINE;
    }
    if (slot.isOccupied) {
      return SLOT_STATUS.OCCUPIED;
    }
    // Check if an active or upcoming reservation occupies this slot
    if (slot.activeReservationId) {
      const res = this.reservations.find((r) => r.id === slot.activeReservationId);
      if (res && (res.status === RESERVATION_STATUS.UPCOMING || res.status === RESERVATION_STATUS.ACTIVE)) {
        return SLOT_STATUS.RESERVED;
      }
    }
    return SLOT_STATUS.AVAILABLE;
  }

  recalculateAllSlotStatuses() {
    this.slots = this.slots.map((s) => ({
      ...s,
      status: this.computeSlotStatus(s),
    }));
  }

  logEvent({ type, severity, slotId, title, description }) {
    const newEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      severity,
      slotId,
      title,
      description,
      timestamp: clockService.getCurrentIso(),
    };
    this.events.unshift(newEvent);
    // Keep max 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
  }

  // --- SENSOR SIMULATION ---

  toggleSlotOccupancy(slotId) {
    const slotIndex = this.slots.findIndex((s) => s.id === slotId);
    if (slotIndex === -1) return null;

    const slot = this.slots[slotIndex];
    const newOccupied = !slot.isOccupied;
    const nowIso = clockService.getCurrentIso();

    slot.isOccupied = newOccupied;
    slot.sensor.lastTriggeredAt = nowIso;
    slot.sensor.lastHeartbeat = nowIso;
    slot.status = this.computeSlotStatus(slot);

    if (newOccupied) {
      this.logEvent({
        type: EVENT_TYPES.SENSOR_OCCUPIED,
        severity: EVENT_SEVERITY.INFO,
        slotId: slot.id,
        title: `Vehicle Detected at Slot ${slot.id}`,
        description: `IR sensor GPIO ${slot.sensor.gpioPin} transitioned to LOW (vehicle obstacle present).`,
      });

      // Check if there is a matching valid active/upcoming reservation
      const matchingRes = this.reservations.find(
        (r) =>
          r.slotId === slot.id &&
          (r.status === RESERVATION_STATUS.ACTIVE || r.status === RESERVATION_STATUS.UPCOMING)
      );

      if (!matchingRes) {
        this.logEvent({
          type: EVENT_TYPES.UNRESERVED_OCCUPANCY,
          severity: EVENT_SEVERITY.ALERT,
          slotId: slot.id,
          title: `Unreserved Occupancy Alert (${slot.id})`,
          description: `Occupied slot without a matching reservation — review required.`,
        });
      }
    } else {
      this.logEvent({
        type: EVENT_TYPES.SENSOR_VACATED,
        severity: EVENT_SEVERITY.INFO,
        slotId: slot.id,
        title: `Vehicle Vacated Slot ${slot.id}`,
        description: `IR sensor GPIO ${slot.sensor.gpioPin} returned to HIGH (beam clear).`,
      });
    }

    this.save();
    return slot;
  }

  toggleSlotOnline(slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) return null;

    const newOnline = !slot.sensor.isOnline;
    slot.sensor.isOnline = newOnline;
    if (newOnline) {
      slot.sensor.lastHeartbeat = clockService.getCurrentIso();
      this.logEvent({
        type: EVENT_TYPES.SENSOR_ONLINE,
        severity: EVENT_SEVERITY.SUCCESS,
        slotId: slot.id,
        title: `Sensor Online (${slot.id})`,
        description: `ESP32 Wi-Fi heartbeat re-established on GPIO ${slot.sensor.gpioPin}.`,
      });
    } else {
      this.logEvent({
        type: EVENT_TYPES.SENSOR_OFFLINE,
        severity: EVENT_SEVERITY.WARNING,
        slotId: slot.id,
        title: `Sensor Offline Alert (${slot.id})`,
        description: `Sensor communication lost on GPIO ${slot.sensor.gpioPin}. Slot marked OFFLINE.`,
      });
    }

    slot.status = this.computeSlotStatus(slot);
    this.save();
    return slot;
  }

  toggleSlotMaintenance(slotId) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) return null;

    slot.isMaintenance = !slot.isMaintenance;
    slot.status = this.computeSlotStatus(slot);

    this.logEvent({
      type: EVENT_TYPES.MAINTENANCE_TOGGLED,
      severity: EVENT_SEVERITY.WARNING,
      slotId: slot.id,
      title: `Maintenance Mode ${slot.isMaintenance ? 'Enabled' : 'Disabled'} (${slot.id})`,
      description: slot.isMaintenance
        ? `Slot ${slot.id} placed out of service for inspection/calibration.`
        : `Slot ${slot.id} restored to service.`,
    });

    this.save();
    return slot;
  }

  // --- RESERVATIONS ---

  createReservation({ slotId, startTime, endTime, userId, userName, userEmail, licensePlate }) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found.`);
    }

    // Availability validation rule:
    // Slot must be online and not out of service
    if (slot.isMaintenance) {
      throw new Error(`Slot ${slotId} is currently out of service for maintenance.`);
    }
    if (!slot.sensor?.isOnline) {
      throw new Error(`Slot ${slotId} sensor is currently offline. Cannot guarantee availability.`);
    }

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (isNaN(start) || isNaN(end) || end <= start) {
      throw new Error('Invalid reservation time interval.');
    }

    const nowTime = clockService.getCurrentTime().getTime();
    if (start < nowTime - 2 * 60000) {
      throw new Error(`Cannot reserve for a past time window. The current reference time is ${clockService.getCurrentTime().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`);
    }

    // Overlap detection for the slot
    const conflicting = this.reservations.find((r) => {
      if (r.slotId !== slotId) return false;
      if (r.status === RESERVATION_STATUS.CANCELLED || r.status === RESERVATION_STATUS.EXPIRED || r.status === RESERVATION_STATUS.COMPLETED) {
        return false;
      }
      const rStart = new Date(r.startTime).getTime();
      const rEnd = new Date(r.endTime).getTime();
      // Overlap condition: start < rEnd && end > rStart
      return start < rEnd && end > rStart;
    });

    if (conflicting) {
      throw new Error(`Time slot conflict: Slot ${slotId} is already reserved for this duration (${conflicting.id}).`);
    }

    // Driver concurrency check: A single driver / vehicle cannot book two slots at the same time
    const normPlate = licensePlate ? licensePlate.trim().toUpperCase() : '';
    const driverConflict = this.reservations.find((r) => {
      if (r.status === RESERVATION_STATUS.CANCELLED || r.status === RESERVATION_STATUS.EXPIRED || r.status === RESERVATION_STATUS.COMPLETED) {
        return false;
      }
      const rPlate = r.licensePlate ? r.licensePlate.trim().toUpperCase() : '';
      const isSameUser = (userId && r.userId === userId) || (userEmail && r.userEmail?.toLowerCase() === userEmail.toLowerCase());
      const isSamePlate = normPlate && rPlate === normPlate;
      if (!isSameUser && !isSamePlate) return false;

      // If vehicle or driver currently has an active parked session right now
      if (r.status === RESERVATION_STATUS.ACTIVE) {
        return true;
      }

      const rStart = new Date(r.startTime).getTime();
      const rEnd = new Date(r.endTime).getTime();
      return start < rEnd && end > rStart;
    });

    if (driverConflict) {
      throw new Error(
        `Vehicle ${licensePlate} already has an active or reserved booking in Slot ${driverConflict.slotId} (${driverConflict.id}). A single vehicle cannot reserve multiple bays concurrently.`
      );
    }

    // Check if slot is physically occupied right now and booking starts immediately
    if (slot.isOccupied && start <= nowTime + 5 * 60000) {
      throw new Error(`Slot ${slotId} is currently occupied by a vehicle. Please select a different slot or later time.`);
    }

    // Generate reference code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SP-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newRes = {
      id: code,
      slotId,
      userId: userId || 'usr-1',
      userName: userName || 'Demo Driver',
      userEmail: userEmail || 'driver@example.com',
      licensePlate: licensePlate || 'ABC-1234',
      startTime,
      endTime,
      status: RESERVATION_STATUS.UPCOMING,
      checkedIn: false,
      checkedInAt: null,
      checkedOutAt: null,
      gracePeriodMinutes: this.gracePeriodMinutes,
      qrCodePayload: JSON.stringify({
        reservationId: code,
        slotId,
        licensePlate: licensePlate || 'ABC-1234',
        validFrom: startTime,
        validUntil: endTime,
      }),
      createdAt: clockService.getCurrentIso(),
    };

    this.reservations.unshift(newRes);

    // If reservation is starting now or soon, set activeReservationId on slot
    if (!slot.activeReservationId) {
      slot.activeReservationId = newRes.id;
    }

    slot.status = this.computeSlotStatus(slot);

    this.logEvent({
      type: EVENT_TYPES.RESERVATION_CREATED,
      severity: EVENT_SEVERITY.INFO,
      slotId,
      title: `Reservation Confirmed (${code})`,
      description: `Slot ${slotId} reserved for ${newRes.userName} (${newRes.licensePlate}).`,
    });

    this.save();
    return newRes;
  }

  cancelReservation(reservationId) {
    const res = this.reservations.find((r) => r.id === reservationId);
    if (!res) throw new Error('Reservation not found.');

    if (res.status === RESERVATION_STATUS.COMPLETED || res.status === RESERVATION_STATUS.CANCELLED || res.status === RESERVATION_STATUS.EXPIRED) {
      throw new Error(`Reservation is already ${res.status.toLowerCase()}.`);
    }

    res.status = RESERVATION_STATUS.CANCELLED;

    // Check slot
    const slot = this.slots.find((s) => s.id === res.slotId);
    if (slot && slot.activeReservationId === reservationId) {
      slot.activeReservationId = null;
      // Re-evaluate if another upcoming reservation exists
      const nextRes = this.reservations.find(
        (r) =>
          r.slotId === slot.id &&
          r.id !== reservationId &&
          (r.status === RESERVATION_STATUS.UPCOMING || r.status === RESERVATION_STATUS.ACTIVE)
      );
      if (nextRes) {
        slot.activeReservationId = nextRes.id;
      }
      slot.status = this.computeSlotStatus(slot);
    }

    this.logEvent({
      type: EVENT_TYPES.RESERVATION_CANCELLED,
      severity: EVENT_SEVERITY.INFO,
      slotId: res.slotId,
      title: `Reservation Cancelled (${reservationId})`,
      description: `Booking for Slot ${res.slotId} cancelled. Slot released.`,
    });

    this.save();
    return res;
  }

  checkIn(reservationIdOrCode) {
    const trimmed = (reservationIdOrCode || '').trim().toUpperCase();
    const res = this.reservations.find(
      (r) => r.id.toUpperCase() === trimmed || r.qrCodePayload.includes(trimmed)
    );

    if (!res) {
      throw new Error(`No reservation found matching reference "${reservationIdOrCode}".`);
    }

    if (res.status === RESERVATION_STATUS.ACTIVE) {
      throw new Error(`Reservation ${res.id} is already checked in.`);
    }

    if (res.status === RESERVATION_STATUS.COMPLETED) {
      throw new Error(`Reservation ${res.id} has already been completed.`);
    }

    if (res.status === RESERVATION_STATUS.CANCELLED) {
      throw new Error(`Reservation ${res.id} was cancelled.`);
    }

    if (res.status === RESERVATION_STATUS.EXPIRED) {
      throw new Error(`Reservation ${res.id} expired due to no-show.`);
    }

    const now = clockService.getCurrentTime();
    const startTime = new Date(res.startTime);
    const endTime = new Date(res.endTime);

    // Can check in up to 30 mins early
    const earlyLimit = new Date(startTime.getTime() - 30 * 60000);
    if (now < earlyLimit) {
      throw new Error(`Check-in opens 30 minutes before reservation start time (${res.startTime}).`);
    }

    if (now > endTime) {
      throw new Error(`Reservation period ended at ${res.endTime}.`);
    }

    // Check if driver or vehicle is already checked in at another slot
    const alreadyActive = this.reservations.find(
      (r) =>
        r.id !== res.id &&
        r.status === RESERVATION_STATUS.ACTIVE &&
        ((res.userId && r.userId === res.userId) ||
         (res.licensePlate && r.licensePlate.trim().toUpperCase() === res.licensePlate.trim().toUpperCase()))
    );

    if (alreadyActive) {
      throw new Error(
        `Vehicle ${res.licensePlate} is already checked in at Slot ${alreadyActive.slotId} (${alreadyActive.id}). You must process exit on that session before checking in to another bay.`
      );
    }

    res.status = RESERVATION_STATUS.ACTIVE;
    res.checkedIn = true;
    res.checkedInAt = now.toISOString();

    const slot = this.slots.find((s) => s.id === res.slotId);
    if (slot) {
      slot.activeReservationId = res.id;
      // Note: Do not automatically set slot.isOccupied to true if hardware IR sensor hasn't detected car yet!
      // But update slot status to reflect active check-in
      slot.status = this.computeSlotStatus(slot);
    }

    this.logEvent({
      type: EVENT_TYPES.CHECK_IN_SUCCESS,
      severity: EVENT_SEVERITY.SUCCESS,
      slotId: res.slotId,
      title: `Check-in Verified (${res.id})`,
      description: `Vehicle ${res.licensePlate} verified for Slot ${res.slotId} (Simulated Entry Scan).`,
    });

    this.save();
    return res;
  }

  checkOut(reservationId, requestingUser) {
    const res = this.reservations.find((r) => r.id === reservationId);
    if (!res) throw new Error('Reservation not found.');

    if (requestingUser && requestingUser.role !== 'ADMIN') {
      if (res.userId !== requestingUser.id && res.userEmail !== requestingUser.email) {
        throw new Error("Access Denied: You cannot exit another driver's vehicle.");
      }
    }

    if (res.status !== RESERVATION_STATUS.ACTIVE) {
      throw new Error(`Cannot check out reservation with status ${res.status}.`);
    }

    const nowIso = clockService.getCurrentIso();
    res.status = RESERVATION_STATUS.COMPLETED;
    res.checkedOutAt = nowIso;

    const slot = this.slots.find((s) => s.id === res.slotId);
    if (slot && slot.activeReservationId === reservationId) {
      slot.activeReservationId = null;
      slot.status = this.computeSlotStatus(slot);
    }

    this.logEvent({
      type: EVENT_TYPES.CHECK_OUT_SUCCESS,
      severity: EVENT_SEVERITY.INFO,
      slotId: res.slotId,
      title: `Check-out Completed (${res.id})`,
      description: `Vehicle ${res.licensePlate} exited. Slot ${res.slotId} released.`,
    });

    this.save();
    return res;
  }

  // Grace-period no-show evaluation
  evaluateExpirations(simulatedNow) {
    const nowTime = simulatedNow.getTime();
    let changed = false;

    this.reservations.forEach((res) => {
      if (res.status === RESERVATION_STATUS.UPCOMING && !res.checkedIn) {
        const startTime = new Date(res.startTime).getTime();
        const graceLimit = startTime + (res.gracePeriodMinutes || this.gracePeriodMinutes) * 60000;

        if (nowTime > graceLimit) {
          // Grace period exceeded! Mark expired
          res.status = RESERVATION_STATUS.EXPIRED;
          changed = true;

          const slot = this.slots.find((s) => s.id === res.slotId);
          if (slot && slot.activeReservationId === res.id) {
            slot.activeReservationId = null;

            // CRITICAL REQUIREMENT:
            // "Before releasing a slot, check its physical occupancy. Never make an occupied slot available simply because a reservation expired."
            slot.status = this.computeSlotStatus(slot);

            if (slot.isOccupied) {
              // Slot remains OCCUPIED, and this becomes an unreserved occupancy alert!
              this.logEvent({
                type: EVENT_TYPES.UNRESERVED_OCCUPANCY,
                severity: EVENT_SEVERITY.ALERT,
                slotId: slot.id,
                title: `Unreserved Occupancy Alert (${slot.id})`,
                description: `Reservation ${res.id} expired, but physical vehicle is still present in slot. Review required.`,
              });
            }
          }

          this.logEvent({
            type: EVENT_TYPES.RESERVATION_EXPIRED,
            severity: EVENT_SEVERITY.WARNING,
            slotId: res.slotId,
            title: `Reservation Expired: No-Show (${res.id})`,
            description: `Reservation for Slot ${res.slotId} exceeded ${res.gracePeriodMinutes || this.gracePeriodMinutes}-minute grace period without check-in.`,
          });
        }
      }
    });

    if (changed) {
      this.save();
    }
  }

  setGracePeriod(minutes) {
    this.gracePeriodMinutes = Math.max(1, parseInt(minutes, 10));
    localStorage.setItem('smartpark_grace_period', this.gracePeriodMinutes.toString());
    this.save();
  }
}

export const mockStore = new MockStore();
