import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '../../hooks/useModal';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { useAuth } from '../../context/AuthContext';
import styles from './MemberDashboard.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Card } from '../../components/molecules/Card/Card';
import { DynamicBookCover } from '../../components/atoms/DynamicBookCover/DynamicBookCover';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button/Button';
import { Modal } from '../../components/molecules/Modal/Modal';
import { bookService, type ApiBook } from '../../services/book.service';
import { transactionService, type ApiTransaction } from '../../services/transaction.service';
import { fineService, type ApiFine } from '../../services/fine.service';
import { reservationService } from '../../services/reservation.service';

const computeDueIn = (dueDate: string): { label: string; variant: 'warning' | 'success' | 'error' } => {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)} days overdue`, variant: 'error' };
  if (days <= 3) return { label: `${days} day${days === 1 ? '' : 's'} left`, variant: 'warning' };
  return { label: `${days} days left`, variant: 'success' };
};

const BookDisplay = ({
  title, author, rating, coverHash, onReserve, showReserveButton,
}: { title: string; author: string; rating?: string; coverHash: string; onReserve?: () => void; showReserveButton?: boolean }) => (
  <div className={styles.bookDisplay} onClick={onReserve} style={{ cursor: onReserve ? 'pointer' : 'default' }}>
    <DynamicBookCover title={coverHash} author="" width="130px" height="190px" />
    <div className={styles.bookInfo}>
      <h4 className={styles.bookTitle}>{title}</h4>
      <p className={styles.bookAuthor}>{author}</p>
      {rating && <span className={styles.bookRating}>★ {rating}</span>}
      {showReserveButton && onReserve && (
        <button
          className={styles.reserveBtn}
          onClick={(e) => { e.stopPropagation(); onReserve(); }}
        >
          Reserve
        </button>
      )}
    </div>
  </div>
);

export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();

  // ── Remote data ────────────────────────────────────────────────────────────
  const [allBooks, setAllBooks] = useState<ApiBook[]>([]);
  const [possessions, setPossessions] = useState<ApiTransaction[]>([]);
  const [memberFines, setMemberFines] = useState<ApiFine[]>([]);

  const loadData = useCallback(() => {
    bookService.search({ size: 20 }).then(p => setAllBooks(p.content)).catch(console.error);
    transactionService.list({ status: 'issued' }).then(setPossessions).catch(console.error);
    fineService.list({ isPaid: false }).then(setMemberFines).catch(console.error);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const newArrivals = allBooks.slice(0, 8);
  const recommendedBooks = allBooks.slice(8, 16).length ? allBooks.slice(8, 16) : allBooks.slice(0, 8);

  // ── Reserve Book modal ───────────────────────────────────────────────────
  const reserveModal = useModal<ApiBook>();
  const handleReserveConfirm = () => {
    reserveModal.setProcessing(true);
    reservationService.create(reserveModal.data!.id)
      .then(() => { reserveModal.close(); loadData(); })
      .catch((err: any) => { reserveModal.setProcessing(false); alert(err?.message ?? 'Failed to reserve.'); });
  };

  // ── Return Book modal ─────────────────────────────────────────────────────
  const returnModal = useModal<ApiTransaction>();
  const handleReturnConfirm = () => {
    returnModal.setProcessing(true);
    transactionService.returnBook(returnModal.data!.id)
      .then(() => { returnModal.close(); loadData(); })
      .catch((err: any) => { returnModal.setProcessing(false); alert(err?.message ?? 'Failed to return.'); });
  };

  // ── Pay Fine modal ────────────────────────────────────────────────────────
  const payFineAction = useConfirmAction<ApiFine>();
  const handlePayFine = () => {
    payFineAction.startProcessing();
    fineService.settle(payFineAction.data!.id)
      .then(() => payFineAction.markConfirmed())
      .catch((err: any) => { payFineAction.dismiss(); alert(err?.message ?? 'Failed to pay fine.'); });
  };
  const handleFinePaidDone = () => {
    setMemberFines(prev => prev.filter(f => f.id !== payFineAction.data?.id));
    payFineAction.dismiss();
  };

  return (
    <AppShell userName={user?.fullName ?? 'Member'} activeNavItem="Dashboard" role="member">
      <div className={styles.dashboardLayout}>

        {/* Top Row: Quote and New Arrivals */}
        <div className={styles.topRow}>

          {/* Quote Card */}
          <div className={styles.quoteCard}>
            <h3 className={styles.quoteHeader}>Today's Quote</h3>
            <p className={styles.quoteText}>
              “Don't judge a book by its cover” 
            </p>
            <p className={styles.quoteAuthor}>— George Eliot AKA Mary Ann Evans.</p>
          </div>

          {/* New Arrivals — clicking a book opens the reserve modal */}
          <Card padding="none" className={styles.newArrivalsCard}>
            <div className={styles.newArrivalsHeader}>
              <span className={styles.verticalText}>New Arrivals</span>
            </div>
            <div className={styles.scrollContainer}>
              {newArrivals.map((book) => (
                <BookDisplay
                  key={book.id}
                  title={book.title}
                  author={book.authors.map(a => a.name).join(', ')}
                  coverHash={book.title}
                  onReserve={() => reserveModal.open(book)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Recommended Section — shows an explicit Reserve button */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Good Morning</h2>
          <h3 className={styles.subTitle}>Recommended for You</h3>
          <div className={styles.bookGrid}>
            {recommendedBooks.map((book) => (
              <BookDisplay
                key={book.id}
                title={book.title}
                author={book.authors.map(a => a.name).join(', ')}
                coverHash={book.title}
                onReserve={() => reserveModal.open(book)}
                showReserveButton
              />
            ))}
          </div>
        </div>

        {/* Current Possessions — each card has a Return Book button */}
        <div className={styles.section}>
          <h3 className={styles.subTitle}>Books Currently in possession</h3>
          <div className={styles.bookGrid}>
            {possessions.map((tx) => {
              const due = computeDueIn(tx.dueDate);
              return (
                <div key={tx.id} className={styles.possessionCard}>
                  <BookDisplay title={tx.bookName} author="" coverHash={tx.bookName} />
                  <Badge variant={due.variant} style={{ marginTop: '0.75rem' }}>{due.label}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.returnBtn}
                    onClick={() => returnModal.open(tx)}
                  >
                    Return Book
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Reserve Book Modal ───────────────────────────────────────────── */}
      <Modal isOpen={reserveModal.isOpen} onClose={reserveModal.close} title="Reserve Book">
        {reserveModal.data && (
          <div className={styles.modalBody}>
            <div className={styles.modalBookPreview}>
              <DynamicBookCover title={reserveModal.data.title} author="" width="80px" height="112px" showText={false} />
              <div className={styles.modalBookMeta}>
                <p className={styles.modalBookTitle}>{reserveModal.data.title}</p>
                <p className={styles.modalBookAuthor}>{reserveModal.data.authors.map(a => a.name).join(', ')}</p>
              </div>
            </div>
            <div className={styles.modalDivider} />
            <p className={styles.modalHint}>
              Reserving this book will hold an available copy for you. You will be notified when it is ready for pickup.
            </p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={reserveModal.close} disabled={reserveModal.isProcessing}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleReserveConfirm} disabled={reserveModal.isProcessing}>
                {reserveModal.isProcessing ? 'Reserving...' : 'Confirm Reservation'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Return Book Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={returnModal.isOpen} onClose={returnModal.close} title="Return Book">
        {returnModal.data && (
          <div className={styles.modalBody}>
            <div className={styles.modalBookPreview}>
              <DynamicBookCover title={returnModal.data.bookName} author="" width="80px" height="112px" showText={false} />
              <div className={styles.modalBookMeta}>
                <p className={styles.modalBookTitle}>{returnModal.data.bookName}</p>
                <Badge variant={computeDueIn(returnModal.data.dueDate).variant} style={{ marginTop: '0.5rem' }}>
                  {computeDueIn(returnModal.data.dueDate).label}
                </Badge>
              </div>
            </div>
            <div className={styles.modalDivider} />
            <p className={styles.modalHint}>
              Please ensure the book is in good condition. Any damage may result in a fine being applied to your account.
            </p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={returnModal.close} disabled={returnModal.isProcessing}>Cancel</Button>
              <Button type="button" variant="secondary" onClick={handleReturnConfirm} disabled={returnModal.isProcessing}>
                {returnModal.isProcessing ? 'Processing...' : 'Confirm Return'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Pay Fine Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={payFineAction.isOpen} onClose={payFineAction.close} title={payFineAction.isConfirmed ? 'Payment Confirmed' : 'Pay Fine'}>
        {payFineAction.data && (
          <div className={styles.modalBody}>
            {payFineAction.isConfirmed ? (
              <div className={styles.confirmedState}>
                <div className={styles.confirmedIcon}>✓</div>
                <p className={styles.confirmedTitle}>Confirmed</p>
                <p className={styles.confirmedDetail}>₹{payFineAction.data.amount} paid for <strong>{payFineAction.data.bookName}</strong></p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="primary" onClick={handleFinePaidDone}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.fineModalCard}>
                  <div className={styles.fineModalRow}>
                    <span className={styles.fineModalLabel}>Book</span>
                    <span className={styles.fineModalValue}>{payFineAction.data.bookName}</span>
                  </div>
                  <div className={styles.fineModalRow}>
                    <span className={styles.fineModalLabel}>Fine Amount</span>
                    <span className={styles.fineModalValueDanger}>₹{payFineAction.data.amount}</span>
                  </div>
                </div>
                <p className={styles.modalHint}>Settle this fine to keep your borrowing privileges. No card details needed — a cashier will process this at the counter.</p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="ghost" onClick={payFineAction.close} disabled={payFineAction.isProcessing}>Cancel</Button>
                  <Button type="button" variant="primary" onClick={handlePayFine} disabled={payFineAction.isProcessing}>
                    {payFineAction.isProcessing ? 'Processing...' : 'Confirm Payment'}
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