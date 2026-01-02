'use client';

import { useState, useEffect, useCallback } from 'react';
import { debounce } from '@/lib/utils';

interface UseSearchOptions<T> {
  searchFn: (query: string) => Promise<T[]>;
  debounceMs?: number;
  minChars?: number;
}

interface UseSearchResult<T> {
  query: string;
  setQuery: (query: string) => void;
  results: T[];
  isLoading: boolean;
  error: Error | null;
  clear: () => void;
}

export function useSearch<T>({
  searchFn,
  debounceMs = 300,
  minChars = 2,
}: UseSearchOptions<T>): UseSearchResult<T> {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < minChars) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await searchFn(searchQuery);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs),
    [searchFn, debounceMs, minChars]
  );

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clear,
  };
}
