import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  id: 'atoms-skeleton-component',
  title: 'Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;

export const TextLine: StoryObj<typeof Skeleton> = {
  args: { variant: 'text', width: '80%' },
};

export const ProfileAvatar: StoryObj<typeof Skeleton> = {
  args: { variant: 'circular', width: 64, height: 64 },
};

export const BookCover: StoryObj<typeof Skeleton> = {
  args: { variant: 'rectangular', width: 120, height: 180 },
};

// Composing a full "Book Card" loading state
export const BookCardSimulation: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', maxWidth: '400px' }}>
      <Skeleton variant="rectangular" width={100} height={150} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
        <div style={{ marginTop: '2rem' }}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="rectangular" width={120} height={40} style={{ marginTop: '1rem' }} />
        </div>
      </div>
    </div>
  ),
};
