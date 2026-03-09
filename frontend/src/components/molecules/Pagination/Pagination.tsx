import React, { useMemo } from 'react';
import { Icon } from "../../atoms/Icon";
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
          <Icon name="chevron-left" size={14} strokeWidth={2.5} />
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
          <Icon name="chevron-right" size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right placeholder (keeps layout balanced) */}
      <div className={styles.perPage} />
    </div>
  );
};
