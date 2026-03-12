import React, { useState, useEffect, useCallback } from 'react';
import { AppRole } from '../../utils/types';
import styles from './AdminSearchPage.module.css';
import { Icon } from '../../components/atoms/Icon';
import { AppShell } from '../../layouts/AppShell/AppShell';
import { Button } from '../../components/atoms/Button/Button';
import { Badge } from '../../components/atoms/Badge/Badge';
import { DynamicBookCover } from '../../components/atoms/DynamicBookCover/DynamicBookCover';
import { Modal } from '../../components/molecules/Modal/Modal';
import { Toast } from '../../components/atoms/Toast/Toast';
import { InputField } from '../../components/atoms/InputField/InputField';
import { Pagination } from '../../components/molecules/Pagination';
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton';
import { SearchDropdown, SearchDropdownOption } from '../../components/atoms/SearchDropdown/SearchDropdown';
import { bookService, type ApiBook, type BookSearchParams } from '../../services/book.service';
import { useBooks } from '../../hooks/useBooks';
import { useDebounce } from '../../hooks/useDebounce';
import { transactionService } from '../../services/transaction.service';
import { reservationService } from '../../services/reservation.service';
import { userService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { truncateTitle } from '../../utils/textUtils';

interface BookFormData {
  title: string;
  isbn: string;
  stockQuantity: string;
  publishDate: string;
  publisherName: string;
  authorNames: string;   // comma-separated
  categoryNames: string; // comma-separated
}

const EMPTY_FORM: BookFormData = { title: '', isbn: '', stockQuantity: '', publishDate: '', publisherName: '', authorNames: '', categoryNames: '' };

const splitComma = (s: string): string[] =>
  s.split(',').map(v => v.trim()).filter(Boolean);

// ── Skeleton ──────────────────────────────────────────────────────────────────
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
        <div className={styles.colCategory}><Skeleton variant="text" width="100px" height="14px" /></div>
        <div className={styles.colStatus}>
          <Skeleton variant="rectangular" width="72px" height="28px" style={{ borderRadius: '50px' }} />
          <Skeleton variant="text" width="110px" height="12px" style={{ marginTop: '0.3rem' }} />
        </div>
        <div className={styles.colAction}><Skeleton variant="rectangular" width="64px" height="34px" style={{ borderRadius: '8px' }} /></div>
      </div>
    ))}
  </div>
);

export interface SearchPageProps {
  role?: AppRole;
}

