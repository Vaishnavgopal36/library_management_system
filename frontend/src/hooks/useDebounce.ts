import { useState, useEffect } from 'react';

/**
 * Delays propagating a value until `delay` ms have elapsed since the last change.
 * Use this to prevent API spam on rapid-fire keystroke events.
 *
 * @param value - The live value to debounce (e.g. a search input string).
 * @param delay - Milliseconds to wait before the debounced value updates (default 500).
 * @returns The debounced value, held stable until the user stops typing.
 *
 * @example
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 500);
 *
 *   useEffect(() => {
 *     // Only fires 500ms after the user stops typing
 *     fetchResults(debouncedQuery);
 *   }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Cancel the pending timer if value or delay changes before it fires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
