import {
  canonicalMediaKey,
  classificationRevision,
  CLASSIFIER_VERSION,
} from '../../domain/media/classification.mjs';

export const requestClassification = async ({ id, type, token, signal }) => {
  const response = await fetch('/api/media/classify', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, type }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok)
    throw new Error('Classification unavailable');
  return payload.data;
};

export const requestClassificationBatch = async ({ items, token, signal }) => {
  const response = await fetch('/api/media/classify-batch', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: items.map(({ id, type }) => ({ id, type })),
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok)
    throw new Error('Classification unavailable');
  return payload.data;
};

// The shelf is the durable pending queue: a missing/old classification is work.
// Local storage contains only canonical IDs, revisions and retry bookkeeping.
export const startClassificationBackfill = ({
  getItems,
  scope = 'default',
  getToken,
  onResult,
  onBatchResult = () => {},
  onProgress = () => {},
  request = requestClassificationBatch,
  storage = globalThis.localStorage,
  now = Date.now,
  schedule = setTimeout,
  cancel = clearTimeout,
}) => {
  let stopped = false;
  let timer;
  const controller = new AbortController();
  const attempted = new Map();
  const sessionState = new Map();
  let processed = 0;
  let failed = 0;
  const read = (key) => {
    if (sessionState.has(key)) return sessionState.get(key);
    try {
      return JSON.parse(storage?.getItem(key) || '{}');
    } catch {
      return {};
    }
  };
  const save = (key, value) => {
    sessionState.set(key, value);
    try {
      storage?.setItem(key, JSON.stringify(value));
    } catch {
      /* Private mode: work still completes in this session. */
    }
  };
  const tick = async () => {
    if (stopped) return;
    const unique = new Map();
    for (const item of getItems()) {
      const key = canonicalMediaKey(item);
      if (key && !unique.has(key)) unique.set(key, item);
    }
    const candidates = [...unique.values()];
    const needsWork = (item) => {
      const c = item.media?.classification;
      const state = read(
        `hearth:classification:${scope}:${canonicalMediaKey(item)}`,
      );
      const matches =
        state.version === CLASSIFIER_VERSION &&
        state.signature === classificationRevision(item);
      if (matches && state.completed && state.retryAt > now()) return false;
      if (
        c?.pipelineVersion &&
        c.version === CLASSIFIER_VERSION &&
        !c.retryAfter &&
        !state.completed &&
        !state.retryAt
      )
        return false;
      return true;
    };
    const batch = candidates
      .filter((item) => {
        if (
          !needsWork(item) ||
          (attempted.get(canonicalMediaKey(item)) || 0) >= 3
        )
          return false;
        const state = read(
          `hearth:classification:${scope}:${canonicalMediaKey(item)}`,
        );
        return !(
          state.version === CLASSIFIER_VERSION &&
          state.signature === classificationRevision(item) &&
          state.retryAt > now()
        );
      })
      .slice(0, 10);
    const progress = () =>
      onProgress({
        processed,
        failed,
        pending: candidates.filter(needsWork).length,
      });
    if (!batch.length) {
      progress();
      timer = schedule(tick, 30000);
      return;
    }
    batch.forEach((item) => {
      const key = canonicalMediaKey(item);
      attempted.set(key, (attempted.get(key) || 0) + 1);
    });
    let results;
    try {
      const token = await getToken();
      if (stopped) return;
      results = await request({
        items: batch.map((item) => ({
          id: String(item.source?.providerId || item.providerId),
          type: item.media?.type || item.type,
        })),
        token,
        signal: controller.signal,
      });
      if (!Array.isArray(results)) results = [];
    } catch {
      results = [];
    }
    if (stopped) return;
    const completed = [];
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(3, batch.length) }, async () => {
        while (!stopped && next < batch.length) {
          const item = batch[next++];
          const key = canonicalMediaKey(item);
          const storageKey = `hearth:classification:${scope}:${key}`;
          const signature = classificationRevision(item);
          try {
            const entry = results.find(
              (entry) =>
                entry.id ===
                  String(item.source?.providerId || item.providerId) &&
                entry.type === (item.media?.type || item.type),
            );
            const result = entry?.data;
            if (
              !entry?.ok ||
              result?.version !== CLASSIFIER_VERSION ||
              result.key !== key
            )
              throw new Error('Classification unavailable');
            await onResult(item, result);
            if (stopped) return;
            save(storageKey, {
              version: CLASSIFIER_VERSION,
              signature,
              completed: true,
              retryAt: result.retryAfter || now() + 30 * 86400000,
            });
            completed.push({ item, classification: result });
            processed += 1;
          } catch {
            if (stopped) return;
            failed += 1;
            save(storageKey, {
              version: CLASSIFIER_VERSION,
              signature,
              completed: false,
              retryAt: now() + 15 * 60000,
            });
          }
        }
      }),
    );
    if (stopped) return;
    if (completed.length) await onBatchResult(completed);
    if (stopped) return;
    progress();
    timer = schedule(tick, 1200);
  };
  timer = schedule(tick, 1000);
  return () => {
    stopped = true;
    controller.abort();
    cancel(timer);
  };
};
