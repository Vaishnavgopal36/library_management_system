import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const AvailableBook: Story = {
  args: {
    variant: 'success',
    children: 'Available',
  },
};

export const BorrowedBook: Story = {
  args: {
    variant: 'warning',
    children: 'Borrowed',
  },
};

export const OverdueBook: Story = {
  args: {
    variant: 'error',
    children: 'Overdue',
  },
};

export const AdminUser: Story = {
  args: {
    variant: 'info',
    children: 'Admin',
  },
};

export const MemberUser: Story = {
  args: {
    variant: 'neutral',
    children: 'Member',
  },
};