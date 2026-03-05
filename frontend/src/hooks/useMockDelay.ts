import { useState, useEffect } from 'react';

/**
 * Simulates an async data-load with a configurable delay.
 * Returns `true` while "loading", then flips to `false`.
 *
 * Replace the body of this hook with a real API call once the backend
 * is connected — all pages that use it will automatically get real data.
 *
 * @param delay - Milliseconds before loading resolves (default: 1000)
 */
export function useMockDelay(delay = 1000): boolean {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return isLoading;
}
