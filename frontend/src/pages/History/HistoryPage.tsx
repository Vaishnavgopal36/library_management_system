import React, { useState } from 'react';
import { fmtDate } from '../../utils/dates';
import { FINE_RATE_PER_DAY } from '../../utils/constants';
import { AppRole, TxStatus, Transaction } from '../../utils/types';
import { txBadgeVariant } from '../../utils/badges';
import { useModal } from '../../hooks/useModal';
import { useMockDelay } from '../../hooks/useMockDelay';
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

// ── Types ────────────────────────────────────────────────────────────────────
// Note: 'Reserved' belongs to ReservationResponse (/api/v1/reservation), not TransactionResponse
// TxStatus and Transaction are imported from utils/types
type TabFilter = 'All' | TxStatus;

// ── Mock Data ────────────────────────────────────────────────────────────────
// Admin sees all; member only sees their own (filtered by "Rick" / "Reinhard Kenson")
// Mock data matches TransactionResponse field names
// Note: 'Reserved' entries moved to ReservationsPage (separate /api/v1/reservation endpoint)
const allTransactions: Transaction[] = [
  {
    id: 'tx-0001', bookId: 'bk-0001', userId: 'usr-0001',
    bookName: 'Clean Code', userName: 'Reinhard Kenson',
    checkoutDate: '2026-02-20T09:00:00', dueDate: '2026-03-05T09:00:00',
    status: 'Overdue', daysOverdue: 3,
  },
  {
    id: 'tx-0002', bookId: 'bk-0002', userId: 'usr-0002',
    bookName: 'Design Patterns', userName: 'Alice Smith',
    checkoutDate: '2026-03-01T09:00:00', dueDate: '2026-03-15T09:00:00',
    status: 'Issued', daysOverdue: 0,
  },
  {
    id: 'tx-0003', bookId: 'bk-0005', userId: 'usr-0003',
    bookName: 'The Pragmatic Programmer', userName: 'Bob Johnson',
    checkoutDate: '2026-02-10T09:00:00', dueDate: '2026-02-25T09:00:00',
    returnedDate: '2026-02-24T16:00:00', status: 'Returned', daysOverdue: 0,
  },
  {
    id: 'tx-0004', bookId: 'bk-0006', userId: 'usr-0001',
    bookName: 'Rich Dad Poor Dad', userName: 'Reinhard Kenson',
    checkoutDate: '2026-01-15T09:00:00', dueDate: '2026-01-30T09:00:00',
    returnedDate: '2026-01-28T11:00:00', status: 'Returned', daysOverdue: 0,
  },
  {
    id: 'tx-0006', bookId: 'bk-0007', userId: 'usr-0001',
    bookName: 'Sprint', userName: 'Reinhard Kenson',
    checkoutDate: '2026-03-01T09:00:00', dueDate: '2026-03-03T09:00:00',
    status: 'Overdue', daysOverdue: 5,
  },
  {
    id: 'tx-0007', bookId: 'bk-0007b', userId: 'usr-0002',
    bookName: "You Don't Know JS", userName: 'Alice Smith',
    checkoutDate: '2026-02-20T09:00:00', dueDate: '2026-03-07T09:00:00',
    status: 'Overdue', daysOverdue: 1,
  },
  {
    id: 'tx-0008', bookId: 'bk-0008', userId: 'usr-0003',
    bookName: 'Lean UX', userName: 'Bob Johnson',
    checkoutDate: '2026-03-01T09:00:00', dueDate: '2026-03-16T09:00:00',
    status: 'Issued', daysOverdue: 0,
  },
];