export const SearchPage: React.FC<SearchPageProps> = ({ role = 'member' }) => {
  const { user } = useAuth();
  const isAdmin = role === 'admin';

  // ── Server-side catalog ──────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 10;
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  /* useDebounce delays API calls by 500ms after the user stops typing */
  const debouncedQuery = useDebounce(searchQuery, 500);
  const [searchBy, setSearchBy] = useState<'title' | 'author' | 'category'>('title');
  const [allCategories, setAllCategories] = useState<string[]>(['All Categories']);
  const [bookFilter, setBookFilter] = useState<'active' | 'inactive'>('active');
  const [isSmartSearch, setIsSmartSearch] = useState(false);

  // Reset to page 0 whenever the debounced query actually changes
  useEffect(() => { setCurrentPage(0); }, [debouncedQuery]);

  const queryParams: BookSearchParams = {
    title: (isSmartSearch || searchBy === 'title') ? debouncedQuery.trim() || undefined : undefined,
    author: (!isSmartSearch && searchBy === 'author') ? debouncedQuery.trim() || undefined : undefined,
    category: (!isSmartSearch && searchBy === 'category') ? (selectedCategory !== 'All Categories' ? selectedCategory : undefined) : undefined,
    archivedOnly: bookFilter === 'inactive' || undefined,
    page: currentPage,
    size: PAGE_SIZE,
    semantic: isSmartSearch || undefined,
  };

  const { books, totalElements, isLoading, refetch } = useBooks(queryParams);

  // Fetch all categories once for the dropdown
  useEffect(() => {
    bookService.search({ size: 800 }).then(p => {
      const cats = Array.from(new Set(p.content.flatMap(b => b.categories.map(c => c.name)))).sort();
      setAllCategories(['All Categories', ...cats]);
    }).catch(console.error);
  }, []);

  const handleSearchByChange = (type: string) => {
    const t = type as 'title' | 'author' | 'category';
    setSearchBy(t);
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setCurrentPage(0);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    // page reset is handled by the useEffect that watches debouncedQuery
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    const zero = page - 1;
    setCurrentPage(zero);
  };

  const handleFilterChange = (filter: 'active' | 'inactive') => {
    setBookFilter(filter);
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + books.length, totalElements);

  // ── Issue modal ──────────────────────────────────────────────────────────
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ApiBook | null>(null);
  const [issueMemberQuery, setIssueMemberQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueError, setIssueError] = useState('');

  const openIssueModal = (book: ApiBook) => {
    setSelectedBook(book); setIssueMemberQuery(''); setSelectedUserId(undefined);
    setIssueError(''); setIsIssueModalOpen(true);
  };
  const closeIssueModal = () => {
    setIsIssueModalOpen(false); setSelectedBook(null);
    setIssueMemberQuery(''); setSelectedUserId(undefined); setIssueError('');
  };

  const searchUsers = useCallback(async (q: string): Promise<SearchDropdownOption[]> => {
    const page = await userService.list({ search: q, size: 8 });
    return page.content.map(u => ({ id: u.id, primary: u.fullName, secondary: u.email }));
  }, []);

  const handleIssueConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true); setIssueError('');
    try {
      let userId = selectedUserId;
      if (!userId && issueMemberQuery.trim()) {
        const res = await userService.list({ search: issueMemberQuery.trim(), size: 1 });
        if (!res.content.length) { setIssueError('No member found — select from the dropdown.'); return; }
        userId = res.content[0].id;
      }
      await transactionService.issue(selectedBook!.id, userId);
      refetch();
      closeIssueModal();
    } catch (err: any) {
      setIssueError(err?.message ?? 'Failed to issue book.');
    } finally { setIsIssuing(false); }
  };

  // ── Edit modal ───────────────────────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBook, setEditBook] = useState<ApiBook | null>(null);
  const [editForm, setEditForm] = useState<BookFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const openEditModal = (book: ApiBook) => {
    setEditBook(book);
    setEditForm({
      title: book.title,
      isbn: book.isbn,
      stockQuantity: String(book.stockQuantity),
      publishDate: book.publishDate ?? '',
      publisherName: book.publisher?.name ?? '',
      authorNames: book.authors.map(a => a.name).join(', '),
      categoryNames: book.categories.map(c => c.name).join(', '),
    });
    setEditError(''); setIsEditModalOpen(true);
  };
  const closeEditModal = () => { setIsEditModalOpen(false); setEditBook(null); setEditError(''); };
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); setEditError('');
    try {
      await bookService.update(editBook!.id, {
        title: editForm.title, isbn: editForm.isbn,
        stockQuantity: Number(editForm.stockQuantity),
        publishDate: editForm.publishDate || undefined,
        publisherName: editForm.publisherName || undefined,
        authorNames: editForm.authorNames ? splitComma(editForm.authorNames) : undefined,
        categoryNames: editForm.categoryNames ? splitComma(editForm.categoryNames) : undefined,
      });
      refetch();
      closeEditModal();
    } catch (err: any) {
      setEditError(err?.message ?? 'Failed to update book.');
    } finally { setIsSaving(false); }
  };

  // ── Delete modal ─────────────────────────────────────────────────────────
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteBook, setDeleteBook] = useState<ApiBook | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const openDeleteModal = (book: ApiBook) => { setDeleteBook(book); setDeleteError(''); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => { setIsDeleteModalOpen(false); setDeleteBook(null); setDeleteError(''); };
  const handleDeleteConfirm = async () => {
    setIsDeleting(true); setDeleteError('');
    try {
      await bookService.archive(deleteBook!.id);
      refetch();
      closeDeleteModal();
    } catch (err: any) {
      setDeleteError(err?.message ?? 'Cannot archive — copies may still be on loan.');
    } finally { setIsDeleting(false); }
  };

  // ── Register modal ───────────────────────────────────────────────────────
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState<BookFormData>(EMPTY_FORM);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const openRegisterModal = () => { setRegisterForm(EMPTY_FORM); setRegisterError(''); setIsRegisterModalOpen(true); };
  const closeRegisterModal = () => { setIsRegisterModalOpen(false); setRegisterError(''); };
  const handleRegisterSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true); setRegisterError('');
    try {
      await bookService.create({
        title: registerForm.title, isbn: registerForm.isbn,
        stockQuantity: Number(registerForm.stockQuantity),
        publishDate: registerForm.publishDate || undefined,
        publisherName: registerForm.publisherName || undefined,
        authorNames: registerForm.authorNames ? splitComma(registerForm.authorNames) : undefined,
        categoryNames: registerForm.categoryNames ? splitComma(registerForm.categoryNames) : undefined,
      });
      setCurrentPage(0);
      refetch();
      closeRegisterModal();
    } catch (err: any) {
      setRegisterError(err?.message ?? 'Failed to register book.');
    } finally { setIsRegistering(false); }
  };

  // ── Reserve modal ────────────────────────────────────────────────────────
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserveBook, setReserveBook] = useState<ApiBook | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveToast, setReserveToast] = useState('');

  const openReserveModal = (book: ApiBook) => { setReserveBook(book); setIsReserveModalOpen(true); };
  const closeReserveModal = () => { setIsReserveModalOpen(false); setReserveBook(null); };
  const handleReserveConfirm = async () => {
    setIsReserving(true);
    try {
      await reservationService.create(reserveBook!.id);
      closeReserveModal();
    } catch (err: any) {
      closeReserveModal();
      setReserveToast(err?.message ?? 'Failed to create reservation.');
    } finally { setIsReserving(false); }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AppShell
      userName={user?.fullName ?? (isAdmin ? 'Admin' : 'Member')}
      activeNavItem="Books"
      role={role}
      searchConfig={{
        placeholder: isSmartSearch
          ? 'Describe a concept, theme, or plot…'
          : (searchBy === 'author' ? 'Search by author name…' : 'Search by book title…'),
        query: searchQuery,
        onQueryChange: handleSearchChange,
        searchTypes: ['title', 'author', 'category'],
        searchType: searchBy,
        onSearchTypeChange: handleSearchByChange,
        categories: allCategories,
        selectedCategory,
        onCategoryChange: handleCategoryChange,
        isSmartSearch: isSmartSearch,
        onSmartSearchToggle: setIsSmartSearch,
      }}
    >
      <div className={styles.pageContainer}>

        {isAdmin && (
          <div className={styles.controlsRow}>
            <Button variant="primary" onClick={openRegisterModal}>+ Register New Asset</Button>
            <div className={styles.pillToggle} role="group" aria-label="Book status filter">
              <button
                type="button"
                className={`${styles.pillSegment} ${bookFilter === 'active' ? styles.pillSegmentActive : ''}`}
                onClick={() => handleFilterChange('active')}
                aria-pressed={bookFilter === 'active'}
              >
                <Icon name="check" size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                Active
              </button>
              <button
                type="button"
                className={`${styles.pillSegment} ${bookFilter === 'inactive' ? styles.pillSegmentInactive : ''}`}
                onClick={() => handleFilterChange('inactive')}
                aria-pressed={bookFilter === 'inactive'}
              >
                <Icon name="archive" size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                Inactive
              </button>
            </div>
          </div>
        )}

        <div className={styles.listHeader}>
          <div className={styles.colBook}>Asset Details</div>
          <div className={styles.colCategory}>Category</div>
          <div className={styles.colStatus}>{isAdmin ? 'Inventory Status' : 'Availability'}</div>
          <div className={styles.colAction}>Actions</div>
        </div>

        {isLoading ? (
          <SkeletonBookRows rows={4} />
        ) : (
          <div className={styles.listContainer}>
            {books.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No books found{searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
              </div>
            ) : (
              <>
                {books.map(book => (
                  <div key={book.id} className={styles.bookRow}>

                    <div className={styles.colBook}>
                      <div className={styles.bookInfoWrapper}>
                        <DynamicBookCover title={book.title} author="" width="96px" height="135px" showText={false} />
                        <div className={styles.bookText}>
                          <h3 className={styles.bookTitle} title={book.title}>{truncateTitle(book.title)}</h3>
                          <p className={styles.bookAuthor}>{book.authors.map(a => a.name).join(', ')}</p>
                          <p className={styles.bookEdition}>{book.isbn}</p>
                        </div>
                      </div>
                    </div>

                    <div className={styles.colCategory}>
                      <span className={styles.categoryText}>{book.categories.map(c => c.name).join(', ') || '—'}</span>
                    </div>

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

                    <div className={styles.colAction}>
                      <div className={styles.actionButtons}>
                        {isAdmin ? (
                          <>
                            {book.isArchived ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  await bookService.unarchive(book);
                                  refetch();
                                }}
                              >
                                Unarchive
                              </Button>
                            ) : (
                              <>
                                <Button variant="primary" size="sm" disabled={book.trueAvailableStock === 0} onClick={() => openIssueModal(book)}>
                                  Issue
                                </Button>
                                <button className={styles.iconButton} aria-label="Edit" onClick={() => openEditModal(book)}>
                                  <Icon name="edit" size={18} stroke="var(--color-text-body)" />
                                </button>
                                <button className={`${styles.iconButton} ${styles.deleteBtn}`} aria-label="Archive" onClick={() => openDeleteModal(book)}>
                                  <Icon name="trash" size={18} />
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={book.trueAvailableStock === 0}
                            onClick={() => book.trueAvailableStock > 0 && openReserveModal(book)}
                          >
                            Reserve
                          </Button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}

                {!isSmartSearch && totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage + 1}
                    totalPages={totalPages}
                    totalItems={totalElements}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Issue Book Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={isIssueModalOpen} onClose={closeIssueModal} title="Issue Book to Member">
        {selectedBook && (
          <form onSubmit={handleIssueConfirm} className={styles.issueForm}>
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
            <SearchDropdown
              label="Member (optional — leave empty to issue to yourself)"
              placeholder="Type name or email to search members…"
              value={issueMemberQuery}
              onChange={(v) => { setIssueMemberQuery(v); if (issueError) setIssueError(''); setSelectedUserId(undefined); }}
              onSelect={(opt) => { setIssueMemberQuery(`${opt.primary} (${opt.secondary})`); setSelectedUserId(opt.id); }}
              search={searchUsers}
              error={issueError}
              autoFocus
            />
            <div className={styles.issueActions}>
              <Button type="button" variant="ghost" onClick={closeIssueModal} disabled={isIssuing}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isIssuing}>{isIssuing ? 'Issuing...' : 'Confirm Issue'}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── Edit Book Modal ───────────────────────────────────────────────── */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Book Details">
        {editBook && (
          <form onSubmit={handleEditSave} className={styles.issueForm}>
            {editError && <p style={{ color: 'var(--color-danger-600)', fontSize: '0.875rem', margin: 0 }}>{editError}</p>}
            <div className={styles.formRow}>
              <InputField label="Title *" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} required />
              <InputField label="ISBN *" placeholder="e.g. 9780321965516" value={editForm.isbn} onChange={e => setEditForm(p => ({ ...p, isbn: e.target.value }))} required />
            </div>
            <div className={styles.formRow}>
              <InputField label="Stock Quantity *" type="number" placeholder="e.g. 5" value={editForm.stockQuantity} onChange={e => setEditForm(p => ({ ...p, stockQuantity: e.target.value }))} required />
              <InputField label="Publish Date" placeholder="YYYY-MM-DD" value={editForm.publishDate} onChange={e => setEditForm(p => ({ ...p, publishDate: e.target.value }))} />
            </div>
            <InputField label="Publisher" placeholder="e.g. Penguin Books" value={editForm.publisherName} onChange={e => setEditForm(p => ({ ...p, publisherName: e.target.value }))} />
            <InputField label="Author(s)" placeholder="e.g. J.K. Rowling, George Orwell" hint="Separate multiple authors with a comma" value={editForm.authorNames} onChange={e => setEditForm(p => ({ ...p, authorNames: e.target.value }))} />
            <InputField label="Genre / Categories" placeholder="e.g. Fiction, Mystery" hint="Separate multiple categories with a comma" value={editForm.categoryNames} onChange={e => setEditForm(p => ({ ...p, categoryNames: e.target.value }))} />
            <div className={styles.issueDivider} />
            <div className={styles.issueActions}>
              <Button type="button" variant="ghost" onClick={closeEditModal} disabled={isSaving}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── Archive Confirmation Modal ────────────────────────────────────── */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Archive Book">
        {deleteBook && (
          <div className={styles.issueForm}>
            {deleteError && <p style={{ color: 'var(--color-danger-600)', fontSize: '0.875rem', margin: 0 }}>{deleteError}</p>}
            <div className={styles.deleteWarning}>
              <div className={styles.deleteIcon}>
                <Icon name="alert-triangle" size={28} stroke="var(--color-danger-600)" />
              </div>
              <p className={styles.deleteWarningText}>
                Archive <strong>"{deleteBook.title}"</strong>?{' '}
                It has <strong>{deleteBook.stockQuantity} total copies</strong> in inventory. Books with active loans cannot be archived.
              </p>
              <p className={styles.deleteWarningSubtext}>Archived books will not appear in member searches.</p>
            </div>
            <div className={styles.issueActions}>
              <Button type="button" variant="ghost" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</Button>
              <Button type="button" variant="danger" onClick={handleDeleteConfirm} disabled={isDeleting}>{isDeleting ? 'Archiving...' : 'Yes, Archive'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Register New Asset Modal ──────────────────────────────────────── */}
      <Modal isOpen={isRegisterModalOpen} onClose={closeRegisterModal} title="Register New Asset">
        <form onSubmit={handleRegisterSave} className={styles.issueForm}>
          {registerError && <p style={{ color: 'var(--color-danger-600)', fontSize: '0.875rem', margin: 0 }}>{registerError}</p>}
          <div className={styles.formRow}>
            <InputField label="Title *" placeholder="Book title" value={registerForm.title} onChange={e => setRegisterForm(p => ({ ...p, title: e.target.value }))} required autoFocus />
            <InputField label="ISBN *" placeholder="e.g. 9780321965516" value={registerForm.isbn} onChange={e => setRegisterForm(p => ({ ...p, isbn: e.target.value }))} required />
          </div>
          <div className={styles.formRow}>
            <InputField label="Stock Quantity *" type="number" placeholder="e.g. 5" value={registerForm.stockQuantity} onChange={e => setRegisterForm(p => ({ ...p, stockQuantity: e.target.value }))} required />
            <InputField label="Publish Date" placeholder="YYYY-MM-DD" value={registerForm.publishDate} onChange={e => setRegisterForm(p => ({ ...p, publishDate: e.target.value }))} />
          </div>
          <InputField label="Publisher" placeholder="e.g. Penguin Books" value={registerForm.publisherName} onChange={e => setRegisterForm(p => ({ ...p, publisherName: e.target.value }))} />
          <InputField label="Author(s)" placeholder="e.g. J.K. Rowling, George Orwell" hint="Separate multiple authors with a comma" value={registerForm.authorNames} onChange={e => setRegisterForm(p => ({ ...p, authorNames: e.target.value }))} />
          <InputField label="Genre / Categories" placeholder="e.g. Fiction, Mystery" hint="Separate multiple categories with a comma" value={registerForm.categoryNames} onChange={e => setRegisterForm(p => ({ ...p, categoryNames: e.target.value }))} />
          <div className={styles.issueDivider} />
          <div className={styles.issueActions}>
            <Button type="button" variant="ghost" onClick={closeRegisterModal} disabled={isRegistering}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isRegistering}>{isRegistering ? 'Registering...' : 'Register Asset'}</Button>
          </div>
        </form>
      </Modal>

      {/* ─── Reserve Book Modal (member) ───────────────────────────────────── */}
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
              Reserving will hold a copy for you. You'll be notified when it's ready for pickup.
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

      {reserveToast && (
        <Toast
          message={reserveToast}
          variant="error"
          onClose={() => setReserveToast('')}
        />
      )}

    </AppShell>
  );
};

/** @deprecated Use SearchPage with role="admin" instead */
export const AdminSearchPage = () => <SearchPage role="admin" />;
