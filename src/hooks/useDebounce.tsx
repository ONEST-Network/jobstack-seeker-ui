import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values with minimum character requirement
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @param minLength - Minimum length required before debounced value updates (default: 0)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number, minLength: number = 0): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // For string values, check minimum length requirement
    if (typeof value === 'string' && minLength > 0) {
      // If the value is empty, immediately update to allow clearing
      if (value.length === 0) {
        setDebouncedValue(value);
        return;
      }
      
      // If the value is shorter than minimum length, don't update debounced value
      if (value.length < minLength) {
        return;
      }
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, minLength]);

  return debouncedValue;
}
