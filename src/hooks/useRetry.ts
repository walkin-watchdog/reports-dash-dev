import { useState, useCallback } from 'react';

interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
}

export function useRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
) {
  const { maxAttempts = 3, delay = 1000 } = config;
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      setLoading(false);
      return result;
    } catch (err) {
      if (attempts < maxAttempts - 1) {
        setAttempts(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return execute();
      }
      
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, [operation, attempts, maxAttempts, delay]);

  const reset = useCallback(() => {
    setAttempts(0);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, reset, attempts, error, loading };
}