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

// The shelf is the durable pending queue: a missing/old classification is work.
// Local storage contains only canonical IDs, revisions and retry bookkeeping.
export const startClassificationBackfill = ({
  getItems,
  scope = 'default',
  getToken,
  onResult,
  onProgress = () => {},
  request = requestClassification,
  storage = globalThis.localStorage,
  now = Date.now,
  schedule = setTimeout,
  cancel = clearTimeout,
}) => {
  let stopped = false;
  let timer;
  const controller = new AbortController();
  const attempted = new Map();
  let processed = 0;
  let failed = 0;
  const read = (key) => {
    try {
      return JSON.parse(storage?.getItem(key) || '{}');
    } catch {
      return {};
    }
  };
  const save = (key, value) => {
    try {
      storage?.setItem(key, JSON.stringify(value));
    } catch {
      /* Private mode: work still completes in this session. */
    }
  };
  const tick = async () => {
    if (stopped) return;
    const candidates = getItems().filter((item) => canonicalMediaKey(item));
    const item = candidates.find((item) => {
      const key = canonicalMediaKey(item);
      if ((attempted.get(key) || 0) >= 3) return false;
      const c = item.media?.classification;
      const state = read(`hearth:classification:${scope}:${key}`);
      const signature = classificationRevision(item);
      if (
        state.version === CLASSIFIER_VERSION &&
        state.signature === signature &&
        state.retryAt > now()
      )
        return false;
      return (
        !c?.pipelineVersion ||
        c.version !== CLASSIFIER_VERSION ||
        (c.retryAfter && c.retryAfter <= now()) ||
        !state.completed ||
        state.signature !== signature ||
        state.version !== CLASSIFIER_VERSION ||
        state.retryAt <= now()
      );
    });
    if (!item) {
      timer = schedule(tick, 30000);
      return;
    }
    const key = canonicalMediaKey(item);
    attempted.set(key, (attempted.get(key) || 0) + 1);
    const storageKey = `hearth:classification:${scope}:${key}`;
    const signature = classificationRevision(item);
    try {
      const token = await getToken();
      if (stopped) return;
      const result = await request({
        id: String(item.source?.providerId || item.providerId),
        type: item.media?.type || item.type,
        token,
        signal: controller.signal,
      });
      if (stopped) return;
      if (result.version !== CLASSIFIER_VERSION || result.key !== key)
        throw new Error('Classification identity mismatch');
      await onResult(item, result);
      save(storageKey, {
        version: CLASSIFIER_VERSION,
        signature,
        completed: true,
        retryAt: result.retryAfter || now() + 30 * 86400000,
      });
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
    if (stopped) return;
    onProgress({
      processed,
      failed,
      pending: Math.max(0, candidates.length - attempted.size),
    });
    timer = schedule(tick, 1200);
  };
  timer = schedule(tick, 1000);
  return () => {
    stopped = true;
    controller.abort();
    cancel(timer);
  };
};
