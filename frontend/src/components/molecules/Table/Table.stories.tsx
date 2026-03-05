import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Table, Column } from './Table';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';

const meta: Meta<typeof Table> = {
  title: 'Molecules/Table',
  component: Table,
  tags: ['autodocs'],
};

export default meta;

// 1. Define our data structures
interface PaymentRecord {
  id: string;
  title: string;
  daysOverdue: number;
  charge: number;
}

interface ReservationRecord {
  id: string;
  title: string;
  author: string;
  status: 'available' | 'waiting';
}

// 2. Mock Data
const mockPayments: PaymentRecord[] = [
  { id: '1', title: "Don't Make Me Think", daysOverdue: 3,  charge: 100 },
  { id: '2', title: 'The Pragmatic Programmer', daysOverdue: 1,  charge: 25 },
];

const mockReservations: ReservationRecord[] = [
  { id: '101', title: 'Design Patterns', author: 'Gang of Four', status: 'available' },
  { id: '102', title: 'Clean Architecture', author: 'Robert C. Martin', status: 'waiting' },
];

// 3. Stories
export const PendingPaymentsTable: StoryObj = {
  render: () => {
    // We define the columns and exactly how they should render the data
    const columns: Column<PaymentRecord>[] = [
      { header: 'Book Title', accessor: 'title' },
      
      { 
        header: 'Penalties', 
        accessor: 'daysOverdue',
        render: (row) => <Badge variant="error">{row.daysOverdue} Days</Badge>
      },
      { 
        header: 'Charges', 
        accessor: 'charge',
        render: (row) => <span style={{ fontWeight: 'bold' }}>₹{row.charge}</span>
      },
      { 
        header: 'Action', 
        accessor: 'action', // Dummy accessor since we use a custom render
        render: () => <Button size="sm" variant="primary">Pay Now</Button>
      },
    ];

    return <Table columns={columns} data={mockPayments} />;
  },
};

export const ReservationsTable: StoryObj = {
  render: () => {
    const columns: Column<ReservationRecord>[] = [
      { header: 'Title', accessor: 'title' },
      { header: 'Author', accessor: 'author' },
      { 
        header: 'Status', 
        accessor: 'status',
        render: (row) => (
          <Badge variant={row.status === 'available' ? 'success' : 'warning'}>
            {row.status === 'available' ? 'Ready to Pick Up' : 'Waitlisted'}
          </Badge>
        )
      },
    ];

    return <Table columns={columns} data={mockReservations} onRowClick={(row) => alert(`Clicked on ${row.title}`)} />;
  },
};