// Member-facing slice (current logged-in user = "Reinhard Kenson")
const memberTransactions = allTransactions.filter(t => t.userName === 'Reinhard Kenson');

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
  const baseData = isAdmin ? allTransactions : memberTransactions;

  // ── Simulate loading (TODO: replace with actual API call to GET /api/v1/transaction) ──
  // params: transactionId, userId, bookId, status, checkoutAfter/Before, dueAfter/Before
  const isLoading = useMockDelay();

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
  const returnModal = useModal<Transaction>();
  const handleReturnConfirm = () => {
    returnModal.setProcessing(true);
    const fine = (returnModal.data?.daysOverdue ?? 0) * FINE_RATE_PER_DAY;
    // TODO: PUT /api/v1/transaction/{id} — path param: transactionId; body: Map<String,String>
    // Note: fines are auto-generated server-side on overdue returns; no fineAmount needed in request body
    console.log('Returning tx:', returnModal.data?.id, '| Fine: ₹', fine);
    setTimeout(() => { returnModal.close(); }, 1000);
  };

  const fineAmount = (returnModal.data?.daysOverdue ?? 0) * FINE_RATE_PER_DAY;

  // ── Stat counts for summary chips ──
  const counts = {
    Issued:   baseData.filter(t => t.status === 'Issued').length,
    Returned: baseData.filter(t => t.status === 'Returned').length,
    Overdue:  baseData.filter(t => t.status === 'Overdue').length,
  };

  // ── Table columns ──
  const bookCol: Column<Transaction> = {
    header: 'Book',
    accessor: 'bookName',
    render: (row) => (
      <div className={styles.bookCell}>
        <DynamicBookCover title={row.bookName} author="" width="48px" height="64px" showText={false} />
        <div className={styles.bookCellText}>
          <p className={styles.bookCellTitle}>{row.bookName}</p>
        </div>
      </div>
    ),
  };
  const memberCol: Column<Transaction>   = { header: 'Member',   accessor: 'userName' };
  const issuedCol: Column<Transaction>   = {
    header: 'Issued',
    accessor: 'checkoutDate',
    render: (row) => <span>{fmtDate(row.checkoutDate)}</span>,
  };
  const dueCol: Column<Transaction>      = {
    header: 'Due Date',
    accessor: 'dueDate',
    render: (row) => <span>{fmtDate(row.dueDate)}</span>,
  };
  const returnedCol: Column<Transaction> = {
    header: 'Returned',
    accessor: 'returnedDate',
    render: (row) => (
      <span className={row.returnedDate ? 'text-text-primary' : 'text-text-muted'}>
        {row.returnedDate ? fmtDate(row.returnedDate) : '—'}
      </span>
    ),
  };
  const statusCol: Column<Transaction> = {
    header: 'Status',
    accessor: 'status',
    render: (row) => <Badge variant={txBadgeVariant(row.status)}>{row.status}</Badge>,
  };
  const actionCol: Column<Transaction> = {
    header: 'Action',
    accessor: 'id',
    render: (row) =>
      row.status === 'Issued' || row.status === 'Overdue' ? (
        <Button size="sm" variant="secondary" onClick={() => returnModal.open(row)}>
          Return
        </Button>
      ) : (
        <span className="text-text-muted text-[0.8125rem]">—</span>
      ),
  };

  // Admin: Book | Member | Issued | Due | Returned | Status | Action
  // Member: Book | Issued | Due | Returned | Status | Fine
  const fineCol: Column<Transaction> = {
    header: 'Fine',
    accessor: 'daysOverdue',
    render: (row) =>
      row.status === 'Overdue' && row.daysOverdue > 0 ? (
        <span className="text-danger-600 font-bold">₹{row.daysOverdue * FINE_RATE_PER_DAY}</span>
      ) : (
        <span className="text-text-muted">—</span>
      ),
  };

  const columns: Column<Transaction>[] = isAdmin
    ? [bookCol, memberCol, issuedCol, dueCol, returnedCol, statusCol, actionCol]
    : [bookCol, issuedCol, dueCol, returnedCol, statusCol, fineCol];

  return (
    <AppShell
      userName={isAdmin ? 'System Admin' : 'Rick'}
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
            className={`${styles.statChip} ${activeTab === 'Issued' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('Issued')}
          >
            <span className={`${styles.statDot} ${styles.dotIssued}`} />
            {counts.Issued} Active
          </button>
          <button
            className={`${styles.statChip} ${activeTab === 'Overdue' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('Overdue')}
          >
            <span className={`${styles.statDot} ${styles.dotOverdue}`} />
            {counts.Overdue} Overdue
          </button>
          <button
            className={`${styles.statChip} ${activeTab === 'Returned' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('Returned')}
          >
            <span className={`${styles.statDot} ${styles.dotReturned}`} />
            {counts.Returned} Returned
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
                  {returnModal.data.status}
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
            {returnModal.data.status === 'Overdue' && fineAmount > 0 && (
              <div className={styles.fineBox}>
                <span className={styles.fineBoxTitle}>⚠ Overdue Fine Applicable</span>
                <span className={styles.fineAmount}>₹{fineAmount}</span>
                <span className={styles.fineRate}>
                  ₹{FINE_RATE_PER_DAY}/day × {returnModal.data.daysOverdue} days
                </span>
              </div>
            )}

            <p className={styles.modalHint}>
              {returnModal.data.status === 'Overdue'
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
                  : returnModal.data.status === 'Overdue'
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
