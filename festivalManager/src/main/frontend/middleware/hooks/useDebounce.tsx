import { useCallback, useEffect, useRef } from 'react';

type DebouncedFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

/**
 * Debounce a function to limit the rate at which it can be called
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export default function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): DebouncedFunction<T> {
  // Store the latest function in a ref to avoid recreating debounce
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  // Store timeout id in a ref for cleanup
  const timeoutRef = useRef<number>();

  // Create debounced function, memoized to prevent recreation
  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return debouncedFn;
}
