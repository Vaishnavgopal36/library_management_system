import { useState, useCallback } from 'react';

/**
 * Manages the "confirm → processing → confirmed" pattern used for
 * mark-paid, pay-fine, and similar two-step confirmation flows.
 *
 * Pattern: user clicks confirm → isProcessing → isConfirmed (shows "Done" state) → dismiss.
 *
 * @template T - Type of the item being confirmed (Fine, Transaction, etc.)
 */
export interface UseConfirmActionReturn<T> {
  isOpen: boolean;
  data: T | null;
  isProcessing: boolean;
  isConfirmed: boolean;
  open: (item: T) => void;
  close: () => void;
  /** Begin the async action (sets isProcessing to true). */
  startProcessing: () => void;
  /** Mark the action as complete (shows the confirmed/"done" state). */
  markConfirmed: () => void;
  /** Reset everything and close. */
  dismiss: () => void;
}

export function useConfirmAction<T>(): UseConfirmActionReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const open = useCallback((item: T) => {
    setData(item);
    setIsOpen(true);
    setIsProcessing(false);
    setIsConfirmed(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
    setIsProcessing(false);
    setIsConfirmed(false);
  }, []);

  const startProcessing = useCallback(() => setIsProcessing(true), []);
  const markConfirmed = useCallback(() => {
    setIsProcessing(false);
    setIsConfirmed(true);
  }, []);
  const dismiss = close;

  return { isOpen, data, isProcessing, isConfirmed, open, close, startProcessing, markConfirmed, dismiss };
}
