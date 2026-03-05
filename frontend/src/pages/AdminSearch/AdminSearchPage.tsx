import React, { useState } from 'react';
import { AppRole } from '../../utils/types';
import { useMockDelay } from '../../hooks/useMockDelay';
import styles from './AdminSearchPage.module.css';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Button } from '../../components/atoms/Button/Button';
import { Badge } from '../../components/atoms/Badge/Badge';
import { DynamicBookCover } from '../../components/atoms/DynamicBookCover/DynamicBookCover';
import { Modal } from '../../components/molecules/Modal/Modal';
import { InputField } from '../../components/atoms/InputField/InputField';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';

// ── API response sub-types (matching BookResponse from Swagger) ───────────────
interface BookAuthor   { id: string; name: string; }
interface BookCategory { id: string; name: string; }
interface BookPublisher { id: string; name: string; }

// CatalogBook matches API BookResponse
interface CatalogBook {
  id: string;                    // UUID
  title: string;
  isbn: string;
  stockQuantity: number;         // total copies in library
  trueAvailableStock: number;    // copies not currently on loan
  isArchived: boolean;
  publisher?: BookPublisher;
  authors: BookAuthor[];
  categories: BookCategory[];
}

// BookFormData matches API BookRequest (used in create / update forms)
interface BookFormData {
  title: string;
  isbn: string;          // required in BookRequest
  stockQuantity: string; // string for <input>, parsed before submitting
  publishDate: string;
  publisherId: string;   // UUID — optional
}

// Mock catalog with BookResponse field shapes
const mockCatalog: CatalogBook[] = [
  {
    id: 'bk-0001',
    title: "Don't Make Me Think",
    isbn: '9780321965516',
    stockQuantity: 5,
    trueAvailableStock: 3,
    isArchived: false,
    publisher: { id: 'pub-001', name: 'New Riders' },
    authors:    [{ id: 'auth-001', name: 'Steve Krug' }],
    categories: [{ id: 'cat-001', name: 'UX Design' }],
  },
  {
    id: 'bk-0002',
    title: 'The Design of Everyday Things',
    isbn: '9780465050659',
    stockQuantity: 4,
    trueAvailableStock: 0,
    isArchived: false,
    publisher: { id: 'pub-002', name: 'Basic Books' },
    authors:    [{ id: 'auth-002', name: 'Don Norman' }],
    categories: [{ id: 'cat-001', name: 'UX Design' }],
  },
  {
    id: 'bk-0003',
    title: 'Rich Dad Poor Dad',
    isbn: '9781612680194',
    stockQuantity: 2,
    trueAvailableStock: 1,
    isArchived: false,
    publisher: { id: 'pub-003', name: 'Warner Books' },
    authors:    [{ id: 'auth-003', name: 'Robert T. Kiyosaki' }],
    categories: [{ id: 'cat-002', name: 'Personal Finance' }],
  },
];

export interface SearchPageProps {
  role?: AppRole;
}

// ── Skeleton placeholder for catalog list ──────────────────────────────────
const SkeletonBookRows: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className={styles.listContainer}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={styles.bookRow} style={{ pointerEvents: 'none' }}>
        <div className={styles.colBook}>
          <div className={styles.bookInfoWrapper}>
            <Skeleton variant="rectangular" width="96px" height="135px" style={{ borderRadius: '8px', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton variant="text" width="160px" height="16px" />
              <Skeleton variant="text" width="110px" height="13px" />
              <Skeleton variant="text" width="90px" height="12px" />
            </div>
          </div>
        </div>
        <div className={styles.colCategory}>
          <Skeleton variant="text" width="100px" height="14px" />
          <Skeleton variant="text" width="70px" height="12px" style={{ marginTop: '0.3rem' }} />
        </div>
        <div className={styles.colStatus}>
          <Skeleton variant="rectangular" width="72px" height="28px" style={{ borderRadius: '50px' }} />
          <Skeleton variant="text" width="110px" height="12px" style={{ marginTop: '0.3rem' }} />
        </div>
        <div className={styles.colAction}>
          <Skeleton variant="rectangular" width="64px" height="34px" style={{ borderRadius: '8px' }} />
        </div>
      </div>
    ))}
  </div>
);

