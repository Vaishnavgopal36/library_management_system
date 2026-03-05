import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from '../../atoms/Button/Button';
import { InputField } from '../../atoms/InputField/InputField';

const meta: Meta<typeof Modal> = {
  title: 'Molecules/Modal',
  component: Modal,
  tags: ['autodocs'],
};

export default meta;

// Wrapper to manage the open/close state in Storybook
const ModalWrapper = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ padding: '2rem', height: '200px' }}>
      <Button variant="primary" onClick={() => setIsOpen(true)}>Open {title}</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        {children}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setIsOpen(false)}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
};

export const SimpleConfirmation: StoryObj = {
  render: () => (
    <ModalWrapper title="Return Book">
      <p style={{ color: '#4b5563', margin: 0 }}>
        Are you sure you want to mark "The Pragmatic Programmer" as returned? This will update the ledger and make the book available to other students.
      </p>
    </ModalWrapper>
  ),
};

// Recreating the Payment Modal from the PDF
export const PaymentFormModal: StoryObj = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div style={{ padding: '2rem', height: '200px' }}>
        <Button variant="danger" onClick={() => setIsOpen(true)}>Pay Fine (₹100)</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="VISA Payment">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <InputField label="Card Holder Name" placeholder="REINHARD KENSON" />
            <InputField label="Credit Card Number" placeholder="XXXX XXXX XXXX 8014" />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <InputField label="Expiry" placeholder="08/21" style={{ flex: 1 }} />
              <InputField label="CVV" placeholder="XXX" type="password" style={{ flex: 1 }} />
            </div>
            <Button variant="primary" size="lg" style={{ marginTop: '1rem' }} onClick={() => setIsOpen(false)}>
              PROCEED TO PAY ₹100
            </Button>
          </div>
        </Modal>
      </div>
    );
  },
};