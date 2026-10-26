import { useEffect, useState } from 'react';
import { getCollectionDetails } from '../services/mediaApi/client.js';

const useCollectionDetails = ({
  provider = 'tmdb',
  providerId,
  enabled = false,
  locale = 'en-US',
  details = false,
  optional = false,
} = {}) => {
  const requestKey = [provider, providerId, locale, details, optional].join(
    ':',
  );
  const [result, setResult] = useState({
    key: '',
    data: null,
    loading: false,
    error: null,
  });
  useEffect(() => {
    if (!enabled || !providerId) return undefined;
    let ignore = false;
    setResult({ key: requestKey, data: null, loading: true, error: null });
    getCollectionDetails({ provider, providerId, locale, details, optional })
      .then((data) => {
        if (ignore) return;
        setResult({
          key: requestKey,
          loading: false,
          error: null,
          data: {
            ...(data || {}),
            parts: Array.isArray(data?.parts) ? data.parts : [],
            subCollections: Array.isArray(data?.subCollections)
              ? data.subCollections
              : [],
          },
        });
      })
      .catch((error) => {
        if (!ignore)
          setResult({ key: requestKey, data: null, loading: false, error });
      });
    return () => {
      ignore = true;
    };
  }, [details, enabled, locale, optional, provider, providerId, requestKey]);
  if (!enabled || !providerId)
    return { data: null, loading: false, error: null };
  // The render on an identity change runs before effects: never expose old parts.
  return result.key === requestKey
    ? result
    : { data: null, loading: true, error: null };
};

export default useCollectionDetails;
