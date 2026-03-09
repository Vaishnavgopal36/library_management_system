import type { TxStatus, ResStatus, FineStatus } from './types';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Map a transaction status to a Badge component variant.
 */
export const txBadgeVariant = (status: TxStatus): BadgeVariant => {
  if (status === 'issued')   return 'info';
  if (status === 'returned') return 'success';
  if (status === 'lost')     return 'neutral';
  return 'error'; // overdue
};

/**
 * Map a reservation status to a Badge component variant.
 */
export const resBadgeVariant = (status: ResStatus): BadgeVariant => {
  switch (status) {
    case 'active':    return 'info';
    case 'completed': return 'success';
    case 'expired':   return 'warning';
    case 'cancelled': return 'neutral';
    default:          return 'neutral';
  }
};

/**
 * Map a fine status to a Badge component variant.
 */
export const fineBadgeVariant = (status: FineStatus): BadgeVariant => {
  return status === 'paid' ? 'success' : 'error';
};
