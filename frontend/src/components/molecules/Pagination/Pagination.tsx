import React, { useMemo } from 'react';
import styles from './Pagination.module.css';

export interface PaginationProps {
  /** Current 1-based page */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total item count */
  totalItems: number;
  /** 0-based start index of items on this page */
  startIndex: number;
  /** 0-based end index (exclusive) */
  endIndex: number;
  /** Called when user selects a page */
  onPageChange: (page: number) => void;
}

/**
 * Build a compact page-number array with ellipses.
 * e.g. [1, '…', 4, 5, 6, '…', 10]
 */
function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '…')[] = [1];

  if (current > 3) pages.push('…');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('…');

  pages.push(total);
  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}) => {
  const pages = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  if (totalPages <= 1) return null; // no pagination needed for single page

  return (
    <div className={styles.paginationBar}>
      {/* Info */}
      <div className={styles.info}>
        Showing{' '}
        <span className={styles.infoBold}>{startIndex + 1}–{endIndex}</span>{' '}
        of <span className={styles.infoBold}>{totalItems}</span>
      </div>

      {/* Page buttons */}
      <div className={styles.pageButtons}>
        {/* Prev */}
        <button
          className={styles.pageBtn}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Number buttons */}
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          className={styles.pageBtn}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Right placeholder (keeps layout balanced) */}
      <div className={styles.perPage} />
    </div>
  );
};
