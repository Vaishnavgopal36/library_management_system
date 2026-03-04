import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown, DropdownProps } from './Dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'Atoms/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
};

export default meta;

// A wrapper to handle the state inside Storybook
const DropdownWithState = (args: DropdownProps) => {
  const [selectedValue, setSelectedValue] = useState<string | undefined>(args.value);
  return (
    <div style={{ minHeight: '200px', maxWidth: '300px' }}>
      <Dropdown {...args} value={selectedValue} onChange={setSelectedValue} />
    </div>
  );
};

export const SearchCategory: StoryObj<typeof Dropdown> = {
  render: (args) => <DropdownWithState {...args} />,
  args: {
    label: 'Search By',
    placeholder: 'All Categories ▾',
    options: [
      { label: 'All Categories', value: 'all' },
      { label: 'Book Title', value: 'title' },
      { label: 'Author Name', value: 'author' },
      { label: 'ISBN Number', value: 'isbn' },
    ],
  },
};

export const UserRoleSelection: StoryObj<typeof Dropdown> = {
  render: (args) => <DropdownWithState {...args} />,
  args: {
    label: 'Assign User Role',
    placeholder: 'Select role',
    options: [
      { label: 'Member', value: 'ROLE_MEMBER' },
      { label: 'Librarian (Admin)', value: 'ROLE_ADMIN' },
    ],
  },
};

export const PhysicalBookStatus: StoryObj<typeof Dropdown> = {
  render: (args) => <DropdownWithState {...args} />,
  args: {
    label: 'Filter by Status',
    placeholder: 'Any Status',
    options: [
      { label: 'Available on Shelf', value: 'available' },
      { label: 'Currently Borrowed', value: 'borrowed' },
      { label: 'Overdue', value: 'overdue' },
      { label: 'Lost / Maintenance', value: 'lost' },
    ],
  },
};