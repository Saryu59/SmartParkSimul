import React from 'react';
import { SLOT_STATUS_CONFIG, SLOT_STATUS } from '../../constants/slots';

export function StatusBadge({ status, size = 'md' }) {
  const config = SLOT_STATUS_CONFIG[status] || SLOT_STATUS_CONFIG[SLOT_STATUS.OFFLINE];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.badgeClass} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.indicatorClass} shrink-0`} />
      {config.label}
    </span>
  );
}
