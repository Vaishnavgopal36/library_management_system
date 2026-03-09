import { api } from './api';

// ── Analytics payload shape (matching ReportService.generateSystemAnalytics) ──
export interface SystemAnalytics {
  totalActiveBooks: number;
  totalActiveUsers: number;
  currentlyIssuedBooks: number;
  totalUnpaidFinesValue: number;
  totalFineRevenue: number;
  topBorrowedBooks: { bookId: string; title: string; borrowCount: number }[];
  [key: string]: unknown; // backend may add fields over time
}

// ── Report service ────────────────────────────────────────────────────────────
export const reportService = {
  /**
   * GET /report — admin only.
   * Returns system-wide analytics aggregates.
   */
  async getAnalytics(): Promise<SystemAnalytics> {
    return api.get<SystemAnalytics>('/report');
  },
};
