import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;

export const SimpleContentCard: StoryObj<typeof Card> = {
  args: {
    padding: 'md',
    children: (
      <div>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>Library Hours</h3>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9375rem' }}>
          Monday - Friday: 08:00 AM - 08:00 PM<br/>
          Saturday: 09:00 AM - 04:00 PM
        </p>
      </div>
    ),
  },
};

export const DashboardMetricCard: StoryObj<typeof Card> = {
  args: {
    padding: 'md',
    style: { maxWidth: '250px', textAlign: 'center' },
    children: (
      <div>
        <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 'bold', color: '#2563EB' }}>
          14
        </span>
        <span style={{ color: '#6B7280', fontWeight: '500' }}>Active Reservations</span>
      </div>
    ),
  },
};

// Composing Atoms into a Molecule
export const BookListingCard: StoryObj<typeof Card> = {
  args: {
    padding: 'md',
    interactive: true,
    style: { maxWidth: '320px' },
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#111827' }}>The Pragmatic Programmer</h3>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>David Thomas, Andrew Hunt</p>
          </div>
          <Badge variant="success">Available</Badge>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button variant="primary" size="sm" style={{ flex: 1 }}>Reserve</Button>
          <Button variant="secondary" size="sm">Details</Button>
        </div>
      </div>
    ),
  },
};