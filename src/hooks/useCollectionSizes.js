import { useEffect, useMemo, useState } from 'react';
import { getCollectionDetails } from '../services/mediaApi/client.js';

const collectionSizeCache = new Map();

const getCacheKey = ({ provider = 'tmdb', providerId }) =>
  `${provider}:${providerId}`;

const getCollectionSize = async ({ provider, providerId, locale }) => {
  const cacheKey = getCacheKey({ provider, providerId });
  if (collectionSizeCache.has(cacheKey)) return collectionSizeCache.get(cacheKey);

  const promise = getCollectionDetails({ provider, providerId, locale }).then(
    (details) => (Array.isArray(details?.parts) ? details.parts.length : 0),
  );
  collectionSizeCache.set(cacheKey, promise);

  try {
    const size = await promise;
    collectionSizeCache.set(cacheKey, size);
    return size;
  } catch (error) {
    collectionSizeCache.delete(cacheKey);
    throw error;
  }
};

const useCollectionSizes = (collections = [], { locale = 'en-US' } = {}) => {
  const requests = useMemo(() => {
    const byCacheKey = new Map();
    (Array.isArray(collections) ? collections : []).forEach((rollup) => {
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
  }, [collections]);

  const requestKey = useMemo(
    () =>
      requests
        .map(({ collectionKey, provider, providerId }) =>
          [collectionKey, provider, providerId].join('|'),
        )
        .join(','),
    [requests],
  );

  const [sizes, setSizes] = useState(() => new Map());

  useEffect(() => {
    if (!requests.length) {
      setSizes(new Map());
      return undefined;
    }

    let ignore = false;
    const nextSizes = new Map();

    requests.forEach(({ collectionKey, provider, providerId }) => {
      const cached = collectionSizeCache.get(getCacheKey({ provider, providerId }));
      if (typeof cached === 'number') {
        nextSizes.set(collectionKey, cached);
      }
    });
    setSizes(nextSizes);

    requests.forEach(({ collectionKey, provider, providerId }) => {
      getCollectionSize({ provider, providerId, locale })
        .then((size) => {
          if (ignore) return;
          setSizes((current) => {
            if (current.get(collectionKey) === size) return current;
            const updated = new Map(current);
            updated.set(collectionKey, size);
            return updated;
          });
        })
        .catch(() => {
          if (ignore) return;
          setSizes((current) => {
            if (current.has(collectionKey)) return current;
            return new Map(current);
          });
        });
    });

    return () => {
      ignore = true;
    };
  }, [locale, requestKey, requests]);

  return sizes;
};

export default useCollectionSizes;
