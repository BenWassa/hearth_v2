const { createHash, randomUUID } = require('node:crypto');
const provider = require('./providerClient');
const gemini = require('./geminiClassifier');
const { getAdminDb } = require('../../server/firebaseAdmin');
const inFlight = new Map();
const hash = (value) => createHash('sha256').update(value).digest('hex');
const fault = (status, code) =>
  Object.assign(new Error(code), { status, code });

const createClassificationService = ({
  db = getAdminDb,
  getDetails = provider.getMediaDetails,
  ai = gemini,
  now = Date.now,
} = {}) => {
  const reserveAttempt = async () => {
    const store = db();
    const day = new Date(now()).toISOString().slice(0, 10);
    const ref = store.doc(`classification_budgets/${day}`);
    const maximum = Number(process.env.GEMINI_DAILY_REQUEST_LIMIT || 20);
    // Hard ceiling: includes retries and all backend instances. Fail closed.
    const limit = Number.isInteger(maximum)
      ? Math.min(Math.max(maximum, 0), 100)
      : 0;
    return store.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const count = snapshot.data()?.count || 0;
      if (count >= limit) return false;
      tx.set(ref, { count: count + 1, day });
      return true;
    });
  };
  const run = async ({ id, type, appId }) => {
    const domain = await import('../../src/domain/media/classification.mjs');
    const store = db();
    const key = `tmdb:${type === 'show' ? 'tv' : 'movie'}:${id}`;
    const ref = store.doc(`classification_cache/${key}`);
    const owner = randomUUID();
    const policy = ai.policyKey();
    const details = await getDetails({ id, type, locale: 'en-US' });
    if (!details.ok) throw fault(details.status || 503, 'METADATA_UNAVAILABLE');
    if (details.data.type !== type || String(details.data.providerId) !== id)
      throw fault(400, 'IDENTITY_MISMATCH');
    const input = { ...details.data, locale: 'en-US' };
    const revision = hash(domain.classificationRevision(input));
    // The lease dedupes Gemini across instances; same-process work also shares TMDB.
    const cached = await store.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const data = snapshot.data() || {};
      const valid =
        data.classification?.version === domain.CLASSIFIER_VERSION &&
        data.policy === policy &&
        data.sourceHash === revision;
      if (valid && data.expiresAt > now()) return data.classification;
      if (data.leaseUntil > now()) throw fault(429, 'CLASSIFICATION_PENDING');
      tx.set(ref, { owner, leaseUntil: now() + 60000 }, { merge: true });
      return null;
    });
    let classification = cached;
    if (!classification) {
      try {
        const baseline = domain.classifyMedia(input);
        const aiResult = await ai.infer({
          input: domain.normalizeClassificationInput(input),
          reserveAttempt,
        });
        classification =
          aiResult.status === 'complete'
            ? domain.blendClassification(
                baseline,
                aiResult.attributes,
                aiResult.model,
              )
            : baseline;
        const retryable = !['complete', 'disabled', 'configuration'].includes(
          aiResult.status,
        );
        classification = {
          ...classification,
          pipelineVersion: domain.CLASSIFIER_VERSION,
          enrichmentStatus: aiResult.status,
          classifiedAt: now(),
          retryAfter: retryable ? now() + 24 * 60 * 60 * 1000 : null,
        };
        await store.runTransaction(async (tx) => {
          const current = await tx.get(ref);
          if (current.data()?.owner !== owner) throw fault(409, 'LEASE_LOST');
          tx.set(ref, {
            classification,
            sourceHash: revision,
            policy,
            owner: null,
            leaseUntil: 0,
            expiresAt: now() + (retryable ? 86400000 : 30 * 86400000),
          });
        });
      } catch (error) {
        await store
          .runTransaction(async (tx) => {
            const current = await tx.get(ref);
            if (current.data()?.owner === owner)
              tx.set(ref, { leaseUntil: 0, owner: null }, { merge: true });
          })
          .catch(() => {});
        throw error;
      }
    }
    // Update only generated facets on matching existing catalog records. Never
    // touch a household's tags, note, progress or activity timestamp.
    for (const mediaId of [key, `tmdb:${id}`]) {
      const catalog = store.doc(`artifacts/${appId}/media_catalog/${mediaId}`);
      await store.runTransaction(async (tx) => {
        const snapshot = await tx.get(catalog);
        const data = snapshot.data();
        if (
          !data ||
          data.source?.provider !== 'tmdb' ||
          String(data.source?.providerId) !== id ||
          (data.media?.type || data.type) !== type
        )
          return;
        if (
          data.media?.classification?.sourceRevision ===
            classification.sourceRevision &&
          data.media?.classification?.pipelineVersion ===
            classification.pipelineVersion &&
          data.media?.classification?.classifiedAt ===
            classification.classifiedAt
        )
          return;
        if (
          data.media?.classification?.classifiedAt > classification.classifiedAt
        )
          return;
        tx.update(catalog, { 'media.classification': classification });
      });
    }
    return classification;
  };
  return {
    classify: (args) => {
      const key = `${args.appId}:${args.type}:${args.id}`;
      if (inFlight.has(key)) return inFlight.get(key);
      const promise = run(args).finally(() => inFlight.delete(key));
      inFlight.set(key, promise);
      return promise;
    },
    reserveAttempt,
  };
};
module.exports = { createClassificationService };
