/**
 * Format an ISO datetime string to a human-readable date.
 * e.g. "2026-02-25T09:00:00" → "25 Feb 2026"
 */
export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
