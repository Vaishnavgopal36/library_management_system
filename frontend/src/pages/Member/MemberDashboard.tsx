import React, { useState } from 'react';
import { FINE_RATE_PER_DAY } from '../../utils/constants';
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

  // ── Reserve Book modal ────────────────────────────────────────────────────
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveBook, setReserveBook] = useState<BookData | null>(null);
  const [isReserving, setIsReserving] = useState(false);

  const openReserveModal = (book: BookData) => { setReserveBook(book); setIsReserveOpen(true); };
  const closeReserveModal = () => { setIsReserveOpen(false); setReserveBook(null); };
  const handleReserveConfirm = () => {
    setIsReserving(true);
    // TODO: POST /api/v1/reservation — body: ReservationRequest { bookId (UUID, required), userId (UUID, optional) }
    console.log('Reserving:', reserveBook?.title);
    setTimeout(() => { setIsReserving(false); closeReserveModal(); }, 1200);
  };

  // ── Return Book modal ─────────────────────────────────────────────────────
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnBook, setReturnBook] = useState<PossessionData | null>(null);
  const [isReturning, setIsReturning] = useState(false);

  const openReturnModal = (book: PossessionData) => { setReturnBook(book); setIsReturnOpen(true); };
  const closeReturnModal = () => { setIsReturnOpen(false); setReturnBook(null); };
  const handleReturnConfirm = () => {
    setIsReturning(true);
    // TODO: PUT /api/v1/transaction/{id} — path param: transactionId (UUID); body: Map<String,String>
    console.log('Returning:', returnBook?.title);
    setTimeout(() => { setIsReturning(false); closeReturnModal(); }, 1000);
  };

  // ── Pay Fine modal ────────────────────────────────────────────────────────
  const [memberFines, setMemberFines] = useState<FineData[]>(initialMemberFines);
  const [isPayFineOpen, setIsPayFineOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState<FineData | null>(null);
  const [isPayingFine, setIsPayingFine] = useState(false);
  const [finePayConfirmed, setFinePayConfirmed] = useState(false);

  const openPayFineModal = (fine: FineData) => { setSelectedFine(fine); setIsPayFineOpen(true); };
  const closePayFineModal = () => { setIsPayFineOpen(false); setSelectedFine(null); setFinePayConfirmed(false); };
  const handlePayFine = () => {
    setIsPayingFine(true);
    // TODO: PUT /api/v1/fine/{id} — body: { isPaid: true } (Map<String,Boolean>)
    console.log('Paying fine:', selectedFine?.id);
    setTimeout(() => { setIsPayingFine(false); setFinePayConfirmed(true); }, 1000);
  };
  const handleFinePaidDone = () => {
    setMemberFines(prev => prev.filter(f => f.id !== selectedFine?.id));
    closePayFineModal();
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
                <BookDisplay key={book.coverHash} {...book} onReserve={() => openReserveModal(book)} />
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
              <BookDisplay key={book.coverHash} {...book} onReserve={() => openReserveModal(book)} showReserveButton />
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
                  onClick={() => openReturnModal(book)}
                >
                  Return Book
                </Button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Reserve Book Modal ───────────────────────────────────────────── */}
      <Modal isOpen={isReserveOpen} onClose={closeReserveModal} title="Reserve Book">
        {reserveBook && (
          <div className={styles.modalBody}>
            <div className={styles.modalBookPreview}>
              <DynamicBookCover title={reserveBook.coverHash} author="" width="80px" height="112px" showText={false} />
              <div className={styles.modalBookMeta}>
                <p className={styles.modalBookTitle}>{reserveBook.title}</p>
                <p className={styles.modalBookAuthor}>{reserveBook.author}</p>
                {reserveBook.rating && <span className={styles.modalBookRating}>★ {reserveBook.rating}</span>}
              </div>
            </div>
            <div className={styles.modalDivider} />
            <p className={styles.modalHint}>
              Reserving this book will hold an available copy for you. You will be notified when it is ready for pickup.
            </p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={closeReserveModal} disabled={isReserving}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleReserveConfirm} disabled={isReserving}>
                {isReserving ? 'Reserving...' : 'Confirm Reservation'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Return Book Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={isReturnOpen} onClose={closeReturnModal} title="Return Book">
        {returnBook && (
          <div className={styles.modalBody}>
            <div className={styles.modalBookPreview}>
              <DynamicBookCover title={returnBook.coverHash} author="" width="80px" height="112px" showText={false} />
              <div className={styles.modalBookMeta}>
                <p className={styles.modalBookTitle}>{returnBook.title}</p>
                <p className={styles.modalBookAuthor}>{returnBook.author}</p>
                <Badge variant={returnBook.dueVariant} style={{ marginTop: '0.5rem' }}>Due in {returnBook.dueIn}</Badge>
              </div>
            </div>
            <div className={styles.modalDivider} />
            <p className={styles.modalHint}>
              Please ensure the book is in good condition. Any damage may result in a fine being applied to your account.
            </p>
            <div className={styles.modalActions}>
              <Button type="button" variant="ghost" onClick={closeReturnModal} disabled={isReturning}>Cancel</Button>
              <Button type="button" variant="secondary" onClick={handleReturnConfirm} disabled={isReturning}>
                {isReturning ? 'Processing...' : 'Confirm Return'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Pay Fine Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={isPayFineOpen} onClose={closePayFineModal} title={finePayConfirmed ? 'Payment Confirmed' : 'Pay Fine'}>
        {selectedFine && (
          <div className={styles.modalBody}>
            {finePayConfirmed ? (
              <div className={styles.confirmedState}>
                <div className={styles.confirmedIcon}>✓</div>
                <p className={styles.confirmedTitle}>Confirmed</p>
                <p className={styles.confirmedDetail}>₹{selectedFine.amount} paid for <strong>{selectedFine.book}</strong></p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="primary" onClick={handleFinePaidDone}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.fineModalCard}>
                  <div className={styles.fineModalRow}>
                    <span className={styles.fineModalLabel}>Book</span>
                    <span className={styles.fineModalValue}>{selectedFine.book}</span>
                  </div>
                  <div className={styles.fineModalRow}>
                    <span className={styles.fineModalLabel}>Days Overdue</span>
                    <span className={styles.fineModalValueDanger}>{selectedFine.daysOverdue} days</span>
                  </div>
                  <div className={styles.fineModalRow}>
                    <span className={styles.fineModalLabel}>Fine Amount</span>
                    <span className={styles.fineModalValueDanger}>₹{selectedFine.amount}</span>
                  </div>
                </div>
                <p className={styles.modalHint}>Settle this fine to keep your borrowing privileges. No card details needed — a cashier will process this at the counter.</p>
                <div className={styles.modalActions}>
                  <Button type="button" variant="ghost" onClick={closePayFineModal} disabled={isPayingFine}>Cancel</Button>
                  <Button type="button" variant="primary" onClick={handlePayFine} disabled={isPayingFine}>
                    {isPayingFine ? 'Processing...' : 'Confirm Payment'}
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