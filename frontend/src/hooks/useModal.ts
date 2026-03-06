import { useState, useCallback } from 'react';

/**
 * Generic modal state manager. Replaces the repetitive 3-variable pattern
 * (isOpen, selectedItem, isProcessing) with open/close/confirm functions
 * used by 17+ modals across the application.
 *
 * @template T - Type of the item passed into the modal (e.g. Book, Fine, Transaction)
 */
export interface UseModalReturn<T> {
  isOpen: boolean;
  data: T | null;
  isProcessing: boolean;
  open: (item: T) => void;
  close: () => void;
  setProcessing: (v: boolean) => void;
}

export function useModal<T = undefined>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const open = useCallback((item: T) => {
    setData(item);
    setIsOpen(true);
    setIsProcessing(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
    setIsProcessing(false);
  }, []);

  return { isOpen, data, isProcessing, open, close, setProcessing: setIsProcessing };
}
