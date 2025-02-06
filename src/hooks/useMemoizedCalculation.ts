import { useMemo, useRef, useEffect } from 'react';
import { analytics } from '../utils/analytics';

export function useMemoizedCalculation<T, R>(
  calculation: (input: T) => R,
  input: T,
  key: string
): R {
  const startTimeRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = performance.now();
    return () => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current;
        analytics.logPerformanceMetric(`${key}_calculation`, duration);
      }
    };
  }, [input, key]);

  return useMemo(() => {
    const result = calculation(input);
    return result;
  }, [calculation, input]);