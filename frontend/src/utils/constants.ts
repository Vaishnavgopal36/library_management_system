/** Base URL for all API calls — set VITE_API_URL in .env to override. */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

/** Fine accrual rate charged per overdue day (in ₹). */
export const FINE_RATE_PER_DAY = 2;
