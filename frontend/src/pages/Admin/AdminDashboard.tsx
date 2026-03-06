import React, { useState } from 'react';
import { useModal } from '../../hooks/useModal';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import styles from './AdminDashboard.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
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
  const [issueBookTitle, setIssueBookTitle] = useState('');
  const [issueMemberEmail, setIssueMemberEmail] = useState('');
  const [issueErrors, setIssueErrors] = useState({ bookTitle: '', memberEmail: '' });
  const [isIssuing, setIsIssuing] = useState(false);

  const closeIssueModal = () => { setIsIssueOpen(false); setIssueBookTitle(''); setIssueMemberEmail(''); setIssueErrors({ bookTitle: '', memberEmail: '' }); };
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = { bookTitle: issueBookTitle.trim() ? '' : 'Book title is required.', memberEmail: '' };
    if (errors.bookTitle) { setIssueErrors(errors); return; }
    setIsIssuing(true);
    // TODO: POST /api/v1/transaction — resolve book & member on the backend by title / email
    console.log('Issue:', { bookTitle: issueBookTitle, memberEmail: issueMemberEmail || undefined });
    setTimeout(() => { setIsIssuing(false); closeIssueModal(); }, 1200);
  };

  // ── Return Asset modal ────────────────────────────────────────────────
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnBookTitle, setReturnBookTitle] = useState('');
  const [returnMemberEmail, setReturnMemberEmail] = useState('');
  const [returnErrors, setReturnErrors] = useState({ bookTitle: '', memberEmail: '' });
  const [isReturning, setIsReturning] = useState(false);

  const closeReturnModal = () => { setIsReturnOpen(false); setReturnBookTitle(''); setReturnMemberEmail(''); setReturnErrors({ bookTitle: '', memberEmail: '' }); };
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = { bookTitle: returnBookTitle.trim() ? '' : 'Book title is required.', memberEmail: '' };
    if (errors.bookTitle) { setReturnErrors(errors); return; }
    setIsReturning(true);
    // TODO: PUT /api/v1/transaction/{id} — resolve transaction by book title + member email
    console.log('Return:', { bookTitle: returnBookTitle, memberEmail: returnMemberEmail || undefined });
    setTimeout(() => { setIsReturning(false); closeReturnModal(); }, 1200);
  };

  

  // ── Notify User modal (fines) ───────────────────────────────────────────
  const notifyModal = useModal<FineRow>();
  const handleNotifyConfirm = () => {
    notifyModal.setProcessing(true);
    // TODO: No dedicated fine-notify endpoint in API — notification is handled server-side via the Notification system
    // See GET /api/v1/notification for reading notifications; sending is triggered automatically
    console.log('Notifying user for fine:', notifyModal.data?.id);
    setTimeout(() => { notifyModal.close(); }, 1000);
  };

  // ── Pending fines (locally mutable so rows disappear after marking paid) ────
  const [pendingFines, setPendingFines] = useState<FineRow[]>(initialFines);

  // ── Mark Fine as Paid modal ────────────────────────────────────────────────
  const paidAction = useConfirmAction<FineRow>();
  const handleMarkPaid = () => {
    paidAction.startProcessing();
    // TODO: PUT /api/v1/fine/{id} — body: { isPaid: true } (Map<String,Boolean>)
    console.log('Marking fine as paid:', paidAction.data?.id);
    setTimeout(() => { paidAction.markConfirmed(); }, 1000);
  };
  const handlePaidDone = () => {
    setPendingFines(prev => prev.filter(f => f.id !== paidAction.data?.id));
    paidAction.dismiss();
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
        <Button size="sm" variant="primary" onClick={() => notifyModal.open(row)}>Notify</Button>
        <Button size="sm" variant="secondary" onClick={() => paidAction.open(row)}>Mark Paid</Button>
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
          <InputField
            label="Book Title"
            placeholder="e.g. Clean Code"
            value={issueBookTitle}
            onChange={(e) => { setIssueBookTitle(e.target.value); if (issueErrors.bookTitle) setIssueErrors(p => ({ ...p, bookTitle: '' })); }}
            error={issueErrors.bookTitle}
            required
            autoFocus
          />
          <InputField
            label="Member Email (optional)"
            placeholder="e.g. alice@example.com — leave empty for logged-in user"
            value={issueMemberEmail}
            onChange={(e) => { setIssueMemberEmail(e.target.value); if (issueErrors.memberEmail) setIssueErrors(p => ({ ...p, memberEmail: '' })); }}
            error={issueErrors.memberEmail}
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
          <InputField
            label="Book Title"
            placeholder="e.g. Clean Code"
            value={returnBookTitle}
            onChange={(e) => { setReturnBookTitle(e.target.value); if (returnErrors.bookTitle) setReturnErrors(p => ({ ...p, bookTitle: '' })); }}
            error={returnErrors.bookTitle}
            required
            autoFocus
          />
          <InputField
            label="Member Email (optional)"
            placeholder="e.g. alice@example.com"
            value={returnMemberEmail}
            onChange={(e) => { setReturnMemberEmail(e.target.value); if (returnErrors.memberEmail) setReturnErrors(p => ({ ...p, memberEmail: '' })); }}
            error={returnErrors.memberEmail}
          />
          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={closeReturnModal} disabled={isReturning}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={isReturning}>{isReturning ? 'Processing...' : 'Confirm Return'}</Button>
          </div>
        </form>
      </Modal>

      

      {/* ── Notify User Modal (Fines) ────────────────────────────────── */}
      <Modal isOpen={notifyModal.isOpen} onClose={notifyModal.close} title="Send Fine Notification">
        {notifyModal.data && (
          <div className={styles.modalForm}>
            <div className={styles.notifyCard}>
              <div className={styles.notifyRow}>
                <span className={styles.notifyLabel}>Member</span>
                <span className={styles.notifyValue}>{notifyModal.data.user}</span>
              </div>
              <div className={styles.notifyRow}>
                <span className={styles.notifyLabel}>Days Overdue</span>
                <span className={styles.notifyValueDanger}>{notifyModal.data.daysOverdue} days</span>
              </div>
              <div className={styles.notifyRow}>
                <span className={styles.notifyLabel}>Amount Due</span>
                <span className={styles.notifyValueDanger}>₹{notifyModal.data.amount}</span>
              </div>
            </div>
            <p className={styles.modalHint}>An email reminder will be sent to the member asking them to settle the fine.</p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={notifyModal.close} disabled={notifyModal.isProcessing}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleNotifyConfirm} disabled={notifyModal.isProcessing}>{notifyModal.isProcessing ? 'Sending...' : 'Send Notification'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Mark Fine as Paid Modal ──────────────────────────────────── */}
      <Modal isOpen={paidAction.isOpen} onClose={paidAction.close} title={paidAction.isConfirmed ? 'Fine Settled' : 'Mark Fine as Paid'}>
        {paidAction.data && (
          <div className={styles.modalForm}>
            {paidAction.isConfirmed ? (
              <div className={styles.confirmedState}>
                <div className={styles.confirmedIcon}>✓</div>
                <p className={styles.confirmedTitle}>Marked as Paid</p>
                <p className={styles.confirmedDetail}>₹{paidAction.data.amount} settled for <strong>{paidAction.data.user}</strong></p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="primary" onClick={handlePaidDone}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.notifyCard}>
                  <div className={styles.notifyRow}>
                    <span className={styles.notifyLabel}>Member</span>
                    <span className={styles.notifyValue}>{paidAction.data.user}</span>
                  </div>
                  <div className={styles.notifyRow}>
                    <span className={styles.notifyLabel}>Days Overdue</span>
                    <span className={styles.notifyValueDanger}>{paidAction.data.daysOverdue} days</span>
                  </div>
                  <div className={styles.notifyRow}>
                    <span className={styles.notifyLabel}>Amount Due</span>
                    <span className={styles.notifyValueDanger}>₹{paidAction.data.amount}</span>
                  </div>
                </div>
                <p className={styles.modalHint}>Confirm that payment has been received in full. This will remove the fine from the outstanding list.</p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="ghost" onClick={paidAction.close} disabled={paidAction.isProcessing}>Cancel</Button>
                  <Button type="button" variant="primary" onClick={handleMarkPaid} disabled={paidAction.isProcessing}>
                    {paidAction.isProcessing ? 'Recording...' : 'Confirm Payment Received'}
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