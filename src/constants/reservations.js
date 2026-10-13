/**
 * Reservation Statuses and Policies
 */

export const RESERVATION_STATUS = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
};

export const RESERVATION_STATUS_CONFIG = {
  [RESERVATION_STATUS.UPCOMING]: {
    label: 'Upcoming',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Reserved for a future time slot',
  },
  [RESERVATION_STATUS.ACTIVE]: {
    label: 'Checked In / Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'User has checked in at the entry gate or slot',
  },
  [RESERVATION_STATUS.COMPLETED]: {
    label: 'Completed',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    description: 'Vehicle exited and slot was released',
  },
  [RESERVATION_STATUS.CANCELLED]: {
    label: 'Cancelled',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    description: 'Cancelled by user or administrator prior to start',
  },
  [RESERVATION_STATUS.EXPIRED]: {
    label: 'Expired (No-Show)',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Grace period lapsed without check-in',
  },
};

export const DEFAULT_GRACE_PERIOD_MINUTES = 10;
