import { useMemo, useState, useCallback, useEffect } from 'react';

export interface UsePaginationOptions {
  /** Items per page (default: 8) */
  pageSize?: number;
}

export interface UsePaginationResult<T> {
  /** Current 1-based page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Slice of data for the current page */
  pageData: T[];
  /** Total item count (= data.length) */
  totalItems: number;
  /** Jump to a specific page */
  setPage: (page: number) => void;
  /** Go to next page (no-op on last) */
  nextPage: () => void;
  /** Go to previous page (no-op on first) */
  prevPage: () => void;
  /** 0-based index of first item on current page */
  startIndex: number;
  /** 0-based index of last item on current page (exclusive) */
  endIndex: number;
}

/**
 * Generic pagination hook.
 * Pass the full filtered dataset; it returns the slice for the current page.
 * Automatically resets to page 1 when data length changes (e.g. after filtering).
 */
export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {},
): UsePaginationResult<T> {
  const { pageSize = 8 } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  // Reset to page 1 when the dataset changes (filter/search applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  // Clamp page if it exceeds totalPages (e.g. after deletion)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, data.length);

  const pageData = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex],
  );

  const setPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
    },
    [totalPages],
  );

  const nextPage = useCallback(() => setPage(currentPage + 1), [setPage, currentPage]);
  const prevPage = useCallback(() => setPage(currentPage - 1), [setPage, currentPage]);

  return {
    currentPage,
    totalPages,
    pageData,
    totalItems: data.length,
    setPage,
    nextPage,
    prevPage,
    startIndex,
    endIndex,
  };
}
