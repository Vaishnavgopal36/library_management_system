import { api, qs, Page } from './api';

// ── API response shapes (matching BookResponse.java) ─────────────────────────
export interface ApiAuthor     { id: string; name: string; }
export interface ApiCategory   { id: string; name: string; }
export interface ApiPublisher  { id: string; name: string; }

export interface ApiBook {
  id: string;
  title: string;
  isbn: string;
  publishDate?: string;
  stockQuantity: number;
  trueAvailableStock: number;
  isArchived: boolean;
  publisher: ApiPublisher | null;
  authors: ApiAuthor[];
  categories: ApiCategory[];
}

// ── Search params (all name-based — UUID never entered by user) ───────────────
export interface BookSearchParams {
  title?: string;
  author?: string;
  category?: string;
  isbn?: string;
  includeArchived?: boolean;
  archivedOnly?: boolean;
  page?: number;
  size?: number;
  semantic?: boolean;
}

// ── Book request (admin create/update) ───────────────────────────────────────
export interface BookCreateRequest {
  title: string;
  isbn: string;
  stockQuantity: number;
  publishDate?: string;       // YYYY-MM-DD
  publisherName?: string;     // find-or-create on backend
  authorNames?: string[];     // find-or-create on backend, multiple allowed
  categoryNames?: string[];   // find-or-create on backend, multiple allowed
  isArchived?: boolean;       // sent on update to toggle archive status
}

// ── Book service ──────────────────────────────────────────────────────────────
export const bookService = {
  /**
   * GET /book — public, no auth needed.
   * Returns a Spring Page<BookResponse>.
   * Search is always by title / author / category name (not UUIDs).
   */
  async search(params: BookSearchParams = {}): Promise<Page<ApiBook>> {
    const query = qs({
      title:          params.title,
      author:         params.author,
      category:       params.category,
      isbn:           params.isbn,
      includeArchived: params.includeArchived ? 'true' : undefined,
      archivedOnly:   params.archivedOnly ? 'true' : undefined,
      page:           params.page ?? 0,
      size:           params.size ?? 20,
      semantic:       params.semantic ? 'true' : undefined,
    });
    return api.get<Page<ApiBook>>(`/book${query}`, false);
  },

  /**
   * Convenience: returns all books matching a title string (page size 50).
   * Used internally when a form needs to resolve a title → UUID.
   */
  async findByTitle(title: string): Promise<ApiBook[]> {
    const page = await bookService.search({ title, size: 50 });
    return page.content;
  },

  /** GET /book?bookId={id} — fetch a specific book by its internal UUID */
  async getById(id: string): Promise<ApiBook | null> {
    const page = await api.get<Page<ApiBook>>(`/book?bookId=${id}`, false);
    return page.content[0] ?? null;
  },

  /** POST /book — admin only */
  async create(req: BookCreateRequest): Promise<ApiBook> {
    return api.post<ApiBook>('/book', req);
  },

  /** PUT /book/{id} — admin only. ID obtained from search results, never typed. */
  async update(id: string, req: BookCreateRequest): Promise<ApiBook> {
    return api.put<ApiBook>(`/book/${id}`, req);
  },

  /** DELETE /book/{id} — admin archive */
  async archive(id: string): Promise<void> {
    return api.delete(`/book/${id}`);
  },

  /** PUT /book/{id} with isArchived:false — admin unarchive (reuses existing update endpoint). */
  async unarchive(book: ApiBook): Promise<void> {
    await api.put<ApiBook>(`/book/${book.id}`, {
      title: book.title,
      isbn: book.isbn,
      stockQuantity: book.stockQuantity,
      publishDate: book.publishDate,
      publisherName: book.publisher?.name,
      authorNames: book.authors.map((a) => a.name),
      categoryNames: book.categories.map((c) => c.name),
      isArchived: false,
    });
  },

  /** GET /book/recommended?userId={id} — personalised recommendations based on borrowing history. */
  getRecommendations(userId: string): Promise<ApiBook[]> {
    return api.get<ApiBook[]>(`/book/recommended?userId=${userId}`, false);
  },
};
