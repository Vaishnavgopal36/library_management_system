import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../hooks/useModal';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminDashboard.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Card } from '../../components/molecules/Card/Card';
import { Table, Column } from '../../components/molecules/Table/Table';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button/Button';
import { Modal } from '../../components/molecules/Modal/Modal';
import { reportService, type SystemAnalytics } from '../../services/report.service';
import { transactionService, type ApiTransaction } from '../../services/transaction.service';
import { fineService, type ApiFine } from '../../services/fine.service';
import { bookService } from '../../services/book.service';
import { userService } from '../../services/user.service';
import { fmtDate } from '../../utils/dates';
import { txBadgeVariant } from '../../utils/badges';
import { SearchDropdown, type SearchDropdownOption } from '../../components/atoms/SearchDropdown/SearchDropdown';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  // ── Remote data ────────────────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [recentTx, setRecentTx] = useState<ApiTransaction[]>([]);
  const [pendingFines, setPendingFines] = useState<ApiFine[]>([]);

  const loadData = useCallback(() => {
    reportService.getAnalytics().then(setAnalytics).catch(console.error);
    transactionService.list().then(txs => setRecentTx(txs.slice(0, 5))).catch(console.error);
    fineService.list({ isPaid: false }).then(setPendingFines).catch(console.error);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Issue Asset modal ─────────────────────────────────────────────────────────
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [issueBookQuery, setIssueBookQuery] = useState('');
  const [issueBookId, setIssueBookId] = useState<string | undefined>();
  const [issueMemberQuery, setIssueMemberQuery] = useState('');
  const [issueMemberId, setIssueMemberId] = useState<string | undefined>();
  const [issueErrors, setIssueErrors] = useState({ book: '', member: '' });
  const [isIssuing, setIsIssuing] = useState(false);

  const closeIssueModal = () => {
    setIsIssueOpen(false);
    setIssueBookQuery(''); setIssueBookId(undefined);
    setIssueMemberQuery(''); setIssueMemberId(undefined);
    setIssueErrors({ book: '', member: '' });
  };

  const searchBooks = useCallback(async (q: string) => {
    const page = await bookService.search({ title: q, size: 8 });
    return page.content.map(b => ({ id: b.id, primary: b.title, secondary: b.authors.map((a: { name: string }) => a.name).join(', ') }));
  }, []);

  const searchUsers = useCallback(async (q: string) => {
    const page = await userService.list({ search: q, size: 8 });
    return page.content.map(u => ({ id: u.id, primary: u.fullName, secondary: u.email }));
  }, []);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueBookId && !issueBookQuery.trim()) {
      setIssueErrors(p => ({ ...p, book: 'Select a book from the dropdown.' }));
      return;
    }
    setIsIssuing(true);
    setIssueErrors({ book: '', member: '' });
    try {
      let bookId = issueBookId;
      if (!bookId) {
        const books = await bookService.findByTitle(issueBookQuery.trim());
        if (!books.length) { setIssueErrors(p => ({ ...p, book: 'No book found — select from dropdown.' })); return; }
        bookId = books[0].id;
      }
      let userId = issueMemberId;
      if (!userId && issueMemberQuery.trim()) {
        const users = await userService.list({ search: issueMemberQuery.trim(), size: 1 });
        if (!users.content.length) { setIssueErrors(p => ({ ...p, member: 'No member found — select from dropdown.' })); return; }
        userId = users.content[0].id;
      }
      await transactionService.issue(bookId!, userId);
      loadData();
      closeIssueModal();
    } catch (err: any) {
      setIssueErrors(p => ({ ...p, book: err?.message ?? 'Failed to issue book.' }));
    } finally {
      setIsIssuing(false);
    }
  };

  // ── Return Asset modal ────────────────────────────────────────────────────────
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnBookQuery, setReturnBookQuery] = useState('');
  const [returnBookId, setReturnBookId] = useState<string | undefined>();
  const [returnMemberQuery, setReturnMemberQuery] = useState('');
  const [returnMemberId, setReturnMemberId] = useState<string | undefined>();
  const [returnErrors, setReturnErrors] = useState({ book: '', member: '' });
  const [isReturning, setIsReturning] = useState(false);

  const closeReturnModal = () => {
    setIsReturnOpen(false);
    setReturnBookQuery(''); setReturnBookId(undefined);
    setReturnMemberQuery(''); setReturnMemberId(undefined);
    setReturnErrors({ book: '', member: '' });
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBookId && !returnBookQuery.trim()) {
      setReturnErrors(p => ({ ...p, book: 'Select a book from the dropdown.' }));
      return;
    }
    setIsReturning(true);
    setReturnErrors({ book: '', member: '' });
    try {
      let bookId = returnBookId;
      if (!bookId) {
        const books = await bookService.findByTitle(returnBookQuery.trim());
        if (!books.length) { setReturnErrors(p => ({ ...p, book: 'No book found — select from dropdown.' })); return; }
        bookId = books[0].id;
      }
      let userId = returnMemberId;
      if (!userId && returnMemberQuery.trim()) {
        const users = await userService.list({ search: returnMemberQuery.trim(), size: 1 });
        if (!users.content.length) { setReturnErrors(p => ({ ...p, member: 'No member found — select from dropdown.' })); return; }
        userId = users.content[0].id;
      }
      const txs = await transactionService.list({ bookId, userId });
      const active = txs.find(t => t.status === 'issued' || t.status === 'overdue');
      if (!active) { setReturnErrors(p => ({ ...p, book: 'No active loan found for this book.' })); return; }
      await transactionService.returnBook(active.id);
      loadData();
      closeReturnModal();
    } catch (err: any) {
      setReturnErrors(p => ({ ...p, book: err?.message ?? 'Failed to return book.' }));
    } finally {
      setIsReturning(false);
    }
  };

  // ── Notify User modal (fines) ───────────────────────────────────────────
  const notifyModal = useModal<ApiFine>();
  const handleNotifyConfirm = () => {
    notifyModal.setProcessing(true);
    setTimeout(() => { notifyModal.close(); }, 800);
  };

  // ── Mark Fine as Paid modal ────────────────────────────────────────────────
  const paidAction = useConfirmAction<ApiFine>();
  const handleMarkPaid = () => {
    paidAction.startProcessing();
    fineService.settle(paidAction.data!.id)
      .then(() => paidAction.markConfirmed())
      .catch((err: any) => { paidAction.dismiss(); alert(err?.message ?? 'Failed to settle fine.'); });
  };
  const handlePaidDone = () => {
    setPendingFines(prev => prev.filter(f => f.id !== paidAction.data?.id));
    paidAction.dismiss();
  };

  // ── Table columns ───────────────────────────────────────────────────────────
  const txColumns: Column<ApiTransaction>[] = [
    { header: 'Member', accessor: 'userName' },
    { header: 'Book', accessor: 'bookName' },
    { header: 'Date', accessor: 'checkoutDate', render: (row) => <span>{fmtDate(row.checkoutDate)}</span> },
    { header: 'Status', accessor: 'status', render: (row) => (
      <Badge variant={txBadgeVariant(row.status)}>{cap(row.status)}</Badge>
    )},
  ];

  const fineColumns: Column<ApiFine>[] = [
    { header: 'Member', accessor: 'userName' },
    { header: 'Book', accessor: 'bookName' },
    { header: 'Amount', accessor: 'amount', render: (row) => <span style={{ fontWeight: 600 }}>₹{row.amount}</span> },
    { header: 'Action', accessor: 'id', render: (row) => (
      <div className={styles.actionGroup}>
        <Button size="sm" variant="primary" onClick={() => notifyModal.open(row)}>Notify</Button>
        <Button size="sm" variant="secondary" onClick={() => paidAction.open(row)}>Mark Paid</Button>
      </div>
    )},
  ];

  return (
    <AppShell userName={user?.fullName ?? 'Admin'} activeNavItem="Dashboard" role="admin">
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
        <div className={styles.kpiGrid}>
          <Card padding="md">
            <h4 className={styles.kpiLabel}>Total Inventory</h4>
            <span className={styles.kpiValue}>{analytics != null ? analytics.totalActiveBooks.toLocaleString() : '—'}</span>
          </Card>
          <Card padding="md">
            <h4 className={styles.kpiLabel}>Active Loans</h4>
            <span className={styles.kpiValue}>{analytics != null ? analytics.currentlyIssuedBooks.toLocaleString() : '—'}</span>
          </Card>
          <Card padding="md">
            <h4 className={styles.kpiLabel}>Total Members</h4>
            <span className={styles.kpiValue}>{analytics != null ? analytics.totalActiveUsers.toLocaleString() : '—'}</span>
          </Card>
          <Card padding="md">
            <h4 className={styles.kpiLabel}>Unpaid Fines</h4>
            <span className={`${styles.kpiValue} text-danger`}>{analytics != null ? `₹${Number(analytics.totalUnpaidFinesValue).toLocaleString()}` : '—'}</span>
          </Card>
        </div>

        {/* Ledgers */}
        <div className={styles.tablesContainer}>
          <div className={styles.tableWrapper}>
            <h3 className={styles.tableTitle}>Recent Circulation Activity</h3>
            <Table columns={txColumns} data={recentTx} />
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
          <SearchDropdown
            label="Book Title"
            placeholder="Type to search books…"
            value={issueBookQuery}
            onChange={(v) => { setIssueBookQuery(v); setIssueBookId(undefined); if (issueErrors.book) setIssueErrors(p => ({ ...p, book: '' })); }}
            onSelect={(opt) => { setIssueBookQuery(opt.primary); setIssueBookId(opt.id); }}
            search={searchBooks}
            error={issueErrors.book}
            required
            autoFocus
          />
          <SearchDropdown
            label="Member (optional — leave empty for logged-in user)"
            placeholder="Type name or email to search members…"
            value={issueMemberQuery}
            onChange={(v) => { setIssueMemberQuery(v); setIssueMemberId(undefined); if (issueErrors.member) setIssueErrors(p => ({ ...p, member: '' })); }}
            onSelect={(opt) => { setIssueMemberQuery(`${opt.primary} (${opt.secondary})`); setIssueMemberId(opt.id); }}
            search={searchUsers}
            error={issueErrors.member}
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
          <SearchDropdown
            label="Book Title"
            placeholder="Type to search books…"
            value={returnBookQuery}
            onChange={(v) => { setReturnBookQuery(v); setReturnBookId(undefined); if (returnErrors.book) setReturnErrors(p => ({ ...p, book: '' })); }}
            onSelect={(opt) => { setReturnBookQuery(opt.primary); setReturnBookId(opt.id); }}
            search={searchBooks}
            error={returnErrors.book}
            required
            autoFocus
          />
          <SearchDropdown
            label="Member (optional)"
            placeholder="Type name or email to search members…"
            value={returnMemberQuery}
            onChange={(v) => { setReturnMemberQuery(v); setReturnMemberId(undefined); if (returnErrors.member) setReturnErrors(p => ({ ...p, member: '' })); }}
            onSelect={(opt) => { setReturnMemberQuery(`${opt.primary} (${opt.secondary})`); setReturnMemberId(opt.id); }}
            search={searchUsers}
            error={returnErrors.member}
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
                <span className={styles.notifyValue}>{notifyModal.data.userName}</span>
              </div>
              <div className={styles.notifyRow}>
                <span className={styles.notifyLabel}>Book</span>
                <span className={styles.notifyValue}>{notifyModal.data.bookName}</span>
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
                <p className={styles.confirmedDetail}>₹{paidAction.data.amount} settled for <strong>{paidAction.data.userName}</strong></p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="primary" onClick={handlePaidDone}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.notifyCard}>
                  <div className={styles.notifyRow}>
                    <span className={styles.notifyLabel}>Member</span>
                    <span className={styles.notifyValue}>{paidAction.data.userName}</span>
                  </div>
                  <div className={styles.notifyRow}>
                    <span className={styles.notifyLabel}>Book</span>
                    <span className={styles.notifyValue}>{paidAction.data.bookName}</span>
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