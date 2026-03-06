import React, { useState } from 'react';
import { fmtDate } from '../../utils/dates';
import { AppRole, ResStatus, Reservation, ReservationUser, ReservationBook } from '../../utils/types';
import { resBadgeVariant } from '../../utils/badges';
import { useModal } from '../../hooks/useModal';
import { useMockDelay } from '../../hooks/useMockDelay';
import styles from './ReservationsPage.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button/Button';
import { Modal } from '../../components/molecules/Modal/Modal';
import { Table, Column } from '../../components/molecules/Table/Table';
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

const allReservations: Reservation[] = [
  {
    id: 'r1',
    user: mockUser('usr-001', 'Reinhard Kenson'),
    book: mockBook('bk-001', "Don't Make Me Think", 'Steve Krug', '9780321965516'),
    reservedAt: '2026-02-28T08:00:00Z', expiresAt: '2026-03-21T08:00:00Z',
    status: 'Pending',
  },
  {
    id: 'r2',
    user: mockUser('usr-002', 'Alice Smith'),
    book: mockBook('bk-002', 'Clean Code', 'Robert C. Martin', '9780132350884'),
    reservedAt: '2026-03-01T09:00:00Z', expiresAt: '2026-03-20T09:00:00Z',
    readyDate: '2026-03-05T09:00:00Z', status: 'Ready',
  },
  {
    id: 'r3',
    user: mockUser('usr-003', 'Bob Johnson'),
    book: mockBook('bk-003', 'The Pragmatic Programmer', 'Hunt & Thomas', '9780135957059'),
    reservedAt: '2026-02-15T10:00:00Z', expiresAt: '2026-02-22T10:00:00Z',
    status: 'Expired',
  },
  {
    id: 'r4',
    user: mockUser('usr-001', 'Reinhard Kenson'),
    book: mockBook('bk-004', 'Rich Dad Poor Dad', 'Robert Kiyosaki', '9781612680194'),
    reservedAt: '2026-03-02T11:00:00Z', expiresAt: '2026-03-18T11:00:00Z',
    readyDate: '2026-03-05T11:00:00Z', status: 'Ready',
  },
  {
    id: 'r5',
    user: mockUser('usr-002', 'Alice Smith'),
    book: mockBook('bk-005', 'Sprint', 'Jake Knapp', '9781501121746'),
    reservedAt: '2026-03-03T12:00:00Z', expiresAt: '2026-03-17T12:00:00Z',
    status: 'Pending',
  },
  {
    id: 'r6',
    user: mockUser('usr-003', 'Bob Johnson'),
    book: mockBook('bk-006', 'Lean UX', 'Jeff Gothelf', '9781492073840'),
    reservedAt: '2026-03-01T13:00:00Z', expiresAt: '2026-03-15T13:00:00Z',
    status: 'Cancelled',
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
        <div className={styles.skeletonCell} style={{ flex: 2 }}>
          <Skeleton variant="text" width="70px" height="14px" />
        </div>
        <div className={styles.skeletonCell} style={{ flex: 1.5 }}>
          <Skeleton variant="rectangular" width="68px" height="28px" style={{ borderRadius: '50px' }} />
        </div>
        <div className={styles.skeletonCell} style={{ flex: 1.5 }}>
          <Skeleton variant="rectangular" width="72px" height="32px" style={{ borderRadius: '8px' }} />
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

  // ── Live reservations state (updated on actions) ──
  const [reservations, setReservations] = useState(allReservations);

  // ── Cancel modal ──
  const cancelModal = useModal<Reservation>();
  const handleCancelConfirm = () => {
    cancelModal.setProcessing(true);
    // TODO: DELETE /api/v1/reservation/{id}
    console.log('Cancelling reservation:', cancelModal.data?.id);
    setTimeout(() => {
      setReservations(prev =>
        prev.map(r => r.id === cancelModal.data?.id ? { ...r, status: 'Cancelled' as ResStatus } : r)
      );
      cancelModal.close();
    }, 1000);
  };

  // ── Mark Ready modal (admin only) ──
  const readyModal = useModal<Reservation>();
  const handleMarkReady = () => {
    readyModal.setProcessing(true);
    // TODO: PUT /api/v1/reservation/{id} — body: Map<String,String> to resolve/mark hold as ready
    console.log('Marking reservation ready:', readyModal.data?.id);
    setTimeout(() => {
      setReservations(prev =>
        prev.map(r =>
          r.id === readyModal.data?.id
            ? { ...r, status: 'Ready' as ResStatus, readyDate: '05 Mar 2026' }
            : r
        )
      );
      readyModal.close();
    }, 1000);
  };

  // ── Derive display data ──
  const liveBase: Reservation[] = isAdmin
    ? adminView === 'all'
      ? reservations
      : reservations.filter(r => r.user.fullName === CURRENT_MEMBER)
    : reservations.filter(r => r.user.fullName === CURRENT_MEMBER);

  // ── Summary counts (from live state) ──
  const counts: Record<ResStatus, number> = {
    Pending:   liveBase.filter(r => r.status === 'Pending').length,
    Ready:     liveBase.filter(r => r.status === 'Ready').length,
    Cancelled: liveBase.filter(r => r.status === 'Cancelled').length,
    Expired:   liveBase.filter(r => r.status === 'Expired').length,
  };

  const tabFiltered = activeTab === 'All' ? liveBase : liveBase.filter(r => r.status === activeTab);
  const liveDisplay = searchQuery.trim()
    ? tabFiltered.filter(r =>
        r.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.book.authors.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tabFiltered;

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
      <span style={{ color: row.status === 'Expired' ? '#dc2626' : '#374151' }}>
        {fmtDate(row.expiresAt)}
      </span>
    ),
  };

  // readyDate is a UI-only helper field; not returned by ReservationResponse
  const readyCol: Column<Reservation> = {
    header: 'Ready Date',
    accessor: 'readyDate',
    render: (row) => (
      <span style={{ color: row.readyDate ? '#059669' : '#9ca3af' }}>
        {row.readyDate ? fmtDate(row.readyDate) : '—'}
      </span>
    ),
  };

  const statusCol: Column<Reservation> = {
    header: 'Status',
    accessor: 'status',
    render: (row) => <Badge variant={resBadgeVariant(row.status)}>{row.status}</Badge>,
  };

  const adminActionCol: Column<Reservation> = {
    header: 'Actions',
    accessor: 'id',
    render: (row) => {
      if (row.status === 'Pending') {
        return (
          <div className={styles.actionGroup}>
            <Button size="sm" variant="primary" onClick={() => readyModal.open(row)}>Mark Ready</Button>
            <Button size="sm" variant="ghost" onClick={() => cancelModal.open(row)}>Cancel</Button>
          </div>
        );
      }
      if (row.status === 'Ready') {
        return <span style={{ color: '#059669', fontSize: '0.8125rem', fontWeight: 600 }}>Awaiting Pickup</span>;
      }
      return <span style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>—</span>;
    },
  };

  const memberActionCol: Column<Reservation> = {
    header: 'Action',
    accessor: 'id',
    render: (row) =>
      row.status === 'Pending' ? (
        <Button size="sm" variant="ghost" onClick={() => cancelModal.open(row)}>Cancel</Button>
      ) : row.status === 'Ready' ? (
        <span style={{ color: '#059669', fontSize: '0.8125rem', fontWeight: 600 }}>Ready for Pickup</span>
      ) : (
        <span style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>—</span>
      ),
  };

  const adminColumns: Column<Reservation>[] = [bookCol, memberCol, reservedCol, readyCol, expiryCol, statusCol, adminActionCol];
  const memberColumns: Column<Reservation>[] = [bookCol, reservedCol, readyCol, expiryCol, statusCol, memberActionCol];
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
            className={`${styles.statChip} ${activeTab === 'Pending' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('Pending')}
          >
            <span className={`${styles.statDot} ${styles.dotPending}`} />
            {counts.Pending} Pending
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
          <button
            className={`${styles.statChip} ${styles.statChipNeutral} ${activeTab === 'Cancelled' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('Cancelled')}
          >
            {counts.Cancelled} Cancelled
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
            <Table columns={columns} data={liveDisplay} />
          )}
        </div>

      </div>

      {/* ── Cancel Reservation Modal ──────────────────────────────────── */}
      <Modal isOpen={cancelModal.isOpen} onClose={cancelModal.close} title="Cancel Reservation">
        {cancelModal.data && (
          <div className={styles.modalForm}>
            <div className={styles.modalBookPreview}>
              <DynamicBookCover title={cancelModal.data.book.title} author="" width="64px" height="88px" showText={false} />
              <div className={styles.modalBookMeta}>
                <p className={styles.modalBookTitle}>{cancelModal.data.book.title}</p>
                <p className={styles.modalBookAuthor}>{cancelModal.data.book.authors[0]?.name ?? '—'}</p>
                {isAdmin && (
                  <p className={styles.modalMember}>For: <strong>{cancelModal.data.user.fullName}</strong></p>
                )}
              </div>
            </div>
            <div className={styles.modalDivider} />
            <p className={styles.modalHint}>
              {isAdmin
                ? "This will cancel the member's hold. They will be notified by email."
                : 'Cancelling will release your hold. The book will become available to others.'}
            </p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={cancelModal.close} disabled={cancelModal.isProcessing}>Keep</Button>
              <Button type="button" variant="danger" onClick={handleCancelConfirm} disabled={cancelModal.isProcessing}>
                {cancelModal.isProcessing ? 'Cancelling…' : 'Yes, Cancel'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Mark Ready Modal (admin only) ────────────────────────────── */}
      <Modal isOpen={readyModal.isOpen} onClose={readyModal.close} title="Mark Reservation as Ready">
        {readyModal.data && (
          <div className={styles.modalForm}>
            <div className={styles.modalBookPreview}>
              <DynamicBookCover title={readyModal.data.book.title} author="" width="64px" height="88px" showText={false} />
              <div className={styles.modalBookMeta}>
                <p className={styles.modalBookTitle}>{readyModal.data.book.title}</p>
                <p className={styles.modalBookAuthor}>{readyModal.data.book.authors[0]?.name ?? '—'}</p>
                <p className={styles.modalMember}>For: <strong>{readyModal.data.user.fullName}</strong></p>
              </div>
            </div>
            <div className={styles.modalDivider} />
            <p className={styles.modalHint}>
              Confirm that a copy has been set aside at the counter. The member will receive a pickup notification.
            </p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={readyModal.close} disabled={readyModal.isProcessing}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleMarkReady} disabled={readyModal.isProcessing}>
                {readyModal.isProcessing ? 'Updating…' : 'Mark as Ready'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </AppShell>
  );
};
