import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { bookService, type ApiBook, type BookSearchParams } from '../services/book.service';

export interface UseBooksResult {
  books: ApiBook[];
  totalElements: number;
  /**
   * True only on the very first fetch (no cached data yet).
   * Maps directly to <SkeletonBookRows /> in the consuming component.
   */
  isLoading: boolean;
  /** True on every background/pagination refetch — use for subtle loading cues. */
  isFetching: boolean;
  refetch: () => void;
}

/**
 * Custom hook that wraps React Query's `useQuery` for the book catalog.
 *
 * - Query key includes every search parameter so that any param change
 *   automatically triggers a fresh fetch without manual effect wiring.
 * - `keepPreviousData` (placeholderData) keeps the last page's rows visible
 *   while the next page loads, eliminating layout shifts on pagination.
 * - `staleTime: 30_000` means the same query won't re-hit the API for 30s,
 *   providing a shared client-side cache across components.
 */
export function useBooks(params: BookSearchParams = {}): UseBooksResult {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      'books',
      params.title,
      params.author,
      params.category,
      params.isbn,
      params.includeArchived,
      params.archivedOnly,
      params.page,
      params.size,
    ],
    queryFn: () => bookService.search(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  return {
    books: data?.content ?? [],
    totalElements: data?.totalElements ?? 0,
    isLoading,
    isFetching,
    refetch,
  };
}
