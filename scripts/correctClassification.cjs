// Developer-only correction workflow. Dry-run unless --apply is supplied.
const {
  initializeFirebaseAdmin,
  getAdminDb,
} = require('../server/firebaseAdmin');
const arg = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
(async () => {
  const domain = await import('../src/domain/media/classification.mjs');
  const id = arg('id');
  const type = arg('type');
  const facet = arg('facet');
  const value = arg('value');
  const reason = (arg('reason') || '').trim();
  if (
    !/^[1-9]\d{0,9}$/.test(id || '') ||
    !['movie', 'show'].includes(type) ||
    !domain.FACETS.includes(facet) ||
    !domain.LEVELS.includes(value) ||
    !reason ||
    reason.length > 200
  )
    throw new Error(
      'Supply --id, --type=movie|show, --facet, --value=unknown|low|medium|high and --reason (1–200 chars).',
    );
  const appId = arg('app') || process.env.APP_ID || 'hearth-default';
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(appId)) throw new Error('Invalid app id');
  const key = `tmdb:${type === 'show' ? 'tv' : 'movie'}:${id}`;
  const correction = {
    facet,
    value,
    reason,
    version: domain.CLASSIFIER_VERSION,
  };
  console.log(
    JSON.stringify(
      { appId, key, correction, apply: process.argv.includes('--apply') },
      null,
      2,
    ),
  );
  if (!process.argv.includes('--apply')) return;
  initializeFirebaseAdmin();
  const db = getAdminDb();
  let updated = 0;
  for (const mediaId of [key, `tmdb:${id}`]) {
    await db.runTransaction(async (tx) => {
      const ref = db.doc(`artifacts/${appId}/media_catalog/${mediaId}`);
      const snapshot = await tx.get(ref);
      if (!snapshot.exists || domain.canonicalMediaKey(snapshot.data()) !== key)
        return;
      tx.update(ref, {
        [`media.classificationOverride.attributes.${facet}`]: value,
        'media.classificationOverride.reason': reason,
        'media.classificationOverride.version': domain.CLASSIFIER_VERSION,
        'media.classificationOverride.correctedAt': Date.now(),
      });
      updated++;
    });
  }
  if (!updated) throw new Error('No matching existing catalog record');
  console.log(`Corrected ${updated} catalog record(s).`);
})().catch((error) => {
  console.error(
    error.code
      ? 'Catalog correction failed; check admin credentials and project access.'
      : error.message,
  );
  process.exitCode = 1;
});
