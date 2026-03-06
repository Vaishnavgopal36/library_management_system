import type { TxStatus, ResStatus, FineStatus } from './types';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Map a transaction status to a Badge component variant.
 */
export const txBadgeVariant = (status: TxStatus): BadgeVariant => {
  if (status === 'Issued') return 'info';
  if (status === 'Returned') return 'success';
  return 'error'; // Overdue
};

/**
 * Map a reservation status to a Badge component variant.
 */
export const resBadgeVariant = (status: ResStatus): BadgeVariant => {
  switch (status) {
    case 'Ready':     return 'success';
    case 'Pending':   return 'warning';
    case 'Expired':   return 'error';
    case 'Cancelled': return 'neutral';
    default:          return 'neutral';
  }
};

/**
 * Map a fine status to a Badge component variant.
 */
export const fineBadgeVariant = (status: FineStatus): BadgeVariant => {
  return status === 'Paid' ? 'success' : 'error';
};
