import { api, qs } from './api';
import type { ApiBook } from './book.service';
import type { UserResponse } from './user.service';

// ── API response shape (matching ReservationResponse.java) ───────────────────
/** Status values exactly as returned by the backend */
export type ApiResStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export interface ApiReservation {
  id: string;
  user: UserResponse;
  book: ApiBook;
  reservedAt: string;    // ISO-8601 LocalDateTime, no Z
  expiresAt: string;
  status: ApiResStatus;
}

// ── Filter params ─────────────────────────────────────────────────────────────
export interface ReservationFilterParams {
  reservationId?: string;   // internal
  userId?: string;          // internal — resolved from user search
  bookId?: string;          // internal — resolved from book search
  status?: ApiResStatus;
  reservedAfter?: string;
  reservedBefore?: string;
  expiresAfter?: string;
  expiresBefore?: string;
  includeExpired?: boolean;
}

// ── Reservation service ───────────────────────────────────────────────────────
export const reservationService = {
  /**
   * GET /reservation
   * Admin → all. Member → own (scoped by JWT on backend).
   */
  async list(params: ReservationFilterParams = {}): Promise<ApiReservation[]> {
    const query = qs({
      reservationId:  params.reservationId,
      userId:         params.userId,
      bookId:         params.bookId,
      status:         params.status,
      reservedAfter:  params.reservedAfter,
      reservedBefore: params.reservedBefore,
      expiresAfter:   params.expiresAfter,
      expiresBefore:  params.expiresBefore,
      includeExpired: params.includeExpired,
    });
    return api.get<ApiReservation[]>(`/reservation${query}`);
  },

  /**
   * POST /reservation
   * bookId must be resolved from a title search first — never typed by user.
   * userId is optional (admin issuing on behalf of member).
   */
  async create(bookId: string, userId?: string): Promise<ApiReservation> {
    return api.post<ApiReservation>('/reservation', { bookId, userId });
  },

  /**
   * DELETE /reservation/{id} — admin-only soft cancel.
   * reservationId comes from the list, never typed by user.
   */
  async cancel(reservationId: string): Promise<void> {
    return api.delete(`/reservation/${reservationId}`);
  },

  /**
   * PUT /reservation/{id} — mark as fulfilled (admin).
   * Backend controller checks for the literal string "fulfilled".
   */
  async fulfil(reservationId: string): Promise<void> {
    return api.put(`/reservation/${reservationId}`, { status: 'fulfilled' });
  },
};
