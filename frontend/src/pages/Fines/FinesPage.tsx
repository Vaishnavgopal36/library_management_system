import React, { useState, useEffect, useCallback } from 'react';
import { FINE_RATE_PER_DAY } from '../../utils/constants';
import { truncateTitle } from '../../utils/textUtils';
import { AppRole } from '../../utils/types';
import { useModal } from '../../hooks/useModal';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { useAuth } from '../../context/AuthContext';
import { fineService, type ApiFine } from '../../services/fine.service';
import styles from './FinesPage.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button/Button';
import { Modal } from '../../components/molecules/Modal/Modal';
import { Table, Column } from '../../components/molecules/Table/Table';
import { Pagination } from '../../components/molecules/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';

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
  role?: AppRole;
}

export const FinesPage: React.FC<FinesPageProps> = ({ role = 'member' }) => {
  const isAdmin = role === 'admin';
  const { user } = useAuth();

  // ── Real API loading ──
  const [fines, setFines] = useState<ApiFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadData = useCallback(() => {
    setIsLoading(true);
    fineService.list().then(setFines).catch(console.error).finally(() => setIsLoading(false));
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  // ── Search filter ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Tab filter ──
  const [activeTab, setActiveTab] = useState<'All' | 'Unpaid' | 'Paid'>('All');
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

  // ── Pagination ──
  const pagination = usePagination(filtered, { pageSize: 5 });

  const unpaidCount = fines.filter(f => !f.isPaid).length;
  const totalUnpaid = fines.filter(f => !f.isPaid).reduce((s, f) => s + f.remainingAmount, 0);

  // ── Notify modal (admin only) ──
  const notifyModal = useModal<ApiFine>();
  const handleNotifyConfirm = () => {
    notifyModal.setProcessing(true);
    console.log('Notifying user for fine:', notifyModal.data?.id);
    setTimeout(() => { notifyModal.close(); }, 1000);
  };

  // ── Mark Paid modal (admin) / Pay Fine modal (member) ──
  const payAction = useConfirmAction<ApiFine>();
  const handlePay = () => {
    payAction.startProcessing();
    fineService.settle(payAction.data!.id)
      .then(() => payAction.markConfirmed())
      .catch((err: any) => { payAction.dismiss(); alert(err?.message ?? 'Failed to settle fine.'); });
  };
  const handlePayDone = () => {
    setFines(prev =>
      prev.map(f => f.id === payAction.data?.id ? { ...f, isPaid: true } : f)
    );
    payAction.dismiss();
  };

  // ── Table columns ──
  const bookCol: Column<ApiFine> = {
    header: 'Book',
    accessor: 'bookName',
    render: (row) => (
      <span title={row.bookName} style={{ display: 'block', maxWidth: '200px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {truncateTitle(row.bookName)}
      </span>
    ),
  };
  const memberCol: Column<ApiFine> = { header: 'Member', accessor: 'userName' };
  const amountCol: Column<ApiFine> = {
    header: 'Amount',
    accessor: 'amount',
    render: (row) => <span style={{ fontWeight: 700 }}>₹{row.amount}</span>,
  };
  const rateCol: Column<ApiFine> = {
    header: 'Rate',
    accessor: 'id',
    render: () => <span className="text-text-secondary text-[0.8125rem]">₹{FINE_RATE_PER_DAY}/day</span>,
  };
  const statusCol: Column<ApiFine> = {
    header: 'Status',
    accessor: 'isPaid',
    render: (row) => (
      <Badge variant={row.isPaid ? 'success' : 'error'}>{row.isPaid ? 'Paid' : 'Unpaid'}</Badge>
    ),
  };
  const adminActionCol: Column<ApiFine> = {
    header: 'Actions',
    accessor: 'id',
    render: (row) =>
      !row.isPaid ? (
        <div className={styles.actionGroup}>
          <Button size="sm" variant="ghost" onClick={() => notifyModal.open(row)}>Notify</Button>
          <Button size="sm" variant="primary" onClick={() => payAction.open(row)}>Mark Paid</Button>
        </div>
      ) : (
        <span className="text-text-muted text-[0.8125rem]">Settled</span>
      ),
  };
  const memberActionCol: Column<ApiFine> = {
    header: 'Action',
    accessor: 'id',
    render: (row) =>
      !row.isPaid ? (
        <Button size="sm" variant="primary" onClick={() => payAction.open(row)}>Pay Fine</Button>
      ) : (
        <span className="text-text-muted text-[0.8125rem]">Paid</span>
      ),
  };

  const adminColumns: Column<ApiFine>[] = [bookCol, memberCol, amountCol, statusCol, adminActionCol];
  const memberColumns: Column<ApiFine>[] = [bookCol, rateCol, amountCol, statusCol, memberActionCol];
  const columns = isAdmin ? adminColumns : memberColumns;

  const payModalTitle = payAction.isConfirmed
    ? (isAdmin ? 'Fine Settled' : 'Payment Confirmed')
    : (isAdmin ? 'Mark Fine as Paid' : 'Pay Fine');

  return (
    <AppShell
      userName={user?.fullName ?? (isAdmin ? 'Admin' : 'Member')}
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

      {/* ── Notify Modal (admin only) ────────────────────────────────────── */}
      <Modal isOpen={notifyModal.isOpen} onClose={notifyModal.close} title="Send Fine Notification">
        {notifyModal.data && (
          <div className={styles.modalForm}>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Member</span>
              <span className={styles.infoValue}>{notifyModal.data.userName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Book</span>
              <span className={styles.infoValue}>{notifyModal.data.bookName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Amount Due</span>
                <span className={styles.infoValueDanger}>₹{notifyModal.data.amount}</span>
              </div>
            </div>
            <p className={styles.modalHint}>An email reminder will be sent to the member asking them to settle the fine.</p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={notifyModal.close} disabled={notifyModal.isProcessing}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleNotifyConfirm} disabled={notifyModal.isProcessing}>
                {notifyModal.isProcessing ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Pay / Mark Paid Modal ─────────────────────────────────────────── */}
      <Modal isOpen={payAction.isOpen} onClose={payAction.close} title={payModalTitle}>
        {payAction.data && (
          <div className={styles.modalForm}>
            {payAction.isConfirmed ? (
              <div className={styles.confirmedState}>
                <div className={styles.confirmedIcon}>✓</div>
                <p className={styles.confirmedTitle}>Confirmed</p>
                <p className={styles.confirmedDetail}>
                  ₹{payAction.data.amount} {isAdmin ? 'marked as paid' : 'paid'} for <strong>{payAction.data.bookName}</strong>
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
                      <span className={styles.infoValue}>{payAction.data.userName}</span>
                    </div>
                  )}
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Book</span>
                    <span className={styles.infoValue}>{payAction.data.bookName}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Fine Amount</span>
                    <span className={styles.infoValueDanger}>₹{payAction.data.amount}</span>
                  </div>
                </div>
                <p className={styles.modalHint}>
                  {isAdmin
                    ? 'Confirm that payment has been received in full. The fine will be marked as settled.'
                    : 'No card details needed — a cashier will process this at the counter. Your borrowing privileges will be restored immediately.'}
                </p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="ghost" onClick={payAction.close} disabled={payAction.isProcessing}>Cancel</Button>
                  <Button type="button" variant="primary" onClick={handlePay} disabled={payAction.isProcessing}>
                    {payAction.isProcessing ? 'Processing...' : isAdmin ? 'Confirm Payment Received' : 'Confirm Payment'}
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
