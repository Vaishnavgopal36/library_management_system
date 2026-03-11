import React, { useState, useEffect, useCallback } from 'react';
import { fmtDate } from '../../utils/dates';
import { AppRole, ResStatus } from '../../utils/types';
import { resBadgeVariant } from '../../utils/badges';
import { useAuth } from '../../context/AuthContext';
import { truncateTitle } from '../../utils/textUtils';
import { reservationService, type ApiReservation } from '../../services/reservation.service';
import styles from './ReservationsPage.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Table, Column } from '../../components/molecules/Table/Table';
import { Pagination } from '../../components/molecules/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';
import { DynamicBookCover } from '../../components/atoms/DynamicBookCover/DynamicBookCover';
import { Toast } from '../../components/atoms/Toast/Toast';

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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const ReservationsPage: React.FC<ReservationsPageProps> = ({ role = 'member' }) => {
  const isAdmin = role === 'admin';
  const { user } = useAuth();

  // ── Real API loading ──
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadData = useCallback(() => {
    setIsLoading(true);
    reservationService.list().then(setReservations).catch(console.error).finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  // ── Fulfill / Issue Book ──
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const handleFulfil = useCallback(async (reservationId: string, bookTitle: string) => {
    setFulfillingId(reservationId);
    try {
      await reservationService.fulfil(reservationId);
      setToast({ message: `"${bookTitle}" has been issued successfully.`, variant: 'success' });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to issue book. Please try again.';
      setToast({ message: msg, variant: 'error' });
    } finally {
      setFulfillingId(null);
    }
  }, [loadData]);

  // ── Admin toggle: All Members | Mine ──
  const [adminView, setAdminView] = useState<AdminView>('all');

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Status tab filter ──
  const [activeTab, setActiveTab] = useState<ResTabFilter>('All');

  // ── Derive display data ──
  const liveBase: ApiReservation[] = isAdmin
    ? adminView === 'all'
      ? reservations
      : reservations.filter(r => r.user.id === user?.id)
    : reservations;

  // ── Summary counts ──
  const counts = {
    active:  liveBase.filter(r => r.status === 'active').length,
    expired: liveBase.filter(r => r.status === 'expired').length,
  };

  const tabFiltered = activeTab === 'All' ? liveBase : liveBase.filter(r => r.status === activeTab);
  const liveDisplay = searchQuery.trim()
    ? tabFiltered.filter(r =>
        r.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.book.authors ?? []).some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tabFiltered;

  // ── Pagination ──
  const pagination = usePagination(liveDisplay, { pageSize: 5 });

  // ── Table columns ──
  const bookCol: Column<ApiReservation> = {
    header: 'Book',
    accessor: 'book',
    render: (row) => (
      <div className={styles.bookCell}>
        <DynamicBookCover title={row.book.title} author="" width="48px" height="64px" showText={false} />
        <div className={styles.bookCellText}>
          <p className={styles.bookCellTitle} title={row.book.title}>{truncateTitle(row.book.title)}</p>
          <p className={styles.bookCellAuthor}>{row.book.authors[0]?.name ?? '—'}</p>
        </div>
      </div>
    ),
  };

  const memberCol: Column<ApiReservation> = {
    header: 'Member',
    accessor: 'user',
    render: (row) => <span>{row.user.fullName}</span>,
  };

  const reservedCol: Column<ApiReservation> = {
    header: 'Reserved',
    accessor: 'reservedAt',
    render: (row) => <span>{fmtDate(row.reservedAt)}</span>,
  };

  const expiryCol: Column<ApiReservation> = {
    header: 'Expires',
    accessor: 'expiresAt',
    render: (row) => (
      <span className={row.status === 'expired' ? 'text-danger-600' : 'text-text-label'}>
        {fmtDate(row.expiresAt)}
      </span>
    ),
  };

  const statusCol: Column<ApiReservation> = {
    header: 'Status',
    accessor: 'status',
    render: (row) => <Badge variant={resBadgeVariant(row.status)}>{cap(row.status)}</Badge>,
  };

  const actionsCol: Column<ApiReservation> = {
    header: 'Actions',
    accessor: 'id',
    render: (row) => {
      if (row.status !== 'active') return null;
      const isBusy = fulfillingId === row.id;
      return (
        <button
          className={styles.issueBtn}
          disabled={isBusy}
          onClick={() => handleFulfil(row.id, row.book.title)}
        >
          {isBusy ? 'Issuing…' : 'Issue Book'}
        </button>
      );
    },
  };

  const adminColumns: Column<ApiReservation>[] = [bookCol, memberCol, reservedCol, expiryCol, statusCol, actionsCol];
  const memberColumns: Column<ApiReservation>[] = [bookCol, reservedCol, expiryCol, statusCol];
  const columns = isAdmin ? adminColumns : memberColumns;

  return (
    <AppShell
      userName={user?.fullName ?? (isAdmin ? 'Admin' : 'Member')}
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
            className={`${styles.statChip} ${activeTab === 'active' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <span className={`${styles.statDot} ${styles.dotReady}`} />
            {counts.active} Active
          </button>
          <button
            className={`${styles.statChip} ${styles.statChipDanger} ${activeTab === 'expired' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            {counts.expired} Expired
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

      {/* ── Toast notification ── */}
      {toast && (
        <div className={styles.toastContainer}>
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
            duration={4000}
          />
        </div>
      )}
    </AppShell>
  );
};
