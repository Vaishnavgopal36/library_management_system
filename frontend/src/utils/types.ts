/** User role shared across all page props and API responses. */
export type AppRole = 'admin' | 'member';

// ── Book sub-types (matching BookResponse from Swagger) ───────────────────────
export interface BookAuthor {
  id: string;
  name: string;
}

export interface BookCategory {
  id: string;
  name: string;
}

export interface BookPublisher {
  id: string;
  name: string;
}

/** Matches API BookResponse */
export interface Book {
  id: string;
  title: string;
  isbn: string;
  stockQuantity: number;
  trueAvailableStock: number;
  isArchived: boolean;
  publisher?: BookPublisher;
  authors: BookAuthor[];
  categories: BookCategory[];
}

/** Matches API BookRequest (used in create / update forms) */
export interface BookFormData {
  title: string;
  isbn: string;
  stockQuantity: string;
  publishDate: string;
  publisherName: string;
}

// ── Transaction types ─────────────────────────────────────────────────────────
export type TxStatus = 'issued' | 'returned' | 'overdue' | 'lost';

/** Matches API TransactionResponse */
export interface Transaction {
  id: string;
  bookId: string;
  userId: string;
  bookName: string;
  userName: string;
  checkoutDate: string;
  dueDate: string;
  status: TxStatus;
  /** UI-only computed field */
  daysOverdue: number;
  returnedDate?: string;
}

// ── Fine types ────────────────────────────────────────────────────────────────
/** Use `fine.isPaid` (boolean from API) instead of a string status. */
export type FineStatus = 'unpaid' | 'paid';

/** Matches API FineResponse */
export interface Fine {
  id: string;
  transactionId: string;
  bookId: string;
  userId: string;
  bookName: string;
  userName: string;
  amount: number;
  isPaid: boolean;
  /** UI-only computed field */
  daysOverdue: number;
}

// ── Reservation types ─────────────────────────────────────────────────────────
// Status values as returned by the backend scheduler (DB CHECK constraint)
export type ResStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export interface ReservationUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

export interface ReservationBook {
  id: string;
  title: string;
  isbn: string;
  stockQuantity: number;
  trueAvailableStock: number;
  isArchived: boolean;
  publisher?: BookPublisher;
  authors: BookAuthor[];
  categories: BookCategory[];
}

/** Matches API ReservationResponse */
export interface Reservation {
  id: string;
  user: ReservationUser;
  book: ReservationBook;
  reservedAt: string;
  /** One day after reservedAt — auto-expired by scheduler */
  expiresAt: string;
  /** Auto-managed by backend scheduler */
  status: ResStatus;
}

// ── Member types (Member Directory) ──────────────────────────────────────────
export type MemberStatus = 'Active' | 'Blacklisted';

export interface MemberBadge {
  label: string;
  color: string;
  bg: string;
  border: string;
}

/** Matches API UserResponse + UI-only aggregate helpers */
export interface Member {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'member';
  isActive: boolean;
  /** UI-only: derived from GET /api/v1/transaction?userId&status=Issued */
  booksActive: number;
  /** UI-only: derived from GET /api/v1/fine?userId&isPaid=false */
  finesOwed: number;
  badges: MemberBadge[];
}

// ── Notification types ────────────────────────────────────────────────────────
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
