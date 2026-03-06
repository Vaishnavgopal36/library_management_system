import React, { useState } from 'react';
import { fmtDate } from '../../utils/dates';
import { AppRole, ResStatus, Reservation, ReservationUser, ReservationBook } from '../../utils/types';
import { resBadgeVariant } from '../../utils/badges';
import { useMockDelay } from '../../hooks/useMockDelay';
import styles from './ReservationsPage.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Table, Column } from '../../components/molecules/Table/Table';
import { Pagination } from '../../components/molecules/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';
import { DynamicBookCover } from '../../components/atoms/DynamicBookCover/DynamicBookCover';

// ── Types ─────────────────────────────────────────────────────────────────────
// ── Mock Data ─────────────────────────────────────────────────────────────────
// Current logged-in user (member = "Reinhard Kenson", admin = "System Admin")
const CURRENT_MEMBER = 'Reinhard Kenson';

const mockUser = (id: string, fullName: string): ReservationUser => ({
  id, email: `${fullName.toLowerCase().replace(' ', '.')}@bookstop.com`,
  fullName, role: 'member', isActive: true,
});
const mockBook = (id: string, title: string, authorName: string, isbn: string): ReservationBook => ({
  id, title, isbn,
  stockQuantity: 4, trueAvailableStock: 1, isArchived: false,
  authors:    [{ id: `auth-${id}`, name: authorName }],
  categories: [{ id: 'cat-001',    name: 'General'   }],
});

// Each reservation is valid for exactly 1 day; status auto-resolved by stock scheduler
const allReservations: Reservation[] = [
  {
    id: 'r1',
    user: mockUser('usr-001', 'Reinhard Kenson'),
    book: { ...mockBook('bk-001', "Don't Make Me Think", 'Steve Krug', '9780321965516'), trueAvailableStock: 0 },
    reservedAt: '2026-03-05T08:00:00Z', expiresAt: '2026-03-06T08:00:00Z',
    status: 'Expired',
  },
  {
    id: 'r2',
    user: mockUser('usr-002', 'Alice Smith'),
    book: { ...mockBook('bk-002', 'Clean Code', 'Robert C. Martin', '9780132350884'), trueAvailableStock: 2 },
    reservedAt: '2026-03-06T09:00:00Z', expiresAt: '2026-03-07T09:00:00Z',
    status: 'Ready',
  },
  {
    id: 'r3',
    user: mockUser('usr-003', 'Bob Johnson'),
    book: { ...mockBook('bk-003', 'The Pragmatic Programmer', 'Hunt & Thomas', '9780135957059'), trueAvailableStock: 0 },
    reservedAt: '2026-03-04T10:00:00Z', expiresAt: '2026-03-05T10:00:00Z',
    status: 'Expired',
  },
  {
    id: 'r4',
    user: mockUser('usr-001', 'Reinhard Kenson'),
    book: { ...mockBook('bk-004', 'Rich Dad Poor Dad', 'Robert Kiyosaki', '9781612680194'), trueAvailableStock: 1 },
    reservedAt: '2026-03-06T11:00:00Z', expiresAt: '2026-03-07T11:00:00Z',
    status: 'Ready',
  },
  {
    id: 'r5',
    user: mockUser('usr-002', 'Alice Smith'),
    book: { ...mockBook('bk-005', 'Sprint', 'Jake Knapp', '9781501121746'), trueAvailableStock: 0 },
    reservedAt: '2026-03-05T12:00:00Z', expiresAt: '2026-03-06T12:00:00Z',
    status: 'Expired',
  },
  {
    id: 'r6',
    user: mockUser('usr-003', 'Bob Johnson'),
    book: { ...mockBook('bk-006', 'Lean UX', 'Jeff Gothelf', '9781492073840'), trueAvailableStock: 3 },
    reservedAt: '2026-03-06T13:00:00Z', expiresAt: '2026-03-07T13:00:00Z',
    status: 'Ready',
  },
];

// ── Skeleton Row ─────────────────────────────────────────────────────────────
const SkeletonTableRows: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className={styles.skeletonWrapper}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={styles.skeletonRow}>
        <div className={styles.skeletonCell} style={{ flex: 3 }}>
          <Skeleton variant="rectangular" width="48px" height="64px" />
          <div className={styles.skeletonText}>
            <Skeleton variant="text" width="140px" height="14px" />
            <Skeleton variant="text" width="90px" height="12px" style={{ marginTop: '0.25rem' }} />
          </div>
        </div>
        <div className={styles.skeletonCell} style={{ flex: 2 }}>
          <Skeleton variant="text" width="100px" height="14px" />
        </div>
        <div className={styles.skeletonCell} style={{ flex: 2 }}>
          <Skeleton variant="text" width="80px" height="14px" />
        </div>
        <div className={styles.skeletonCell} style={{ flex: 1.5 }}>
          <Skeleton variant="rectangular" width="68px" height="28px" style={{ borderRadius: '50px' }} />
        </div>
      </div>
    ))}
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
export interface ReservationsPageProps {
  role?: AppRole;
}

// Admin view toggle type
type AdminView = 'all' | 'mine';
type ResTabFilter = 'All' | ResStatus;

