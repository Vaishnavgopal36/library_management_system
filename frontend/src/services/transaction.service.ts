import { api, qs } from './api';

// ── API response shape (matching TransactionResponse.java) ────────────────────
/** Status values exactly as returned by the backend (lowercase). */
export type ApiTxStatus = 'issued' | 'returned' | 'overdue' | 'lost';

export interface ApiTransaction {
  id: string;
  bookId: string;
  userId: string;
  bookName: string;
  userName: string;
  checkoutDate: string;
  dueDate: string;
  returnDate?: string;
  status: ApiTxStatus;
  /** Sum of all fine records for this transaction (₹). 0 means no fine charged yet. */
  totalAccruedFine: number;
}

// ── Filter params (name/title based — no UUID inputs from user) ───────────────
export interface TransactionFilterParams {
  bookName?: string;          // used to search books first, then pass bookId
  userName?: string;          // admin only — used to search users, then pass userId
  bookId?: string;            // internal only — resolved from bookName search
  userId?: string;            // internal only — resolved from user search
  status?: ApiTxStatus;
  checkoutAfter?: string;
  checkoutBefore?: string;
  dueAfter?: string;
  dueBefore?: string;
}

// ── Transaction service ───────────────────────────────────────────────────────
export const transactionService = {
  /**
   * GET /transaction
   * Admin → global history. Member → own history (scoped by JWT on backend).
   * Returns a plain list (not paginated from backend).
   */
  async list(params: TransactionFilterParams = {}): Promise<ApiTransaction[]> {
    const query = qs({
      bookId:        params.bookId,
      userId:        params.userId,
      status:        params.status,
      checkoutAfter: params.checkoutAfter,
      checkoutBefore: params.checkoutBefore,
      dueAfter:      params.dueAfter,
      dueBefore:     params.dueBefore,
    });
    return api.get<ApiTransaction[]>(`/transaction${query}`);
  },

  /**
   * POST /transaction — issue a book (admin or member).
   * bookId must be resolved from a title search first; never typed by user.
   * userId is optional for admin (to issue on behalf of a member).
   */
  async issue(bookId: string, userId?: string): Promise<ApiTransaction> {
    return api.post<ApiTransaction>('/transaction', { bookId, userId });
  },

  /**
   * PUT /transaction/{id} — return a book.
   * transactionId comes from the list, never typed by user.
   */
  async returnBook(transactionId: string): Promise<ApiTransaction> {
    return api.put<ApiTransaction>(`/transaction/${transactionId}`, { status: 'returned' });
  },

  /**
   * PUT /transaction/{id} — mark as lost.
   */
  async markLost(transactionId: string): Promise<ApiTransaction> {
    return api.put<ApiTransaction>(`/transaction/${transactionId}`, { status: 'lost' });
  },
};
