import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchDropdown, type SearchDropdownOption } from './SearchDropdown';

const meta: Meta<typeof SearchDropdown> = {
  title: 'Atoms/SearchDropdown',
  component: SearchDropdown,
  tags: ['autodocs'],
};

export default meta;

// ── Mock data pools ────────────────────────────────────────────────────────────
const MOCK_BOOKS: SearchDropdownOption[] = [
  { id: 'b1', primary: 'The Pragmatic Programmer', secondary: 'David Thomas, Andrew Hunt' },
  { id: 'b2', primary: 'Clean Code', secondary: 'Robert C. Martin' },
  { id: 'b3', primary: 'Design Patterns', secondary: 'Gang of Four' },
  { id: 'b4', primary: 'You Don\'t Know JS', secondary: 'Kyle Simpson' },
  { id: 'b5', primary: 'The Road to React', secondary: 'Robin Wieruch' },
];

const MOCK_MEMBERS: SearchDropdownOption[] = [
  { id: 'u1', primary: 'Alice Johnson', secondary: 'alice@bookstop.com' },
  { id: 'u2', primary: 'Bob Smith', secondary: 'bob@bookstop.com' },
  { id: 'u3', primary: 'Charlie Brown', secondary: 'charlie@bookstop.com' },
];

/** Simulates a 400ms network search that filters the provided pool. */
function mockSearch(pool: SearchDropdownOption[]) {
  return (query: string): Promise<SearchDropdownOption[]> =>
    new Promise((resolve) =>
      setTimeout(() => {
        resolve(
          pool.filter(
            (o) =>
              o.primary.toLowerCase().includes(query.toLowerCase()) ||
              (o.secondary?.toLowerCase().includes(query.toLowerCase()) ?? false),
          ),
        );
      }, 400),
    );
}

// ── Stateful wrapper ───────────────────────────────────────────────────────────
const SearchDropdownWrapper = ({
  label,
  placeholder,
  pool,
  error,
}: {
  label: string;
  placeholder?: string;
  pool: SearchDropdownOption[];
  error?: string;
}) => {
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<SearchDropdownOption | null>(null);

  return (
    <div style={{ maxWidth: '420px', padding: '1.5rem' }}>
      <SearchDropdown
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(v) => { setValue(v); setSelected(null); }}
        onSelect={(opt) => { setSelected(opt); setValue(`${opt.primary}${opt.secondary ? ` (${opt.secondary})` : ''}`); }}
        search={mockSearch(pool)}
        error={error}
      />
      {selected && (
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#374151' }}>
          Selected ID: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>{selected.id}</code>
        </p>
      )}
    </div>
  );
};

// ── Stories ────────────────────────────────────────────────────────────────────

/** The "Issue Book to Member" modal search used in AdminSearchPage. */
export const MemberSearch: StoryObj = {
  render: () => (
    <SearchDropdownWrapper
      label="Member (optional — leave empty to issue to yourself)"
      placeholder="Type name or email to search members…"
      pool={MOCK_MEMBERS}
    />
  ),
};

/** Book lookup — demonstrates secondary text (author). */
export const BookSearch: StoryObj = {
  render: () => (
    <SearchDropdownWrapper
      label="Book Title"
      placeholder="Type a title or author name…"
      pool={MOCK_BOOKS}
    />
  ),
};

/** Validation error state — shown when member is not found. */
export const WithError: StoryObj = {
  render: () => (
    <SearchDropdownWrapper
      label="Member"
      placeholder="Type name or email…"
      pool={MOCK_MEMBERS}
      error="No member found — please select from the dropdown."
    />
  ),
};
