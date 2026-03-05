import React, { useState } from 'react';
import styles from './AdminDashboard.module.css';
import { AppShell } from '../../components/layouts/AppShell/AppShell';
import { Card } from '../../components/molecules/Card/Card';
import { Table, Column } from '../../components/molecules/Table/Table';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button/Button';
import { Modal } from '../../components/molecules/Modal/Modal';
import { InputField } from '../../components/atoms/InputField/InputField';

// Mock data matching your TransactionController & FineController
const recentTransactions = [
  { id: '1', user: 'Reinhard Kenson', book: 'Clean Code', action: 'Issued', date: '05 Mar 2026', status: 'Active' },
  { id: '2', user: 'Alice Smith', book: 'Design Patterns', action: 'Returned', date: '05 Mar 2026', status: 'Completed' },
];

type FineRow = { id: string; user: string; amount: number; daysOverdue: number; status: string };

const initialFines: FineRow[] = [
  { id: '1', user: 'Bob Johnson', amount: 150, daysOverdue: 12, status: 'Unpaid' },
  { id: '2', user: 'Alice Smith', amount: 10, daysOverdue: 1, status: 'Unpaid' },
];

export const AdminDashboard: React.FC = () => {

  // ── Issue Asset modal ─────────────────────────────────────────────────
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  // Matches TransactionRequest: bookId (UUID, required), userId (UUID, optional)
  const [issueBookId, setIssueBookId] = useState('');
  const [issueUserId, setIssueUserId] = useState('');
  const [issueErrors, setIssueErrors] = useState({ bookId: '', userId: '' });
  const [isIssuing, setIsIssuing] = useState(false);

  const closeIssueModal = () => { setIsIssueOpen(false); setIssueBookId(''); setIssueUserId(''); setIssueErrors({ bookId: '', userId: '' }); };
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = { bookId: issueBookId.trim() ? '' : 'Book UUID is required.', userId: '' };
    if (errors.bookId) { setIssueErrors(errors); return; }
    setIsIssuing(true);
    // TODO: POST /api/v1/transaction — body: TransactionRequest { bookId (UUID, required), userId (UUID, optional) }
    console.log('Issue:', { bookId: issueBookId, userId: issueUserId || undefined });
    setTimeout(() => { setIsIssuing(false); closeIssueModal(); }, 1200);
  };

  // ── Return Asset modal ────────────────────────────────────────────────
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  // PUT /api/v1/transaction/{id} — only the transactionId (UUID) is needed as path param
  const [returnTransactionId, setReturnTransactionId] = useState('');
  const [returnErrors, setReturnErrors] = useState({ transactionId: '' });
  const [isReturning, setIsReturning] = useState(false);

  const closeReturnModal = () => { setIsReturnOpen(false); setReturnTransactionId(''); setReturnErrors({ transactionId: '' }); };
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = { transactionId: returnTransactionId.trim() ? '' : 'Transaction UUID is required.' };
    if (errors.transactionId) { setReturnErrors(errors); return; }
    setIsReturning(true);
    // TODO: PUT /api/v1/transaction/{id} — path param: transactionId (UUID); body: Map<String,String>
    console.log('Return transaction:', returnTransactionId);
    setTimeout(() => { setIsReturning(false); closeReturnModal(); }, 1200);
  };

  

  // ── Notify User modal (fines) ────────────────────────────────────────────
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifyFine, setNotifyFine] = useState<FineRow | null>(null);
  const [isSendingNotify, setIsSendingNotify] = useState(false);

  const openNotifyModal = (fine: FineRow) => { setNotifyFine(fine); setIsNotifyOpen(true); };
  const closeNotifyModal = () => { setIsNotifyOpen(false); setNotifyFine(null); };
  const handleNotifyConfirm = () => {
    setIsSendingNotify(true);
    // TODO: No dedicated fine-notify endpoint in API — notification is handled server-side via the Notification system
    // See GET /api/v1/notification for reading notifications; sending is triggered automatically
    console.log('Notifying user for fine:', notifyFine?.id);
    setTimeout(() => { setIsSendingNotify(false); closeNotifyModal(); }, 1000);
  };

  // ── Pending fines (locally mutable so rows disappear after marking paid) ────
  const [pendingFines, setPendingFines] = useState<FineRow[]>(initialFines);

  // ── Mark Fine as Paid modal ────────────────────────────────────────────────
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  const [markPaidFine, setMarkPaidFine] = useState<FineRow | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);

  const openMarkPaidModal = (fine: FineRow) => { setMarkPaidFine(fine); setIsMarkPaidOpen(true); };
  const closeMarkPaidModal = () => { setIsMarkPaidOpen(false); setMarkPaidFine(null); setPaidConfirmed(false); };
  const handleMarkPaid = () => {
    setIsPaying(true);
    // TODO: PUT /api/v1/fine/{id} — body: { isPaid: true } (Map<String,Boolean>)
    console.log('Marking fine as paid:', markPaidFine?.id);
    setTimeout(() => { setIsPaying(false); setPaidConfirmed(true); }, 1000);
  };
  const handlePaidDone = () => {
    setPendingFines(prev => prev.filter(f => f.id !== markPaidFine?.id));
    closeMarkPaidModal();
  };

  // ── Table columns ───────────────────────────────────────────────────────────
  const txColumns: Column<typeof recentTransactions[0]>[] = [
    { header: 'User', accessor: 'user' },
    { header: 'Book', accessor: 'book' },
    { header: 'Action', accessor: 'action' },
    { header: 'Date', accessor: 'date' },
    { header: 'Status', accessor: 'status', render: (row) => (
      <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</Badge>
    )},
  ];

  const fineColumns: Column<FineRow>[] = [
    { header: 'User', accessor: 'user' },
    { header: 'Days Overdue', accessor: 'daysOverdue', render: (row) => <span style={{ color: '#EF4444', fontWeight: 600 }}>{row.daysOverdue} Days</span> },
    { header: 'Amount', accessor: 'amount', render: (row) => <span style={{ fontWeight: 600 }}>₹{row.amount}</span> },
    { header: 'Action', accessor: 'id', render: (row) => (
      <div className={styles.actionGroup}>
        <Button size="sm" variant="primary" onClick={() => openNotifyModal(row)}>Notify</Button>
        <Button size="sm" variant="secondary" onClick={() => openMarkPaidModal(row)}>Mark Paid</Button>
      </div>
    )},
  ];

  return (
    <AppShell userName="System Admin" activeNavItem="Dashboard" role="admin">
      <div className={styles.dashboardLayout}>
        
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.pageTitle}>Library Overview</h2>
            <p className={styles.pageSubtitle}>System Analytics &amp; Circulation Control</p>
          </div>
          <div className={styles.quickActions}>
            <Button variant="primary" onClick={() => setIsIssueOpen(true)}>+ Issue Asset</Button>
            <Button variant="secondary" onClick={() => setIsReturnOpen(true)}>Return Asset</Button>
          </div>
        </div>

        {/* System Analytics */}
        {/* TODO: All KPI values from GET /api/v1/report */}
        <div className={styles.kpiGrid}>
          <Card padding="md">
            <h4 className={styles.kpiLabel}>Total Inventory</h4>
            <span className={styles.kpiValue}>1,452</span>
          </Card>
          <Card padding="md">
            <h4 className={styles.kpiLabel}>Active Loans</h4>
            <span className={styles.kpiValue}>348</span>
          </Card>
          <Card padding="md">
            <h4 className={styles.kpiLabel}>Pending Holds</h4>
            <span className={styles.kpiValue}>24</span>
          </Card>
          <Card padding="md">
            <h4 className={styles.kpiLabel}>Overdue Fines</h4>
            <span className={styles.kpiValue} style={{ color: '#EF4444' }}>₹4,250</span>
          </Card>
        </div>

        {/* Ledgers */}
        <div className={styles.tablesContainer}>
          <div className={styles.tableWrapper}>
            <h3 className={styles.tableTitle}>Recent Circulation Activity</h3>
            <Table columns={txColumns} data={recentTransactions} />
          </div>
          
          <div className={styles.tableWrapper}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className={styles.tableTitle} style={{ margin: 0 }}>Unpaid Fines</h3>
              <Badge variant="error">Action Required</Badge>
            </div>
            <Table columns={fineColumns} data={pendingFines} />
          </div>
        </div>

      </div>

      {/* ── Issue Asset Modal ──────────────────────────────────────── */}
      <Modal isOpen={isIssueOpen} onClose={closeIssueModal} title="Issue Asset">
        <form onSubmit={handleIssueSubmit} className={styles.modalForm}>
          {/* bookId matches TransactionRequest.bookId (UUID, required) */}
          <InputField
            label="Book ID (UUID)"
            placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            value={issueBookId}
            onChange={(e) => { setIssueBookId(e.target.value); if (issueErrors.bookId) setIssueErrors(p => ({ ...p, bookId: '' })); }}
            error={issueErrors.bookId}
            required
            autoFocus
          />
          {/* userId matches TransactionRequest.userId (UUID, optional — omit to issue to the logged-in user) */}
          <InputField
            label="Member User ID (UUID, optional)"
            placeholder="e.g. usr-a1b2c3d4-0001-0001-0001-000100010001"
            value={issueUserId}
            onChange={(e) => { setIssueUserId(e.target.value); if (issueErrors.userId) setIssueErrors(p => ({ ...p, userId: '' })); }}
            error={issueErrors.userId}
          />
          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={closeIssueModal} disabled={isIssuing}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isIssuing}>{isIssuing ? 'Issuing...' : 'Confirm Issue'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Return Asset Modal ─────────────────────────────────────── */}
      <Modal isOpen={isReturnOpen} onClose={closeReturnModal} title="Return Asset">
        <form onSubmit={handleReturnSubmit} className={styles.modalForm}>
          {/* transactionId is the path param for PUT /api/v1/transaction/{id} */}
          <InputField
            label="Transaction ID (UUID)"
            placeholder="e.g. tx-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
            value={returnTransactionId}
            onChange={(e) => { setReturnTransactionId(e.target.value); if (returnErrors.transactionId) setReturnErrors(p => ({ ...p, transactionId: '' })); }}
            error={returnErrors.transactionId}
            required
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={closeReturnModal} disabled={isReturning}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={isReturning}>{isReturning ? 'Processing...' : 'Confirm Return'}</Button>
          </div>
        </form>
      </Modal>

      

      {/* ── Notify User Modal (Fines) ────────────────────────────────── */}
      <Modal isOpen={isNotifyOpen} onClose={closeNotifyModal} title="Send Fine Notification">
        {notifyFine && (
          <div className={styles.modalForm}>
            <div className={styles.notifyCard}>
              <div className={styles.notifyRow}>
                <span className={styles.notifyLabel}>Member</span>
                <span className={styles.notifyValue}>{notifyFine.user}</span>
              </div>
              <div className={styles.notifyRow}>
                <span className={styles.notifyLabel}>Days Overdue</span>
                <span className={styles.notifyValueDanger}>{notifyFine.daysOverdue} days</span>
              </div>
              <div className={styles.notifyRow}>
                <span className={styles.notifyLabel}>Amount Due</span>
                <span className={styles.notifyValueDanger}>₹{notifyFine.amount}</span>
              </div>
            </div>
            <p className={styles.modalHint}>An email reminder will be sent to the member asking them to settle the fine.</p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={closeNotifyModal} disabled={isSendingNotify}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleNotifyConfirm} disabled={isSendingNotify}>{isSendingNotify ? 'Sending...' : 'Send Notification'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Mark Fine as Paid Modal ──────────────────────────────────── */}
      <Modal isOpen={isMarkPaidOpen} onClose={closeMarkPaidModal} title={paidConfirmed ? 'Fine Settled' : 'Mark Fine as Paid'}>
        {markPaidFine && (
          <div className={styles.modalForm}>
            {paidConfirmed ? (
              <div className={styles.confirmedState}>
                <div className={styles.confirmedIcon}>✓</div>
                <p className={styles.confirmedTitle}>Marked as Paid</p>
                <p className={styles.confirmedDetail}>₹{markPaidFine.amount} settled for <strong>{markPaidFine.user}</strong></p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="primary" onClick={handlePaidDone}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.notifyCard}>
                  <div className={styles.notifyRow}>
                    <span className={styles.notifyLabel}>Member</span>
                    <span className={styles.notifyValue}>{markPaidFine.user}</span>
                  </div>
                  <div className={styles.notifyRow}>
                    <span className={styles.notifyLabel}>Days Overdue</span>
                    <span className={styles.notifyValueDanger}>{markPaidFine.daysOverdue} days</span>
                  </div>
                  <div className={styles.notifyRow}>
                    <span className={styles.notifyLabel}>Amount Due</span>
                    <span className={styles.notifyValueDanger}>₹{markPaidFine.amount}</span>
                  </div>
                </div>
                <p className={styles.modalHint}>Confirm that payment has been received in full. This will remove the fine from the outstanding list.</p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="ghost" onClick={closeMarkPaidModal} disabled={isPaying}>Cancel</Button>
                  <Button type="button" variant="primary" onClick={handleMarkPaid} disabled={isPaying}>
                    {isPaying ? 'Recording...' : 'Confirm Payment Received'}
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