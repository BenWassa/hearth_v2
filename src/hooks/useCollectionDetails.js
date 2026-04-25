import { useEffect, useState } from 'react';
import { getCollectionDetails } from '../services/mediaApi/client.js';

const EMPTY_COLLECTION_DETAILS = {
  parts: [],
  subCollections: [],
};

const useCollectionDetails = ({
  provider = 'tmdb',
  providerId,
  enabled = false,
  locale = 'en-US',
} = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !providerId) {
      setLoading(false);
      setError(null);
      return undefined;
    }

    let ignore = false;
    setLoading(true);
    setError(null);

    getCollectionDetails({ provider, providerId, locale })
      .then((details) => {
        if (ignore) return;
        setData({
          ...EMPTY_COLLECTION_DETAILS,
          ...(details || {}),
          parts: Array.isArray(details?.parts) ? details.parts : [],
          subCollections: Array.isArray(details?.subCollections)
            ? details.subCollections
            : [],
        });
      })
      .catch((err) => {
        if (ignore) return;
        setData(null);
        setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [enabled, locale, provider, providerId]);

  return { data, loading, error };
};

export default useCollectionDetails;