export const ReservationsPage: React.FC<ReservationsPageProps> = ({ role = 'member' }) => {
  const isAdmin = role === 'admin';

  // ── Simulate loading (TODO: GET /api/v1/reservation) ──
  // params: reservationId, userId, bookId, status, reservedAfter/Before, expiresAfter/Before, includeExpired
  const isLoading = useMockDelay();

  // ── Admin toggle: All Members | Mine ──
  const [adminView, setAdminView] = useState<AdminView>('all');

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Status tab filter ──
  const [activeTab, setActiveTab] = useState<ResTabFilter>('All');

  // ── Derive display data ──
  const liveBase: Reservation[] = isAdmin
    ? adminView === 'all'
      ? allReservations
      : allReservations.filter(r => r.user.fullName === CURRENT_MEMBER)
    : allReservations.filter(r => r.user.fullName === CURRENT_MEMBER);

  // ── Summary counts ──
  const counts = {
    Ready:   liveBase.filter(r => r.status === 'Ready').length,
    Expired: liveBase.filter(r => r.status === 'Expired').length,
  };

  const tabFiltered = activeTab === 'All' ? liveBase : liveBase.filter(r => r.status === activeTab);
  const liveDisplay = searchQuery.trim()
    ? tabFiltered.filter(r =>
        r.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.book.authors.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tabFiltered;

  // ── Pagination ──
  const pagination = usePagination(liveDisplay, { pageSize: 5 });

  // ── Table columns ──
  const bookCol: Column<Reservation> = {
    header: 'Book',
    accessor: 'book',
    render: (row) => (
      <div className={styles.bookCell}>
        <DynamicBookCover title={row.book.title} author="" width="48px" height="64px" showText={false} />
        <div className={styles.bookCellText}>
          <p className={styles.bookCellTitle}>{row.book.title}</p>
          <p className={styles.bookCellAuthor}>{row.book.authors[0]?.name ?? '—'}</p>
        </div>
      </div>
    ),
  };

  const memberCol: Column<Reservation> = {
    header: 'Member',
    accessor: 'user',
    render: (row) => <span>{row.user.fullName}</span>,
  };

  const reservedCol: Column<Reservation> = {
    header: 'Reserved',
    accessor: 'reservedAt',
    render: (row) => <span>{fmtDate(row.reservedAt)}</span>,
  };

  const expiryCol: Column<Reservation> = {
    header: 'Expires',
    accessor: 'expiresAt',
    render: (row) => (
      <span className={row.status === 'Expired' ? 'text-danger-600' : 'text-text-label'}>
        {fmtDate(row.expiresAt)}
      </span>
    ),
  };

  const statusCol: Column<Reservation> = {
    header: 'Status',
    accessor: 'status',
    render: (row) => <Badge variant={resBadgeVariant(row.status)}>{row.status}</Badge>,
  };

  const adminColumns: Column<Reservation>[] = [bookCol, memberCol, reservedCol, expiryCol, statusCol];
  const memberColumns: Column<Reservation>[] = [bookCol, reservedCol, expiryCol, statusCol];
  const columns = isAdmin ? adminColumns : memberColumns;

  return (
    <AppShell
      userName={isAdmin ? 'System Admin' : 'Rick'}
      activeNavItem="Reservations"
      role={role}
      searchConfig={{
        placeholder: isAdmin ? 'Search by member name or book title…' : 'Search by book title…',
        query: searchQuery,
        onQueryChange: setSearchQuery,
      }}
    >
      <div className={styles.pageContainer}>

        {/* ── Header ── */}
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.pageTitle}>Reservations</h2>
            <p className={styles.pageSubtitle}>
              {isAdmin
                ? 'Manage all book reservations and hold requests'
                : 'Track your book hold requests and pickups'}
            </p>
          </div>

          {/* Admin toggle: All Members | Mine */}
          {isAdmin && (
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleBtn} ${adminView === 'all' ? styles.toggleBtnActive : ''}`}
                onClick={() => setAdminView('all')}
              >
                All Members
              </button>
              <button
                className={`${styles.toggleBtn} ${adminView === 'mine' ? styles.toggleBtnActive : ''}`}
                onClick={() => setAdminView('mine')}
              >
                Mine
              </button>
            </div>
          )}
        </div>

        {/* ── Status tab chips (click to filter) ── */}
        <div className={styles.summaryRow}>
          <button
            className={`${styles.statChip} ${activeTab === 'All' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('All')}
          >
            All <span className={styles.chipCount}>{liveBase.length}</span>
          </button>
          <button
            className={`${styles.statChip} ${activeTab === 'Ready' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('Ready')}
          >
            <span className={`${styles.statDot} ${styles.dotReady}`} />
            {counts.Ready} Ready
          </button>
          <button
            className={`${styles.statChip} ${styles.statChipDanger} ${activeTab === 'Expired' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('Expired')}
          >
            {counts.Expired} Expired
          </button>
        </div>

        {/* ── Table / Skeleton ── */}
        <div className={styles.tableCard}>
          {isLoading ? (
            // Skeleton shown during simulated API fetch
            <SkeletonTableRows rows={4} />
          ) : liveDisplay.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No reservations found{searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
            </div>
          ) : (
            <>
              <Table columns={columns} data={pagination.pageData} />
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                onPageChange={pagination.setPage}
              />
            </>
          )}
        </div>

      </div>

    </AppShell>
  );
};
