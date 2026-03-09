import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';
import type { IconName } from './iconPaths';

const meta: Meta<typeof Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: [
        'hamburger', 'home', 'search', 'clock', 'credit-card', 'calendar',
        'users', 'help-circle', 'x-close', 'book-open', 'book-logo', 'eye',
        'eye-off', 'check', 'settings', 'star', 'user', 'mail', 'phone',
        'briefcase', 'lock', 'edit', 'trash', 'trash-2', 'alert-triangle',
        'slash', 'check-square', 'info', 'bell', 'chevron-down', 'chevron-left',
        'chevron-right', 'archive', 'play',
      ] satisfies IconName[],
    },
    size: { control: 'number' },
  },
};

export default meta;

export const Playground: StoryObj<typeof Icon> = {
  args: {
    name: 'book-open',
    size: 24,
  },
};

export const NavigationIcons: StoryObj = {
  render: () => {
    const navIcons: { name: IconName; label: string }[] = [
      { name: 'home', label: 'Dashboard' },
      { name: 'search', label: 'Search' },
      { name: 'clock', label: 'History' },
      { name: 'credit-card', label: 'Fines' },
      { name: 'calendar', label: 'Reservations' },
      { name: 'users', label: 'Members' },
      { name: 'help-circle', label: 'Support' },
    ];
    return (
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', padding: '1.5rem' }}>
        {navIcons.map(({ name, label }) => (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '70px' }}>
            <Icon name={name} size={24} />
            <span style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>{label}</span>
          </div>
        ))}
      </div>
    );
  },
};

export const ActionIcons: StoryObj = {
  render: () => {
    const actionIcons: { name: IconName; label: string; color?: string }[] = [
      { name: 'edit', label: 'Edit' },
      { name: 'trash', label: 'Delete', color: 'var(--color-danger-600, #dc2626)' },
      { name: 'archive', label: 'Archive', color: '#6b7280' },
      { name: 'check', label: 'Confirm', color: '#16a34a' },
      { name: 'x-close', label: 'Cancel', color: '#dc2626' },
      { name: 'alert-triangle', label: 'Warning', color: '#d97706' },
    ];
    return (
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1.5rem' }}>
        {actionIcons.map(({ name, label, color }) => (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '60px' }}>
            <Icon name={name} size={20} stroke={color ?? 'currentColor'} />
            <span style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>{label}</span>
          </div>
        ))}
      </div>
    );
  },
};

export const SizeScale: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '1.5rem' }}>
      {([12, 16, 20, 24, 32, 40, 48] as const).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="book-open" size={size} />
          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{size}px</span>
        </div>
      ))}
    </div>
  ),
};

export const FullCatalog: StoryObj = {
  render: () => {
    const allIcons: IconName[] = [
      'hamburger', 'home', 'search', 'clock', 'credit-card', 'calendar',
      'users', 'help-circle', 'x-close', 'book-open', 'book-logo', 'eye',
      'eye-off', 'check', 'settings', 'star', 'user', 'mail', 'phone',
      'briefcase', 'lock', 'edit', 'trash', 'trash-2', 'alert-triangle',
      'slash', 'check-square', 'info', 'bell', 'chevron-down', 'chevron-left',
      'chevron-right', 'archive', 'play',
    ];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        {allIcons.map((name) => (
          <div
            key={name}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '0.4rem', padding: '0.75rem', backgroundColor: '#fff',
              borderRadius: '6px', border: '1px solid #e5e7eb', width: '88px',
            }}
          >
            <Icon name={name} size={20} />
            <span style={{ fontSize: '0.65rem', color: '#6b7280', textAlign: 'center', wordBreak: 'break-all' }}>
              {name}
            </span>
          </div>
        ))}
      </div>
    );
  },
};
