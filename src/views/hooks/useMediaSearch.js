import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { searchMedia } from '../../services/mediaApi/client.js';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

const getResults = (data) => (Array.isArray(data?.results) ? data.results : []);

const getPage = (data, fallback) => {
  const parsed = Number.parseInt(data?.page, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getTotalPages = (data) => {
  const parsed = Number.parseInt(data?.totalPages, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const appendUniqueResults = (currentResults, nextResults) => {
  const seen = new Set(
    currentResults.map(
      (result) => `${result?.provider || ''}-${result?.providerId || ''}`,
    ),
  );
  const uniqueNextResults = nextResults.filter((result) => {
    const key = `${result?.provider || ''}-${result?.providerId || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...currentResults, ...uniqueNextResults];
};

export const useMediaSearch = ({ query, type = 'all' }) => {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const normalizedQuery = useMemo(() => query.trim(), [query]);
  const hasQuery = normalizedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setResults([]);
    setPage(0);
    setTotalPages(0);
    setError('');
    setLoadingMore(false);

    if (!hasQuery) {
      setLoadingInitial(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoadingInitial(true);
      setError('');
      try {
        const data = await searchMedia({ q: normalizedQuery, type, page: 1 });
        if (requestIdRef.current !== requestId) return;
        setResults(getResults(data));
        setPage(getPage(data, 1));
        setTotalPages(getTotalPages(data));
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setError(err?.message || 'Could not search right now.');
        setResults([]);
      } finally {
        if (requestIdRef.current === requestId) setLoadingInitial(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [hasQuery, normalizedQuery, type]);

  const hasMore = hasQuery && page > 0 && totalPages > 0 && page < totalPages;

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingInitial || loadingMore) return;

    const requestId = requestIdRef.current;
    const nextPage = page + 1;

    setLoadingMore(true);
    setError('');
    try {
      const data = await searchMedia({
        q: normalizedQuery,
        type,
        page: nextPage,
      });
      if (requestIdRef.current !== requestId) return;
      setResults((currentResults) =>
        appendUniqueResults(currentResults, getResults(data)),
      );
      setPage(getPage(data, nextPage));
      setTotalPages(getTotalPages(data));
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(err?.message || 'Could not search right now.');
    } finally {
      if (requestIdRef.current === requestId) setLoadingMore(false);
    }
  }, [hasMore, loadingInitial, loadingMore, normalizedQuery, page, type]);

  return {
    results,
    loading: loadingInitial,
    loadingInitial,
    loadingMore,
    error,
    hasQuery,
    hasMore,
    loadMore,
  };
};
