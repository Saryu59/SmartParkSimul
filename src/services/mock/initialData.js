import { SLOT_STATUS, HARDWARE_PINS } from '../../constants/slots';
import { RESERVATION_STATUS } from '../../constants/reservations';
import { EVENT_TYPES, EVENT_SEVERITY } from '../../constants/events';

export function getInitialSlots() {
  const now = new Date();
  
  return [
    {
      id: 'A1',
      zone: 'A',
      name: 'Slot A1',
      isAccessible: true, // Designated accessible / disability parking
      distanceToEntranceMeters: 10,
      isOccupied: false,
      activeReservationId: null,
      status: SLOT_STATUS.AVAILABLE,
      isMaintenance: false,
      sensor: {
        id: HARDWARE_PINS.A1.sensorName,
        gpioPin: HARDWARE_PINS.A1.pin,
        isOnline: true,
        lastHeartbeat: new Date(now.getTime() - 2 * 60000).toISOString(),
        batteryPercent: 98,
        signalDbm: -55,
        lastTriggeredAt: new Date(now.getTime() - 45 * 60000).toISOString(),
      },
    },
    {
      id: 'A2',
      zone: 'A',
      name: 'Slot A2',
      isAccessible: false,
      distanceToEntranceMeters: 14,
      isOccupied: false,
      activeReservationId: null,
      status: SLOT_STATUS.AVAILABLE,
      isMaintenance: false,
      sensor: {
        id: HARDWARE_PINS.A2.sensorName,
        gpioPin: HARDWARE_PINS.A2.pin,
        isOnline: true,
        lastHeartbeat: new Date(now.getTime() - 1 * 60000).toISOString(),
        batteryPercent: 94,
        signalDbm: -58,
        lastTriggeredAt: new Date(now.getTime() - 90 * 60000).toISOString(),
      },
    },
    {
      id: 'A3',
      zone: 'A',
      name: 'Slot A3',
      isAccessible: false,
      distanceToEntranceMeters: 18,
      isOccupied: false,
      activeReservationId: 'RES-8041',
      status: SLOT_STATUS.RESERVED,
      isMaintenance: false,
      sensor: {
        id: HARDWARE_PINS.A3.sensorName,
        gpioPin: HARDWARE_PINS.A3.pin,
        isOnline: true,
        lastHeartbeat: new Date(now.getTime() - 3 * 60000).toISOString(),
        batteryPercent: 88,
        signalDbm: -62,
        lastTriggeredAt: new Date(now.getTime() - 120 * 60000).toISOString(),
      },
    },
    {
      id: 'B1',
      zone: 'B',
      name: 'Slot B1',
      isAccessible: false,
      distanceToEntranceMeters: 20,
      isOccupied: true, // Physical vehicle detected
      activeReservationId: 'RES-7890',
      status: SLOT_STATUS.OCCUPIED,
      isMaintenance: false,
      sensor: {
        id: HARDWARE_PINS.B1.sensorName,
        gpioPin: HARDWARE_PINS.B1.pin,
        isOnline: true,
        lastHeartbeat: new Date(now.getTime() - 1 * 60000).toISOString(),
        batteryPercent: 95,
        signalDbm: -50,
        lastTriggeredAt: new Date(now.getTime() - 30 * 60000).toISOString(),
      },
    },
    {
      id: 'B2',
      zone: 'B',
      name: 'Slot B2',
      isAccessible: false,
      distanceToEntranceMeters: 24,
      isOccupied: false,
      activeReservationId: null,
      status: SLOT_STATUS.AVAILABLE,
      isMaintenance: false,
      sensor: {
        id: HARDWARE_PINS.B2.sensorName,
        gpioPin: HARDWARE_PINS.B2.pin,
        isOnline: true,
        lastHeartbeat: new Date(now.getTime() - 4 * 60000).toISOString(),
        batteryPercent: 86,
        signalDbm: -65,
        lastTriggeredAt: new Date(now.getTime() - 60 * 60000).toISOString(),
      },
    },
    {
      id: 'B3',
      zone: 'B',
      name: 'Slot B3',
      isAccessible: false,
      distanceToEntranceMeters: 28,
      isOccupied: true, // Physical vehicle detected BUT NO MATCHING RESERVATION
      activeReservationId: null,
      status: SLOT_STATUS.OCCUPIED,
      isMaintenance: false,
      sensor: {
        id: HARDWARE_PINS.B3.sensorName,
        gpioPin: HARDWARE_PINS.B3.pin,
        isOnline: true,
        lastHeartbeat: new Date(now.getTime() - 2 * 60000).toISOString(),
        batteryPercent: 91,
        signalDbm: -54,
        lastTriggeredAt: new Date(now.getTime() - 14 * 60000).toISOString(),
      },
    },
  ];
}

