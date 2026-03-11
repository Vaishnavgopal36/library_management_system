import React, { useState, useEffect, useCallback } from 'react';
import { truncateTitle } from '../../utils/textUtils';
import { fmtDate } from '../../utils/dates';
import { FINE_RATE_PER_DAY } from '../../utils/constants';
import { AppRole, TxStatus } from '../../utils/types';
import { txBadgeVariant } from '../../utils/badges';
import { useModal } from '../../hooks/useModal';
import { useAuth } from '../../context/AuthContext';
import { transactionService, type ApiTransaction } from '../../services/transaction.service';
import styles from './HistoryPage.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button/Button';
import { Modal } from '../../components/molecules/Modal/Modal';
import { DynamicBookCover } from '../../components/atoms/DynamicBookCover/DynamicBookCover';
import { Table, Column } from '../../components/molecules/Table/Table';
import { Pagination } from '../../components/molecules/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';

// Note: 'Reserved' belongs to ReservationResponse (/api/v1/reservation), not TransactionResponse
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
type TabFilter = 'All' | TxStatus;

// ── Skeleton row placeholder for table loading state ─────────────────────────────────
const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className={styles.skeletonWrapper}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={styles.skeletonRow}>
        <div className={styles.skeletonBookCell}>
          <Skeleton variant="rectangular" width="44px" height="60px" style={{ borderRadius: '6px', flexShrink: 0 }} />
          <div className={styles.skeletonText}>
            <Skeleton variant="text" width="140px" height="14px" />
            <Skeleton variant="text" width="90px" height="12px" style={{ marginTop: '0.3rem' }} />
          </div>
        </div>
        <div className={styles.skeletonCell}><Skeleton variant="text" width="90px" height="13px" /></div>
        <div className={styles.skeletonCell}><Skeleton variant="text" width="80px" height="13px" /></div>
        <div className={styles.skeletonCell}><Skeleton variant="text" width="80px" height="13px" /></div>
        <div className={styles.skeletonCell}><Skeleton variant="rectangular" width="66px" height="26px" style={{ borderRadius: '50px' }} /></div>
        <div className={styles.skeletonCell}><Skeleton variant="rectangular" width="60px" height="30px" style={{ borderRadius: '8px' }} /></div>
      </div>
    ))}
  </div>
);
// ── Component ─────────────────────────────────────────────────────────────────
export interface HistoryPageProps {
  role?: AppRole;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ role = 'member' }) => {
  const isAdmin = role === 'admin';
  const { user } = useAuth();

  // ── Remote data ─────────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setIsLoading(true);
    transactionService.list()
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const baseData = transactions;

  // ── Search filter ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Tab filter ──
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const searchFiltered = searchQuery.trim()
    ? baseData.filter(t =>
        t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.bookName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : baseData;
  const filtered = activeTab === 'All' ? searchFiltered : searchFiltered.filter(t => t.status === activeTab);

  // ── Pagination ──
  const pagination = usePagination(filtered, { pageSize: 5 });

  // ── Return modal (admin only) ──
  const returnModal = useModal<ApiTransaction>();
  const handleReturnConfirm = () => {
    returnModal.setProcessing(true);
    transactionService.returnBook(returnModal.data!.id)
      .then(() => { returnModal.close(); loadData(); })
      .catch((err: any) => { returnModal.setProcessing(false); alert(err?.message ?? 'Failed to return.'); });
  };

  const fineAmount = returnModal.data?.totalAccruedFine ?? 0;
  const fineOverdueDays = returnModal.data?.dueDate
    ? Math.max(0, Math.floor((Date.now() - new Date(returnModal.data.dueDate).getTime()) / 86400000))
    : 0;

  // ── Stat counts for summary chips ──
  const counts = {
    issued:   baseData.filter(t => t.status === 'issued').length,
    returned: baseData.filter(t => t.status === 'returned').length,
    overdue:  baseData.filter(t => t.status === 'overdue').length,
  };

  // ── Table columns ──
  const bookCol: Column<ApiTransaction> = {
    header: 'Book',
    accessor: 'bookName',
    render: (row) => (
      <div className={styles.bookCell}>
        <DynamicBookCover title={row.bookName} author="" width="48px" height="64px" showText={false} />
        <div className={styles.bookCellText}>
          <p className={styles.bookCellTitle} title={row.bookName}>{truncateTitle(row.bookName)}</p>
        </div>
      </div>
    ),
  };
  const memberCol: Column<ApiTransaction>   = { header: 'Member',   accessor: 'userName' };
  const issuedCol: Column<ApiTransaction>   = {
    header: 'Issued',
    accessor: 'checkoutDate',
    render: (row) => <span>{fmtDate(row.checkoutDate)}</span>,
  };
  const dueCol: Column<ApiTransaction>      = {
    header: 'Due Date',
    accessor: 'dueDate',
    render: (row) => <span>{fmtDate(row.dueDate)}</span>,
  };
  const returnedCol: Column<ApiTransaction> = {
    header: 'Returned',
    accessor: 'returnedDate',
    render: (row) => (
      <span className={row.returnDate ? 'text-text-primary' : 'text-text-muted'}>
        {row.returnDate ? fmtDate(row.returnDate) : '—'}
      </span>
    ),
  };
  const statusCol: Column<ApiTransaction> = {
    header: 'Status',
    accessor: 'status',
    render: (row) => <Badge variant={txBadgeVariant(row.status)}>{cap(row.status)}</Badge>,
  };
  const actionCol: Column<ApiTransaction> = {
    header: 'Action',
    accessor: 'id',
    render: (row) =>
      row.status === 'issued' || row.status === 'overdue' ? (
        <Button size="sm" variant="secondary" onClick={() => returnModal.open(row)}>
          Return
        </Button>
      ) : (
        <span className="text-text-muted text-[0.8125rem]">—</span>
      ),
  };

  // Admin: Book | Member | Issued | Due | Returned | Status | Action
  // Member: Book | Issued | Due | Returned | Status | Fine
  const fineCol: Column<ApiTransaction> = {
    header: 'Fine',
    accessor: 'dueDate',
    render: (row) => {
      if (row.status !== 'overdue') return <span className="text-text-muted">—</span>;
      const charged = row.totalAccruedFine ?? 0;
      return charged > 0
        ? <span className="text-danger-600 font-bold">₹{charged}</span>
        : <span className="text-text-muted text-[0.8125rem]">Pending</span>;
    },
  };

  const columns: Column<ApiTransaction>[] = isAdmin
    ? [bookCol, memberCol, issuedCol, dueCol, returnedCol, statusCol, actionCol]
    : [bookCol, issuedCol, dueCol, returnedCol, statusCol, fineCol];

  return (
    <AppShell
      userName={user?.fullName ?? (isAdmin ? 'Admin' : 'Member')}
      activeNavItem={isAdmin ? 'Transaction Ledger' : 'My History'}
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
            <h2 className={styles.pageTitle}>
              {isAdmin ? 'Transaction Ledger' : 'My Borrowing History'}
            </h2>
            <p className={styles.pageSubtitle}>
              {isAdmin
                ? 'Full circulation history across all members'
                : 'All your borrowed, returned, overdue and reserved books'}
            </p>
          </div>
        </div>

        {/* ── Stat chips ♡ Tab filters (click to filter rows) ── */}
        <div className={styles.summaryRow}>
          <button
            className={`${styles.statChip} ${activeTab === 'All' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('All')}
          >
            All <span className={styles.chipCount}>{baseData.length}</span>
          </button>
          <button
            className={`${styles.statChip} ${activeTab === 'issued' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('issued')}
          >
            <span className={`${styles.statDot} ${styles.dotIssued}`} />
            {counts.issued} Active
          </button>
          <button
            className={`${styles.statChip} ${activeTab === 'overdue' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            <span className={`${styles.statDot} ${styles.dotOverdue}`} />
            {counts.overdue} Overdue
          </button>
          <button
            className={`${styles.statChip} ${activeTab === 'returned' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('returned')}
          >
            <span className={`${styles.statDot} ${styles.dotReturned}`} />
            {counts.returned} Returned
          </button>
          {/* Reserved status belongs to /api/v1/reservation — see ReservationsPage */}
        </div>

        {/* ── Table / Skeleton ── */}
        <div className={styles.tableCard}>
          {isLoading ? (
            <SkeletonRows rows={5} />
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No {activeTab === 'All' ? '' : activeTab.toLowerCase()} records found.</p>
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

      {/* ── Return Modal (admin only) ─────────────────────────────────── */}
      <Modal isOpen={returnModal.isOpen} onClose={returnModal.close} title="Confirm Book Return">
        {returnModal.data && (
          <div className={styles.returnModalBody}>

            {/* Book preview */}
            <div className={styles.modalBookPreview}>
              <DynamicBookCover title={returnModal.data.bookName} author="" width="72px" height="100px" showText={false} />
              <div className={styles.modalBookMeta}>
                <p className={styles.modalBookTitle}>{returnModal.data.bookName}</p>
                <p className={styles.modalBookAuthor}>{returnModal.data.userName}</p>
                <Badge variant={txBadgeVariant(returnModal.data.status)} style={{ marginTop: '0.5rem' }}>
                  {cap(returnModal.data.status)}
                </Badge>
              </div>
            </div>

            <div className={styles.modalDivider} />

            {/* Transaction details */}
            <div className={styles.infoBlock}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Member</span>
                <span className={styles.infoValue}>{returnModal.data.userName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Issued On</span>
                <span className={styles.infoValue}>{fmtDate(returnModal.data.checkoutDate)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Due Date</span>
                <span className={styles.infoValue}>{fmtDate(returnModal.data.dueDate)}</span>
              </div>
            </div>

            {/* Fine box — only shown if overdue */}
            {returnModal.data.status === 'overdue' && fineAmount > 0 && (
              <div className={styles.fineBox}>
                <span className={styles.fineBoxTitle}>⚠ Overdue Fine Applicable</span>
                <span className={styles.fineAmount}>₹{fineAmount}</span>
                <span className={styles.fineRate}>
                  ₹{FINE_RATE_PER_DAY}/day × {fineOverdueDays} days
                </span>
              </div>
            )}

            <p className={styles.modalHint}>
              {returnModal.data.status === 'overdue'
                ? "Confirm the return and record the fine against this member's account."
                : 'Confirm that the book has been physically received and is in good condition.'}
            </p>

            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={returnModal.close} disabled={returnModal.isProcessing}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleReturnConfirm}
                disabled={returnModal.isProcessing}
              >
                {returnModal.isProcessing
                  ? 'Processing...'
                  : returnModal.data.status === 'overdue'
                    ? 'Return & Record Fine'
                    : 'Confirm Return'}
              </Button>
            </div>

          </div>
        )}
      </Modal>

    </AppShell>
  );
};
