import React, { useState } from 'react';
import { FINE_RATE_PER_DAY } from '../../utils/constants';
import { useModal } from '../../hooks/useModal';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import styles from './MemberDashboard.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Card } from '../../components/molecules/Card/Card';
import { DynamicBookCover } from '../../components/atoms/DynamicBookCover/DynamicBookCover';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button/Button';
import { Modal } from '../../components/molecules/Modal/Modal';

type BookData = { title: string; author: string; coverHash: string; rating?: string };
type PossessionData = { title: string; author: string; coverHash: string; dueIn: string; dueVariant: 'warning' | 'success' };

const recommendedBooks: BookData[] = [
  { title: "Don't Make Me Think", author: 'Steve Krug, 2000', rating: '4.5/5', coverHash: 'Think' },
  { title: 'The Road to React', author: 'Robin Wieruch', rating: '4.8/5', coverHash: 'React' },
  { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', rating: '5/5', coverHash: 'Rich' },
  { title: 'Harry Potter', author: 'J.K. Rowling', rating: '4.9/5', coverHash: 'Potter' },
  { title: "You Don't Know JS", author: 'Kyle Simpson', rating: '4.9/5', coverHash: 'JS' },
];

const newArrivals: BookData[] = [
  { title: 'Holy Bible', author: 'King James', coverHash: 'Bible' },
  { title: 'Harry Potter', author: 'J.K. Rowling', coverHash: 'Potter' },
  { title: 'Lean UX', author: 'Jeff Gothelf', coverHash: 'Lean' },
  { title: "Don't Make Me Think", author: 'Steve Krug', coverHash: 'Think' },
];

const currentPossessions: PossessionData[] = [
  { title: 'Sprint', author: 'Jake Knapp', coverHash: 'Sprint', dueIn: '2 Days', dueVariant: 'warning' },
  { title: 'The Design of Everyday Things', author: 'Don Norman', coverHash: 'Design', dueIn: '14 Days', dueVariant: 'success' },
];

type FineData = { id: string; book: string; daysOverdue: number; amount: number };
const initialMemberFines: FineData[] = [
  { id: 'f1', book: 'Clean Code', daysOverdue: 3, amount: 30 },
  { id: 'f6', book: 'Sprint', daysOverdue: 5, amount: 50 },
];

// Clicking the whole card triggers reserve (suitable for tight scroll areas too)
const BookDisplay = ({
  title, author, rating, coverHash, onReserve, showReserveButton,
}: BookData & { onReserve?: () => void; showReserveButton?: boolean }) => (
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

  // ── Reserve Book modal ───────────────────────────────────────────────────
  const reserveModal = useModal<BookData>();
  const handleReserveConfirm = () => {
    reserveModal.setProcessing(true);
    // TODO: POST /api/v1/reservation — body: ReservationRequest { bookId (from selected book) }
    console.log('Reserving:', reserveModal.data?.title);
    setTimeout(() => { reserveModal.close(); }, 1200);
  };

  // ── Return Book modal ─────────────────────────────────────────────────────
  const returnModal = useModal<PossessionData>();
  const handleReturnConfirm = () => {
    returnModal.setProcessing(true);
    // TODO: PUT /api/v1/transaction/{id} — path param: transactionId; body: Map<String,String>
    console.log('Returning:', returnModal.data?.title);
    setTimeout(() => { returnModal.close(); }, 1000);
  };

  // ── Pay Fine modal ────────────────────────────────────────────────────────
  const [memberFines, setMemberFines] = useState<FineData[]>(initialMemberFines);
  const payFineAction = useConfirmAction<FineData>();
  const handlePayFine = () => {
    payFineAction.startProcessing();
    // TODO: PUT /api/v1/fine/{id} — body: { isPaid: true } (Map<String,Boolean>)
    console.log('Paying fine:', payFineAction.data?.id);
    setTimeout(() => { payFineAction.markConfirmed(); }, 1000);
  };
  const handleFinePaidDone = () => {
    setMemberFines(prev => prev.filter(f => f.id !== payFineAction.data?.id));
    payFineAction.dismiss();
  };

  return (
    <AppShell userName="Rick" activeNavItem="Dashboard" role="member">
      <div className={styles.dashboardLayout}>

        {/* Top Row: Quote and New Arrivals */}
        <div className={styles.topRow}>

          {/* Quote Card */}
          <div className={styles.quoteCard}>
            <h3 className={styles.quoteHeader}>Today's Quote</h3>
            <p className={styles.quoteText}>
              “There is more treasure in books than in all the pirate’s loot on Treasure Island.”
            </p>
            <p className={styles.quoteAuthor}>- Walt Disney</p>
          </div>

          {/* New Arrivals — clicking a book opens the reserve modal */}
          <Card padding="none" className={styles.newArrivalsCard}>
            <div className={styles.newArrivalsHeader}>
              <span className={styles.verticalText}>New Arrivals</span>
            </div>
            <div className={styles.scrollContainer}>
              {newArrivals.map((book) => (
                <BookDisplay key={book.coverHash} {...book} onReserve={() => reserveModal.open(book)} />
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
              <BookDisplay key={book.coverHash} {...book} onReserve={() => reserveModal.open(book)} showReserveButton />
            ))}
          </div>
        </div>

        {/* Current Possessions — each card has a Return Book button */}
        <div className={styles.section}>
          <h3 className={styles.subTitle}>Books Currently in possession</h3>
          <div className={styles.bookGrid}>
            {currentPossessions.map((book) => (
              <div key={book.coverHash} className={styles.possessionCard}>
                <BookDisplay title={book.title} author={book.author} coverHash={book.coverHash} />
                <Badge variant={book.dueVariant} style={{ marginTop: '0.75rem' }}>Due in {book.dueIn}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles.returnBtn}
                  onClick={() => returnModal.open(book)}
                >
                  Return Book
                </Button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Reserve Book Modal ───────────────────────────────────────────── */}
      <Modal isOpen={reserveModal.isOpen} onClose={reserveModal.close} title="Reserve Book">
        {reserveModal.data && (
          <div className={styles.modalBody}>
            <div className={styles.modalBookPreview}>
              <DynamicBookCover title={reserveModal.data.coverHash} author="" width="80px" height="112px" showText={false} />
              <div className={styles.modalBookMeta}>
                <p className={styles.modalBookTitle}>{reserveModal.data.title}</p>
                <p className={styles.modalBookAuthor}>{reserveModal.data.author}</p>
                {reserveModal.data.rating && <span className={styles.modalBookRating}>★ {reserveModal.data.rating}</span>}
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
              <DynamicBookCover title={returnModal.data.coverHash} author="" width="80px" height="112px" showText={false} />
              <div className={styles.modalBookMeta}>
                <p className={styles.modalBookTitle}>{returnModal.data.title}</p>
                <p className={styles.modalBookAuthor}>{returnModal.data.author}</p>
                <Badge variant={returnModal.data.dueVariant} style={{ marginTop: '0.5rem' }}>Due in {returnModal.data.dueIn}</Badge>
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
                <p className={styles.confirmedDetail}>₹{payFineAction.data.amount} paid for <strong>{payFineAction.data.book}</strong></p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="primary" onClick={handleFinePaidDone}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.fineModalCard}>
                  <div className={styles.fineModalRow}>
                    <span className={styles.fineModalLabel}>Book</span>
                    <span className={styles.fineModalValue}>{payFineAction.data.book}</span>
                  </div>
                  <div className={styles.fineModalRow}>
                    <span className={styles.fineModalLabel}>Days Overdue</span>
                    <span className={styles.fineModalValueDanger}>{payFineAction.data.daysOverdue} days</span>
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