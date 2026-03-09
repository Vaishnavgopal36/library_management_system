import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Molecules/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};

export default meta;

const PAGE_SIZE = 10;

/** Controlled wrapper — mirrors how every page component wires Pagination. */
const PaginationWrapper = ({ totalItems }: { totalItems: number }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);

  return (
    <div style={{ padding: '1.5rem', minWidth: '500px' }}>
      <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <strong>Page {currentPage}</strong> of {totalPages} — showing items {startIndex + 1}–{endIndex} of {totalItems}
      </p>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

/** Typical book catalog with 3 pages. */
export const FewPages: StoryObj = {
  render: () => <PaginationWrapper totalItems={28} />,
};

/** Large catalog — exercises the ellipsis logic. */
export const ManyPages: StoryObj = {
  render: () => <PaginationWrapper totalItems={247} />,
};

/** Edge-case: only 1 page — Pagination renders nothing. */
export const SinglePage: StoryObj = {
  render: () => <PaginationWrapper totalItems={7} />,
  parameters: { docs: { description: { story: 'Component intentionally renders `null` when `totalPages <= 1`.' } } },
};

/** Middle of a large set — shows neighbour pages around current. */
export const MiddleOfLargeSet: StoryObj = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(6);
    const totalItems = 150;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
    return (
      <div style={{ padding: '1.5rem', minWidth: '500px' }}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
        />
      </div>
    );
  },
};
