import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DynamicBookCover } from './DynamicBookCover';

const meta: Meta<typeof DynamicBookCover> = {
  title: 'Atoms/DynamicBookCover',
  component: DynamicBookCover,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'text' },
    height: { control: 'text' },
  },
};

export default meta;

// 1. A standard single book cover
export const Default: StoryObj<typeof DynamicBookCover> = {
  args: {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas, Andrew Hunt',
  },
};

// 2. Testing how it handles very long titles (CSS Line Clamping)
export const LongTitle: StoryObj<typeof DynamicBookCover> = {
  args: {
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm',
  },
};

// 3. Testing custom dimensions
export const CustomSize: StoryObj<typeof DynamicBookCover> = {
  args: {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    width: '200px',
    height: '280px',
  },
};

// 4. A gallery showing the deterministic gradients in action
export const CoverGallery: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '2rem', backgroundColor: '#f9fafb' }}>
      <DynamicBookCover title="Don't Make Me Think" author="Steve Krug" />
      <DynamicBookCover title="The Road to React" author="Robin Wieruch" />
      <DynamicBookCover title="Rich Dad Poor Dad" author="Robert T. Kiyosaki" />
      <DynamicBookCover title="Harry Potter" author="J.K. Rowling" />
      <DynamicBookCover title="You Don't Know JS" author="Kyle Simpson" />
      <DynamicBookCover title="Sprint" author="Jake Knapp" />
      <DynamicBookCover title="The Design of Everyday Things" author="Don Norman" />
    </div>
  ),
};