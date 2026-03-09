import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Topbar } from './Topbar';

const meta: Meta<typeof Topbar> = {
  title: 'Layouts/Topbar',
  component: Topbar,
  parameters: {
    layout: 'fullscreen',
  },
  // Topbar calls useNavigate() — must be inside a router.
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

export const MemberDefault: StoryObj<typeof Topbar> = {
  args: {
    userName: 'Kenson',
    role: 'member',
  },
};

export const AdminDefault: StoryObj<typeof Topbar> = {
  args: {
    userName: 'Admin User',
    role: 'admin',
  },
};

export const WithSearchBar: StoryObj<typeof Topbar> = {
  args: {
    userName: 'Kenson',
    role: 'member',
    searchConfig: {
      query: '',
      onQueryChange: () => {},
      placeholder: 'Search by book title…',
      searchTypes: ['title', 'author', 'category'],
      searchType: 'title',
      onSearchTypeChange: () => {},
      categories: ['All Categories', 'Fiction', 'Science', 'History'],
      selectedCategory: 'All Categories',
      onCategoryChange: () => {},
    },
  },
};

export const WithCategoryActive: StoryObj<typeof Topbar> = {
  args: {
    userName: 'Kenson',
    role: 'member',
    searchConfig: {
      query: '',
      onQueryChange: () => {},
      placeholder: 'Search by category…',
      searchTypes: ['title', 'author', 'category'],
      searchType: 'category',
      onSearchTypeChange: () => {},
      categories: ['All Categories', 'Fiction', 'Science', 'History'],
      selectedCategory: 'Fiction',
      onCategoryChange: () => {},
    },
  },
};