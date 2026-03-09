import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { InputField } from './InputField';
import { Icon } from '../Icon/Icon';

const meta: Meta<typeof InputField> = {
  title: 'Atoms/InputField',
  component: InputField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InputField>;

export const Default: Story = {
  args: {
    label: 'Username',
    placeholder: 'username@bookstop.com',
    type: 'text',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    placeholder: '••••••••',
    type: 'password',
  },
};

export const Search: Story = {
  args: {
    placeholder: 'Search...',
    type: 'text',
    icon: <Icon name="search" size={16} />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
    error: 'Please enter a valid email address.',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Author(s)',
    placeholder: 'e.g. J.K. Rowling, George Orwell',
    hint: 'Separate multiple authors with a comma.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Member ID',
    value: 'USR-00042',
    disabled: true,
  },
};