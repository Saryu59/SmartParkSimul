/**
 * Parking Slot Statuses and Metadata Constants
 */

export const SLOT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
  OFFLINE: 'OFFLINE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
};

export const SLOT_STATUS_CONFIG = {
  [SLOT_STATUS.AVAILABLE]: {
    label: 'Available',
    color: 'forest',
    badgeClass: 'bg-[#EBF5F0] text-[#176B4D] border-[#C6E2D6]',
    indicatorClass: 'bg-[#176B4D]',
    borderClass: 'border-[#C6E2D6] hover:border-[#176B4D]',
    description: 'Vacant and ready to be reserved or parked in',
  },
  [SLOT_STATUS.RESERVED]: {
    label: 'Reserved',
    color: 'amber',
    badgeClass: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    indicatorClass: 'bg-[#D97706]',
    borderClass: 'border-[#FDE68A] hover:border-[#D97706]',
    description: 'Booking exists; waiting for vehicle arrival',
  },
  [SLOT_STATUS.OCCUPIED]: {
    label: 'Occupied',
    color: 'rose',
    badgeClass: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    indicatorClass: 'bg-[#DC2626]',
    borderClass: 'border-[#FECACA] hover:border-[#DC2626]',
    description: 'IR obstacle sensor currently detects a vehicle',
  },
  [SLOT_STATUS.OFFLINE]: {
    label: 'Sensor Offline',
    color: 'slate',
    badgeClass: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    indicatorClass: 'bg-[#64748B]',
    borderClass: 'border-[#E2E8F0] hover:border-[#94A3B8]',
    description: 'ESP32 heartbeat or sensor communication lost; availability cannot be verified',
  },
  [SLOT_STATUS.OUT_OF_SERVICE]: {
    label: 'Out of Service',
    color: 'charcoal',
    badgeClass: 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]',
    indicatorClass: 'bg-[#94A3B8]',
    borderClass: 'border-[#E2E8F0] hover:border-[#64748B]',
    description: 'Temporarily closed for maintenance or calibration',
  },
};

export const ZONES = {
  ALL: 'ALL',
  A: 'Zone A',
  B: 'Zone B',
};

export const HARDWARE_PINS = {
  A1: { pin: 21, sensorName: 'IR-A1-FC51' },
  A2: { pin: 22, sensorName: 'IR-A2-FC51' },
  A3: { pin: 23, sensorName: 'IR-A3-FC51' },
  B1: { pin: 25, sensorName: 'IR-B1-FC51' },
  B2: { pin: 26, sensorName: 'IR-B2-FC51' },
  B3: { pin: 27, sensorName: 'IR-B3-FC51' },
};
