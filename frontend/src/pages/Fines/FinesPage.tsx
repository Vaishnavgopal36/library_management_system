import React, { useState, useEffect } from 'react';
import styles from './FinesPage.module.css';
import { AppShell } from '../../components/layouts/AppShell/AppShell';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button/Button';
import { Modal } from '../../components/molecules/Modal/Modal';
import { Table, Column } from '../../components/molecules/Table/Table';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';

// ── Constants ────────────────────────────────────────────────────────────────
const FINE_RATE_PER_DAY = 10; // ₹10/day

// ── Types ────────────────────────────────────────────────────────────────────
type FineStatus = 'Unpaid' | 'Paid'; // UI-derived from Fine.isPaid for display and tab filtering

// Matches API FineResponse
interface Fine {
  id: string;
  transactionId: string;   // UUID
  bookId: string;           // UUID
  userId: string;           // UUID
  bookName: string;         // was: book
  userName: string;         // was: member
  amount: number;
  isPaid: boolean;          // was: status: FineStatus
  // ── UI-only computed field (not from API) ──────────────────────────────
  daysOverdue: number;      // computed from linked transaction's dueDate
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// Mock data matches FineResponse field names
const allFines: Fine[] = [
  { id: 'fine-0001', transactionId: 'tx-0001', bookId: 'bk-0001', userId: 'usr-0001', bookName: 'Clean Code',               userName: 'Reinhard Kenson', daysOverdue: 3,  amount: 30,  isPaid: false },
  { id: 'fine-0002', transactionId: 'tx-0006', bookId: 'bk-0006', userId: 'usr-0001', bookName: 'Sprint',                   userName: 'Reinhard Kenson', daysOverdue: 5,  amount: 50,  isPaid: false },
  { id: 'fine-0003', transactionId: 'tx-0007', bookId: 'bk-0007', userId: 'usr-0002', bookName: "You Don't Know JS",        userName: 'Alice Smith',     daysOverdue: 1,  amount: 10,  isPaid: false },
  { id: 'fine-0004', transactionId: 'tx-0004', bookId: 'bk-0002', userId: 'usr-0003', bookName: 'Design Patterns',          userName: 'Bob Johnson',     daysOverdue: 12, amount: 120, isPaid: false },
  { id: 'fine-0005', transactionId: 'tx-0003', bookId: 'bk-0003', userId: 'usr-0002', bookName: 'The Pragmatic Programmer', userName: 'Alice Smith',     daysOverdue: 4,  amount: 40,  isPaid: true  },
];

const memberFines = allFines.filter(f => f.userName === 'Reinhard Kenson');
// ── Skeleton row placeholder ─────────────────────────────────────────────────────
const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className={styles.skeletonWrapper}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={styles.skeletonRow}>
        <div className={styles.skeletonCell} style={{ flex: 3 }}><Skeleton variant="text" width="140px" height="14px" /></div>
        <div className={styles.skeletonCell} style={{ flex: 3 }}><Skeleton variant="text" width="120px" height="14px" /></div>
        <div className={styles.skeletonCell} style={{ flex: 2 }}><Skeleton variant="text" width="60px" height="14px" /></div>
        <div className={styles.skeletonCell} style={{ flex: 2 }}><Skeleton variant="text" width="50px" height="14px" /></div>
        <div className={styles.skeletonCell} style={{ flex: 1.5 }}><Skeleton variant="rectangular" width="60px" height="26px" style={{ borderRadius: '50px' }} /></div>
        <div className={styles.skeletonCell} style={{ flex: 2 }}><Skeleton variant="rectangular" width="80px" height="30px" style={{ borderRadius: '8px' }} /></div>
      </div>
    ))}
  </div>
);
// ── Component ─────────────────────────────────────────────────────────────────
export interface FinesPageProps {
  role?: 'admin' | 'member';
}

