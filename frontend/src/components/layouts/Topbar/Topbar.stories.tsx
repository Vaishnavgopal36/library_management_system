import type { Meta, StoryObj } from '@storybook/react';
import { Topbar } from './Topbar';

const meta: Meta<typeof Topbar> = {
  title: 'Layouts/Topbar',
  component: Topbar,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const Default: StoryObj<typeof Topbar> = {
  args: {
    userName: 'Kenson',
  },
};