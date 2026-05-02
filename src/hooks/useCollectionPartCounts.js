import { useEffect, useMemo, useState } from 'react';
import { getCollectionDetails } from '../services/mediaApi/client.js';

const collectionPartCountCache = new Map();

const getCacheKey = ({ provider = 'tmdb', providerId }) =>
  `${provider}:${providerId}`;

const getCollectionPartCount = async ({ provider, providerId, locale }) => {
  const cacheKey = getCacheKey({ provider, providerId });
  if (collectionPartCountCache.has(cacheKey)) {
    return collectionPartCountCache.get(cacheKey);
  }

  const promise = getCollectionDetails({
    provider,
    providerId,
    locale,
    optional: true,
    details: false,
  }).then((collection) =>
    Array.isArray(collection?.parts) ? collection.parts.length : 0,
  );
  collectionPartCountCache.set(cacheKey, promise);

  try {
    const count = await promise;
    collectionPartCountCache.set(cacheKey, count);
    return count;
  } catch (error) {
    collectionPartCountCache.delete(cacheKey);
    throw error;
  }
};

const isApiAvailable = async () => {
  if (typeof fetch !== 'function') return false;
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

const useCollectionPartCounts = (
  collections = [],
  { locale = 'en-US', minCollectionSize = 3 } = {},
) => {
  const requests = useMemo(() => {
    const byCacheKey = new Map();
    (Array.isArray(collections) ? collections : []).forEach((rollup) => {
      if (Number(rollup?.totalCount || 0) >= minCollectionSize) return;
      const provider = rollup?.collection?.provider || 'tmdb';
      const providerId = rollup?.collection?.providerId;
      const collectionKey = rollup?.id;
      if (!providerId || !collectionKey) return;
      byCacheKey.set(getCacheKey({ provider, providerId }), {
        collectionKey,
        provider,
        providerId,
      });
    });
    return [...byCacheKey.values()];
  }, [collections, minCollectionSize]);

  const requestKey = useMemo(
    () =>
      requests
        .map(({ collectionKey, provider, providerId }) =>
          [collectionKey, provider, providerId].join('|'),
        )
        .join(','),
    [requests],
  );

  const [counts, setCounts] = useState(() => new Map());

  useEffect(() => {
    if (!requests.length) {
      setCounts(new Map());
      return undefined;
    }

    let ignore = false;
    const cachedCounts = new Map();

    requests.forEach(({ collectionKey, provider, providerId }) => {
      const cached = collectionPartCountCache.get(
        getCacheKey({ provider, providerId }),
      );
      if (typeof cached === 'number') {
        cachedCounts.set(collectionKey, cached);
      }
    });
    setCounts(cachedCounts);

    isApiAvailable().then((available) => {
      if (ignore || !available) return;

      requests.forEach(({ collectionKey, provider, providerId }) => {
        getCollectionPartCount({ provider, providerId, locale })
          .then((count) => {
            if (ignore) return;
            setCounts((current) => {
              if (current.get(collectionKey) === count) return current;
              const updated = new Map(current);
              updated.set(collectionKey, count);
              return updated;
            });
          })
          .catch(() => {
            if (ignore) return;
            setCounts((current) => {
              if (current.has(collectionKey)) return current;
              return new Map(current);
            });
          });
      });
    });

    return () => {
      ignore = true;
    };
  }, [locale, requestKey, requests]);

  return counts;
};

export default useCollectionPartCounts;