export const SearchPage: React.FC<SearchPageProps> = ({ role = 'member' }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = role === 'admin';

  // ── Simulate loading (TODO: replace with actual API call to GET /api/v1/book) ──
  // params: title, author, category, isbn, bookId (UUID), page (0-based), size (20)
  //          → returns PageBookResponse { content: BookResponse[], totalElements, ... }
  const isLoading = useMockDelay();

  // Derive unique categories from catalog
  const categories = ['All Categories', ...Array.from(new Set(mockCatalog.flatMap(b => b.categories.map(c => c.name))))];

  // Filter books by category and search query
  const filteredCatalog = mockCatalog.filter(book => {
    const matchesCategory =
      selectedCategory === 'All Categories' ||
      book.categories.some(c => c.name === selectedCategory);
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      book.title.toLowerCase().includes(query) ||
      book.authors.some(a => a.name.toLowerCase().includes(query)) ||
      book.isbn.includes(query) ||
      book.categories.some(c => c.name.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  // Issue modal state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<CatalogBook | null>(null);
  const [issueUserId, setIssueUserId] = useState(''); // UUID — optional; omit to issue to logged-in user
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueError, setIssueError] = useState('');

  const openIssueModal = (book: CatalogBook) => {
    setSelectedBook(book);
    setIssueUserId('');
    setIssueError('');
    setIsIssueModalOpen(true);
  };

  const closeIssueModal = () => {
    setIsIssueModalOpen(false);
    setSelectedBook(null);
    setIssueUserId('');
    setIssueError('');
  };

  const handleIssueConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    // userId is optional — if empty, the backend issues to the currently authenticated user
    setIsIssuing(true);
    // TODO: POST /api/v1/transaction — body: TransactionRequest { bookId (UUID, required), userId (UUID, optional) }
    console.log(`Issuing "${selectedBook?.title}" (bookId: ${selectedBook?.id}) to userId: ${issueUserId || '(logged-in user)'}`);
    setTimeout(() => { setIsIssuing(false); closeIssueModal(); }, 1200);
  };

  // ── Edit Book ────────────────────────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBook, setEditBook] = useState<CatalogBook | null>(null);
  const [editForm, setEditForm] = useState<BookFormData>({ title: '', isbn: '', stockQuantity: '', publishDate: '', publisherId: '' });
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = (book: CatalogBook) => {
    setEditBook(book);
    setEditForm({ title: book.title, isbn: book.isbn, stockQuantity: String(book.stockQuantity), publishDate: '', publisherId: book.publisher?.id ?? '' });
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => { setIsEditModalOpen(false); setEditBook(null); };
  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: PUT /api/v1/book/{id} — body: BookRequest { title*, isbn*, stockQuantity*(int ≥ 0), publishDate?, publisherId?(UUID) }
    console.log('Updating book:', { id: editBook?.id, ...editForm });
    setTimeout(() => { setIsSaving(false); closeEditModal(); }, 1000);
  };

  // ── Delete Book ──────────────────────────────────────────────────────────
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteBook, setDeleteBook] = useState<CatalogBook | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = (book: CatalogBook) => { setDeleteBook(book); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => { setIsDeleteModalOpen(false); setDeleteBook(null); };
  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    // TODO: DELETE /api/v1/book/{id} — soft-deletes (archives) the book (isArchived: true); fails if copies are currently on loan
    console.log('Archiving book:', deleteBook?.id);
    setTimeout(() => { setIsDeleting(false); closeDeleteModal(); }, 1000);
  };

  // ── Register New Asset ───────────────────────────────────────────────────
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState<BookFormData>({ title: '', isbn: '', stockQuantity: '', publishDate: '', publisherId: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  const openRegisterModal = () => {
    setRegisterForm({ title: '', isbn: '', stockQuantity: '', publishDate: '', publisherId: '' });
    setIsRegisterModalOpen(true);
  };
  const closeRegisterModal = () => setIsRegisterModalOpen(false);
  const handleRegisterSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    // TODO: POST /api/v1/book — body: BookRequest { title*, isbn*, stockQuantity*(int ≥ 0), publishDate?, publisherId?(UUID) }
    console.log('Registering new book:', registerForm);
    setTimeout(() => { setIsRegistering(false); closeRegisterModal(); }, 1000);
  };

  // ── Reserve Book (member role) ────────────────────────────────────────────
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserveBook, setReserveBook] = useState<CatalogBook | null>(null);
  const [isReserving, setIsReserving] = useState(false);

  const openReserveModal = (book: CatalogBook) => { setReserveBook(book); setIsReserveModalOpen(true); };
  const closeReserveModal = () => { setIsReserveModalOpen(false); setReserveBook(null); };
  const handleReserveConfirm = () => {
    setIsReserving(true);
    // TODO: POST /api/v1/reservation — body: ReservationRequest { bookId (UUID, required), userId (UUID, optional) }
    console.log('Reserving:', reserveBook?.title, '| bookId:', reserveBook?.id);
    setTimeout(() => { setIsReserving(false); closeReserveModal(); }, 1200);
  };

  return (
    <AppShell
      userName={isAdmin ? 'System Admin' : 'Member'}
      activeNavItem="Search"
      role={role}
      searchConfig={{
        placeholder: 'Search books by title, author or category…',
        query: searchQuery,
        onQueryChange: setSearchQuery,
        showCategoryDropdown: true,
        categories,
        selectedCategory,
        onCategoryChange: setSelectedCategory,
      }}
    >
      <div className={styles.pageContainer}>

        {/* Top Controls: Add Book button (admin only); search/filter lives in the Topbar */}
        {isAdmin && (
          <div className={styles.controlsRow}>
            <Button variant="primary" onClick={openRegisterModal}>+ Register New Asset</Button>
          </div>
        )}

        {/* List Header Titles */}
        <div className={styles.listHeader}>
          <div className={styles.colBook}>Asset Details</div>
          <div className={styles.colCategory}>Category</div>
          <div className={styles.colStatus}>{isAdmin ? 'Inventory Status' : 'Availability'}</div>
          <div className={styles.colAction}>Actions</div>
        </div>

        {/* Catalog List */}
        {isLoading ? (
          <SkeletonBookRows rows={4} />
        ) : (
        <div className={styles.listContainer}>
          {filteredCatalog.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No books found matching your search.</p>
            </div>
          ) : (
          filteredCatalog.map((book) => (
            <div key={book.id} className={styles.bookRow}>
              
              {/* Column 1: Book Info */}
              <div className={styles.colBook}>
                <div className={styles.bookInfoWrapper}>
                  {/* Dynamic Cover strictly showing Title only */}
                  <DynamicBookCover title={book.title} author="" width="96px" height="135px" showText={false} />
                  <div className={styles.bookText}>
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>{book.authors.map(a => a.name).join(', ')}</p>
                    <p className={styles.bookEdition}>{book.isbn}</p>
                  </div>
                </div>
              </div>

              {/* Column 2: Category */}
              <div className={styles.colCategory}>
                <span className={styles.categoryText}>{book.categories.map(c => c.name).join(', ')}</span>
              </div>

              {/* Column 3: Status & Stock */}
              <div className={styles.colStatus}>
                <Badge variant={book.trueAvailableStock > 0 ? 'success' : 'warning'} style={{ padding: '0.35rem 0.75rem' }}>
                  {book.trueAvailableStock > 0 ? 'In-Shelf' : 'Borrowed'}
                </Badge>
                <span className={styles.stockText}>
                  {isAdmin
                    ? `${book.trueAvailableStock} / ${book.stockQuantity} Copies Available`
                    : book.trueAvailableStock > 0 ? `${book.trueAvailableStock} Available` : 'Not Available'}
                </span>
              </div>

              {/* Column 4: Actions (role-aware) */}
              <div className={styles.colAction}>
                <div className={styles.actionButtons}>
                  {isAdmin ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={book.trueAvailableStock === 0}
                        onClick={() => openIssueModal(book)}
                      >Issue</Button>
                      
                      {/* Edit Icon Button */}
                      <button className={styles.iconButton} aria-label="Edit" onClick={() => openEditModal(book)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      
                      {/* Delete Icon Button */}
                      <button className={`${styles.iconButton} ${styles.deleteBtn}`} aria-label="Delete" onClick={() => openDeleteModal(book)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={book.trueAvailableStock === 0}
                        onClick={() => book.trueAvailableStock > 0 && openReserveModal(book)}
                      >Reserve</Button>
                    </>
                  )}
                </div>
              </div>

            </div>
          ))
          )}
        </div>
        )}

      </div>

      {/* ── Edit Book Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Book Details">
        {editBook && (
          <form onSubmit={handleEditSave} className={styles.issueForm}>
            <div className={styles.formRow}>
              <InputField label="Title *" value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} required />
              <InputField label="ISBN *" placeholder="e.g. 9780321965516" value={editForm.isbn} onChange={(e) => setEditForm(p => ({ ...p, isbn: e.target.value }))} required />
            </div>
            <div className={styles.formRow}>
              <InputField label="Stock Quantity *" type="number" placeholder="e.g. 5" value={editForm.stockQuantity} onChange={(e) => setEditForm(p => ({ ...p, stockQuantity: e.target.value }))} required />
              <InputField label="Publish Date" placeholder="e.g. 2024-01-01" value={editForm.publishDate} onChange={(e) => setEditForm(p => ({ ...p, publishDate: e.target.value }))} />
            </div>
            <div className={styles.formRow}>
              <InputField label="Publisher ID (UUID)" placeholder="e.g. pub-0001-0001-0001" value={editForm.publisherId} onChange={(e) => setEditForm(p => ({ ...p, publisherId: e.target.value }))} />
            </div>
            <div className={styles.issueDivider} />
            <div className={styles.issueActions}>
              <Button type="button" variant="ghost" onClick={closeEditModal} disabled={isSaving}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Delete Book">
        {deleteBook && (
          <div className={styles.issueForm}>
            <div className={styles.deleteWarning}>
              <div className={styles.deleteIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <p className={styles.deleteWarningText}>
                Are you sure you want to permanently delete <strong>"{deleteBook.title}"</strong>? This will remove all <strong>{deleteBook.totalCopies} copies</strong> from the inventory.
              </p>
              <p className={styles.deleteWarningSubtext}>This action cannot be undone.</p>
            </div>
            <div className={styles.issueActions}>
              <Button type="button" variant="ghost" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</Button>
              <Button type="button" variant="danger" onClick={handleDeleteConfirm} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Register New Asset Modal ──────────────────────────────────────── */}
      <Modal isOpen={isRegisterModalOpen} onClose={closeRegisterModal} title="Register New Asset">
        <form onSubmit={handleRegisterSave} className={styles.issueForm}>
          <div className={styles.formRow}>
            <InputField label="Title *" placeholder="Book title" value={registerForm.title} onChange={(e) => setRegisterForm(p => ({ ...p, title: e.target.value }))} required autoFocus />
            <InputField label="ISBN *" placeholder="e.g. 9780321965516" value={registerForm.isbn} onChange={(e) => setRegisterForm(p => ({ ...p, isbn: e.target.value }))} required />
          </div>
          <div className={styles.formRow}>
            <InputField label="Stock Quantity *" type="number" placeholder="e.g. 5" value={registerForm.stockQuantity} onChange={(e) => setRegisterForm(p => ({ ...p, stockQuantity: e.target.value }))} required />
            <InputField label="Publish Date" placeholder="e.g. 2024-01-01" value={registerForm.publishDate} onChange={(e) => setRegisterForm(p => ({ ...p, publishDate: e.target.value }))} />
          </div>
          <div className={styles.formRow}>
            <InputField label="Publisher ID (UUID)" placeholder="e.g. pub-0001-0001-0001" value={registerForm.publisherId} onChange={(e) => setRegisterForm(p => ({ ...p, publisherId: e.target.value }))} />
          </div>
          <div className={styles.issueDivider} />
          <div className={styles.issueActions}>
            <Button type="button" variant="ghost" onClick={closeRegisterModal} disabled={isRegistering}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isRegistering}>{isRegistering ? 'Registering...' : 'Register Asset'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Reserve Book Modal (member role) ──────────────────────────────── */}
      <Modal isOpen={isReserveModalOpen} onClose={closeReserveModal} title="Reserve Book">
        {reserveBook && (
          <div className={styles.issueForm}>
            <div className={styles.issueBookPreview}>
              <DynamicBookCover title={reserveBook.title} author="" width="72px" height="100px" showText={false} />
              <div className={styles.issueBookMeta}>
                <p className={styles.issueBookTitle}>{reserveBook.title}</p>
                <p className={styles.issueBookAuthor}>{reserveBook.authors.map(a => a.name).join(', ')}</p>
                <p className={styles.issueBookEdition}>ISBN: {reserveBook.isbn}</p>
                <Badge variant="success" style={{ marginTop: '0.5rem' }}>
                  {reserveBook.trueAvailableStock} {reserveBook.trueAvailableStock === 1 ? 'copy' : 'copies'} available
                </Badge>
              </div>
            </div>
            <div className={styles.issueDivider} />
            <p className={styles.reserveHint}>
              This will hold a copy for you. You will be notified when it is ready for pickup at the library.
            </p>
            <div className={styles.issueActions}>
              <Button type="button" variant="ghost" onClick={closeReserveModal} disabled={isReserving}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleReserveConfirm} disabled={isReserving}>
                {isReserving ? 'Reserving...' : 'Confirm Reservation'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Issue Book Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={closeIssueModal}
        title="Issue Book to Member"
      >
        {selectedBook && (
          <form onSubmit={handleIssueConfirm} className={styles.issueForm}>

            {/* Book preview strip */}
            <div className={styles.issueBookPreview}>
              <DynamicBookCover title={selectedBook.title} author="" width="72px" height="100px" showText={false} />
              <div className={styles.issueBookMeta}>
                <p className={styles.issueBookTitle}>{selectedBook.title}</p>
                <p className={styles.issueBookAuthor}>{selectedBook.authors.map(a => a.name).join(', ')}</p>
                <p className={styles.issueBookEdition}>ISBN: {selectedBook.isbn}</p>
                <Badge variant="success" style={{ marginTop: '0.5rem' }}>
                  {selectedBook.trueAvailableStock} / {selectedBook.stockQuantity} Available
                </Badge>
              </div>
            </div>

            <div className={styles.issueDivider} />

            {/* Member User ID input (optional — leave empty to issue to logged-in user) */}
            <InputField
              label="Member User ID (UUID, optional)"
              placeholder="e.g. usr-0001-0001-0001 — leave empty to issue to logged-in user"
              value={issueUserId}
              onChange={(e) => {
                setIssueUserId(e.target.value);
                if (issueError) setIssueError('');
              }}
              error={issueError}
              autoFocus
            />

            {/* Action row */}
            <div className={styles.issueActions}>
              <Button type="button" variant="ghost" onClick={closeIssueModal} disabled={isIssuing}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isIssuing}>
                {isIssuing ? 'Issuing...' : 'Confirm Issue'}
              </Button>
            </div>

          </form>
        )}
      </Modal>

    </AppShell>
  );
};

/** @deprecated Use SearchPage with role="admin" instead */
export const AdminSearchPage = () => <SearchPage role="admin" />;