export const FinesPage: React.FC<FinesPageProps> = ({ role = 'member' }) => {
  const isAdmin = role === 'admin';

  // ── Simulate loading (TODO: replace with actual API call to GET /api/v1/fine) ──
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  // Local state so rows update after actions
  const [fines, setFines] = useState<Fine[]>(isAdmin ? allFines : memberFines);

  // ── Search filter ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Tab filter ──
  const [activeTab, setActiveTab] = useState<'All' | FineStatus>('All');
  const searchFiltered = searchQuery.trim()
    ? fines.filter(f =>
        f.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.bookName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : fines;
  // isPaid maps to tab: 'Unpaid' = !isPaid, 'Paid' = isPaid
  const filtered = activeTab === 'All' ? searchFiltered : searchFiltered.filter(f =>
    activeTab === 'Unpaid' ? !f.isPaid : f.isPaid
  );

  const unpaidCount = fines.filter(f => !f.isPaid).length;
  const totalUnpaid = fines.filter(f => !f.isPaid).reduce((s, f) => s + f.amount, 0);

  // ── Notify modal (admin only) ──
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifyFine, setNotifyFine] = useState<Fine | null>(null);
  const [isSendingNotify, setIsSendingNotify] = useState(false);

  const openNotifyModal = (fine: Fine) => { setNotifyFine(fine); setIsNotifyOpen(true); };
  const closeNotifyModal = () => { setIsNotifyOpen(false); setNotifyFine(null); };
  const handleNotifyConfirm = () => {
    setIsSendingNotify(true);
    // TODO: No dedicated fine-notify endpoint in API — notification is triggered server-side via the Notification system
    // See GET /api/v1/notification for reading notifications
    console.log('Notifying user for fine:', notifyFine?.id);
    setTimeout(() => { setIsSendingNotify(false); closeNotifyModal(); }, 1000);
  };

  // ── Mark Paid modal (admin) / Pay Fine modal (member) ──
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payConfirmed, setPayConfirmed] = useState(false);

  const openPayModal = (fine: Fine) => { setSelectedFine(fine); setIsPayOpen(true); };
  const closePayModal = () => { setIsPayOpen(false); setSelectedFine(null); setPayConfirmed(false); };
  const handlePay = () => {
    setIsPaying(true);
    // TODO: PUT /api/v1/fine/{id} — body: { isPaid: true } (Map<String,Boolean>)
    console.log('Settling fine:', selectedFine?.id);
    setTimeout(() => { setIsPaying(false); setPayConfirmed(true); }, 1000);
  };
  const handlePayDone = () => {
    setFines(prev =>
      prev.map(f => f.id === selectedFine?.id ? { ...f, isPaid: true } : f)
    );
    closePayModal();
  };

  // ── Table columns ──
  const bookCol: Column<Fine> = { header: 'Book', accessor: 'bookName' };
  const memberCol: Column<Fine> = { header: 'Member', accessor: 'userName' };
  const overdueCol: Column<Fine> = {
    header: 'Days Overdue',
    accessor: 'daysOverdue',
    render: (row) => <span style={{ color: '#DC2626', fontWeight: 600 }}>{row.daysOverdue} days</span>,
  };
  const amountCol: Column<Fine> = {
    header: 'Amount',
    accessor: 'amount',
    render: (row) => <span style={{ fontWeight: 700 }}>₹{row.amount}</span>,
  };
  const rateCol: Column<Fine> = {
    header: 'Rate',
    accessor: 'id',
    render: () => <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>₹{FINE_RATE_PER_DAY}/day</span>,
  };
  const statusCol: Column<Fine> = {
    header: 'Status',
    accessor: 'isPaid',
    render: (row) => (
      <Badge variant={row.isPaid ? 'success' : 'error'}>{row.isPaid ? 'Paid' : 'Unpaid'}</Badge>
    ),
  };
  const adminActionCol: Column<Fine> = {
    header: 'Actions',
    accessor: 'id',
    render: (row) =>
      !row.isPaid ? (
        <div className={styles.actionGroup}>
          <Button size="sm" variant="ghost" onClick={() => openNotifyModal(row)}>Notify</Button>
          <Button size="sm" variant="primary" onClick={() => openPayModal(row)}>Mark Paid</Button>
        </div>
      ) : (
        <span style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>Settled</span>
      ),
  };
  const memberActionCol: Column<Fine> = {
    header: 'Action',
    accessor: 'id',
    render: (row) =>
      !row.isPaid ? (
        <Button size="sm" variant="primary" onClick={() => openPayModal(row)}>Pay Fine</Button>
      ) : (
        <span style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>Paid</span>
      ),
  };

  const adminColumns: Column<Fine>[] = [bookCol, memberCol, overdueCol, amountCol, statusCol, adminActionCol];
  const memberColumns: Column<Fine>[] = [bookCol, rateCol, overdueCol, amountCol, statusCol, memberActionCol];
  const columns = isAdmin ? adminColumns : memberColumns;

  const payModalTitle = payConfirmed
    ? (isAdmin ? 'Fine Settled' : 'Payment Confirmed')
    : (isAdmin ? 'Mark Fine as Paid' : 'Pay Fine');

  return (
    <AppShell
      userName={isAdmin ? 'System Admin' : 'Rick'}
      activeNavItem="Fines & Payments"
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
            <h2 className={styles.pageTitle}>Fines &amp; Payments</h2>
            <p className={styles.pageSubtitle}>
              {isAdmin
                ? 'Manage all outstanding and settled fines across members'
                : 'View and pay your outstanding fines'}
            </p>
          </div>
        </div>

        {/* ── Stat chips ♡ Tab filters ── */}
        <div className={styles.summaryRow}>
          <button
            className={`${styles.statChip} ${activeTab === 'All' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('All')}
          >
            All <span className={styles.chipCount}>{fines.length}</span>
          </button>
          <button
            className={`${styles.statChip} ${activeTab === 'Unpaid' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('Unpaid')}
          >
            <span className={`${styles.statDot} ${styles.dotUnpaid}`} />
            {unpaidCount} Unpaid
          </button>
          <button
            className={`${styles.statChip} ${activeTab === 'Paid' ? styles.statChipActive : ''}`}
            onClick={() => setActiveTab('Paid')}
          >
            <span className={`${styles.statDot} ${styles.dotPaid}`} />
            {fines.filter(f => f.isPaid).length} Settled
          </button>
          {totalUnpaid > 0 && (
            <span className={`${styles.statChip} ${styles.statChipDanger}`}>
              &#8377;{totalUnpaid} outstanding
            </span>
          )}
        </div>

        {/* ── Table / Skeleton ── */}
        <div className={styles.tableCard}>
          {isLoading ? (
            <SkeletonRows rows={4} />
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No {activeTab === 'All' ? '' : activeTab.toLowerCase()} fines found.</p>
            </div>
          ) : (
            <Table columns={columns} data={filtered} />
          )}
        </div>

      </div>

      {/* ── Notify Modal (admin only) ────────────────────────────────────── */}
      <Modal isOpen={isNotifyOpen} onClose={closeNotifyModal} title="Send Fine Notification">
        {notifyFine && (
          <div className={styles.modalForm}>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Member</span>
              <span className={styles.infoValue}>{notifyFine.userName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Book</span>
              <span className={styles.infoValue}>{notifyFine.bookName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Days Overdue</span>
                <span className={styles.infoValueDanger}>{notifyFine.daysOverdue} days</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Amount Due</span>
                <span className={styles.infoValueDanger}>₹{notifyFine.amount}</span>
              </div>
            </div>
            <p className={styles.modalHint}>An email reminder will be sent to the member asking them to settle the fine.</p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={closeNotifyModal} disabled={isSendingNotify}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleNotifyConfirm} disabled={isSendingNotify}>
                {isSendingNotify ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Pay / Mark Paid Modal ─────────────────────────────────────────── */}
      <Modal isOpen={isPayOpen} onClose={closePayModal} title={payModalTitle}>
        {selectedFine && (
          <div className={styles.modalForm}>
            {payConfirmed ? (
              <div className={styles.confirmedState}>
                <div className={styles.confirmedIcon}>✓</div>
                <p className={styles.confirmedTitle}>Confirmed</p>
                <p className={styles.confirmedDetail}>
                  ₹{selectedFine.amount} {isAdmin ? 'marked as paid' : 'paid'} for <strong>{selectedFine.bookName}</strong>
                </p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="primary" onClick={handlePayDone}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.infoCard}>
                  {isAdmin && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Member</span>
                      <span className={styles.infoValue}>{selectedFine.userName}</span>
                    </div>
                  )}
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Book</span>
                    <span className={styles.infoValue}>{selectedFine.bookName}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Days Overdue</span>
                    <span className={styles.infoValueDanger}>{selectedFine.daysOverdue} days</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Fine Amount</span>
                    <span className={styles.infoValueDanger}>₹{selectedFine.amount}</span>
                  </div>
                </div>
                <p className={styles.modalHint}>
                  {isAdmin
                    ? 'Confirm that payment has been received in full. The fine will be marked as settled.'
                    : 'No card details needed — a cashier will process this at the counter. Your borrowing privileges will be restored immediately.'}
                </p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="ghost" onClick={closePayModal} disabled={isPaying}>Cancel</Button>
                  <Button type="button" variant="primary" onClick={handlePay} disabled={isPaying}>
                    {isPaying ? 'Processing...' : isAdmin ? 'Confirm Payment Received' : 'Confirm Payment'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

    </AppShell>
  );
};