export function getInitialUsers() {
  return [
    {
      id: 'usr-1',
      name: 'Alex Rivera',
      email: 'alex@smartpark.demo',
      role: 'USER',
      licensePlate: 'EV-882-NY',
      phone: '+1 (555) 019-2834',
      preferredZone: 'A',
      registeredAt: '2026-09-15T08:30:00Z',
    },
    {
      id: 'usr-admin',
      name: 'Sarah Jenkins',
      email: 'admin@smartpark.demo',
      role: 'ADMIN',
      licensePlate: 'ADM-001-HQ',
      department: 'Smart Facilities & Security',
      phone: '+1 (555) 019-9000',
      registeredAt: '2026-08-01T08:00:00Z',
    },
  ];
}

export function getInitialReservations() {
  const now = new Date();
  
  return [
    {
      id: 'RES-8041',
      slotId: 'A3',
      userId: 'usr-1',
      userName: 'Alex Rivera',
      userEmail: 'alex@smartpark.demo',
      licensePlate: 'EV-882-NY',
      startTime: new Date(now.getTime() + 15 * 60000).toISOString(),
      endTime: new Date(now.getTime() + 75 * 60000).toISOString(),
      status: RESERVATION_STATUS.UPCOMING,
      checkedIn: false,
      checkedInAt: null,
      checkedOutAt: null,
      gracePeriodMinutes: 10,
      qrCodePayload: JSON.stringify({
        reservationId: 'RES-8041',
        slotId: 'A3',
        licensePlate: 'EV-882-NY',
        validFrom: new Date(now.getTime() + 15 * 60000).toISOString(),
      }),
      createdAt: new Date(now.getTime() - 30 * 60000).toISOString(),
    },
    {
      id: 'RES-7890',
      slotId: 'B1',
      userId: 'usr-2',
      userName: 'Elena Rostova',
      userEmail: 'elena@techcorp.io',
      licensePlate: 'K7-9921',
      startTime: new Date(now.getTime() - 35 * 60000).toISOString(),
      endTime: new Date(now.getTime() + 55 * 60000).toISOString(),
      status: RESERVATION_STATUS.ACTIVE,
      checkedIn: true,
      checkedInAt: new Date(now.getTime() - 30 * 60000).toISOString(),
      checkedOutAt: null,
      gracePeriodMinutes: 10,
      qrCodePayload: JSON.stringify({
        reservationId: 'RES-7890',
        slotId: 'B1',
        licensePlate: 'K7-9921',
        validFrom: new Date(now.getTime() - 35 * 60000).toISOString(),
      }),
      createdAt: new Date(now.getTime() - 60 * 60000).toISOString(),
    },
    {
      id: 'RES-7501',
      slotId: 'A2',
      userId: 'usr-1',
      userName: 'Alex Rivera',
      userEmail: 'alex@smartpark.demo',
      licensePlate: 'EV-882-NY',
      startTime: new Date(now.getTime() - 26 * 3600000).toISOString(),
      endTime: new Date(now.getTime() - 24 * 3600000).toISOString(),
      status: RESERVATION_STATUS.COMPLETED,
      checkedIn: true,
      checkedInAt: new Date(now.getTime() - 26 * 3600000 + 5 * 60000).toISOString(),
      checkedOutAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      gracePeriodMinutes: 10,
      qrCodePayload: JSON.stringify({
        reservationId: 'RES-7501',
        slotId: 'A2',
        licensePlate: 'EV-882-NY',
        validFrom: new Date(now.getTime() - 26 * 3600000).toISOString(),
      }),
      createdAt: new Date(now.getTime() - 27 * 3600000).toISOString(),
    },
  ];
}

export function getInitialEvents() {
  const now = new Date();
  return [
    {
      id: 'evt-101',
      type: EVENT_TYPES.SENSOR_OCCUPIED,
      severity: EVENT_SEVERITY.INFO,
      slotId: 'B1',
      title: 'Vehicle Detected at Slot B1',
      description: 'IR obstacle sensor GPIO 25 triggered LOW (beam interrupted).',
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
    },
    {
      id: 'evt-102',
      type: EVENT_TYPES.CHECK_IN_SUCCESS,
      severity: EVENT_SEVERITY.SUCCESS,
      slotId: 'B1',
      title: 'QR Check-in Verified',
      description: 'Reservation RES-7890 marked Active via Entry Gate scanner.',
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
    },
    {
      id: 'evt-103',
      type: EVENT_TYPES.UNRESERVED_OCCUPANCY,
      severity: EVENT_SEVERITY.ALERT,
      slotId: 'B3',
      title: 'Unreserved Occupancy Alert',
      description: 'Occupied slot without a matching reservation — review required.',
      timestamp: new Date(now.getTime() - 14 * 60000).toISOString(),
    },
    {
      id: 'evt-104',
      type: EVENT_TYPES.RESERVATION_CREATED,
      severity: EVENT_SEVERITY.INFO,
      slotId: 'A3',
      title: 'Reservation Confirmed',
      description: 'Reservation RES-8041 booked for Slot A3 by Alex Rivera.',
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
    },
  ];
}
