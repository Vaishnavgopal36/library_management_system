import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { Card } from '../../components/molecules/Card/Card';
import { Table, Column } from '../../components/molecules/Table/Table';
import { Badge } from '../../components/atoms/Badge/Badge';

const meta: Meta<typeof AppShell> = {
  title: 'Layouts/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

// Mock data for the dashboard demonstration
interface Reservation {
  id: string;
  title: string;
  status: 'Available' | 'Waitlisted';
}

const mockReservations: Reservation[] = [
  { id: '1', title: 'The Pragmatic Programmer', status: 'Available' },
  { id: '2', title: 'Clean Architecture', status: 'Waitlisted' },
];

const reservationColumns: Column<Reservation>[] = [
  { header: 'Book Title', accessor: 'title' },
  { 
    header: 'Status', 
    accessor: 'status',
    render: (row) => (
      <Badge variant={row.status === 'Available' ? 'success' : 'warning'}>
        {row.status}
      </Badge>
    )
  }
];

export const FullDashboardLayout: StoryObj<typeof AppShell> = {
  args: {
    userName: 'Kenson',
    activeNavItem: 'Dashboard',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Page Header */}
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1.875rem' }}>Good Morning, Kenson</h2>
          <p style={{ margin: 0, color: '#6b7280' }}>Here is what's happening in your physical library today.</p>
        </div>

        {/* Top Metrics Row */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Card style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase' }}>Active Loans</h3>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>3</span>
          </Card>
          <Card style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase' }}>Pending Fines</h3>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#EF4444' }}>₹100</span>
          </Card>
          <Card style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase' }}>Reservations</h3>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563EB' }}>2</span>
          </Card>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 2 }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#111827' }}>Your Reservations</h3>
            <Table columns={reservationColumns} data={mockReservations} />
          </div>
          
          <Card style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#111827' }}>Today's Quote</h3>
            <p style={{ fontStyle: 'italic', color: '#4b5563', lineHeight: '1.6' }}>
              "There is more treasure in books than in all the pirate's loot on Treasure Island."
            </p>
            <p style={{ textAlign: 'right', color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
              - Walt Disney
            </p>
          </Card>
        </div>

      </div>
    ),
  },
};