import { api, qs } from './api';

// ── API response shape (matching FineResponse.java) ───────────────────────────
export interface ApiFine {
  id: string;
  transactionId: string;
  bookId: string;
  userId: string;
  bookName: string;
  userName: string;
  amount: number;
  isPaid: boolean;
}

// ── Filter params ─────────────────────────────────────────────────────────────
export interface FineFilterParams {
  fineId?: string;        // internal — from list selection
  userId?: string;        // internal — resolved from user name search
  transactionId?: string; // internal — from transaction list
  isPaid?: boolean;
  minAmount?: number;
  maxAmount?: number;
}

// ── Fine service ───────────────────────────────────────────────────────────────
export const fineService = {
  /**
   * GET /fine
   * Admin → all fines. Member → own fines (scoped by JWT on backend).
   */
  async list(params: FineFilterParams = {}): Promise<ApiFine[]> {
    const query = qs({
      fineId:        params.fineId,
      userId:        params.userId,
      transactionId: params.transactionId,
      isPaid:        params.isPaid,
      minAmount:     params.minAmount,
      maxAmount:     params.maxAmount,
    });
    return api.get<ApiFine[]>(`/fine${query}`);
  },

  /**
   * PUT /fine/{id} — mark a fine as paid.
   * fineId comes from the list row, never typed by user.
   */
  async settle(fineId: string): Promise<ApiFine> {
    return api.put<ApiFine>(`/fine/${fineId}`, { is_paid: true });
  },
};
