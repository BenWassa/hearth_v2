import { useEffect, useMemo, useState } from 'react';
import { searchMedia } from '../../services/mediaApi/client.js';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export const useMediaSearch = ({ query, type = 'all' }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await searchMedia({ q: normalizedQuery, type, page: 1 });
        if (!cancelled) {
          setResults(Array.isArray(data?.results) ? data.results : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Could not search right now.');
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedQuery, type]);

  return {
    results,
    loading,
    error,
    hasQuery: normalizedQuery.length >= MIN_QUERY_LENGTH,
  };
};
