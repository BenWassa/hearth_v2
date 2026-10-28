const test = require('node:test');
const assert = require('node:assert/strict');
const { runCorrection } = require('../../scripts/correctClassification.cjs');
const args = (extra = []) => [
  '--id=603',
  '--type=movie',
  '--facet=comfort',
  '--value=high',
  '--reason=Reviewed',
  ...extra,
];
const matching = { provider: 'tmdb', providerId: '603', type: 'movie' };
function database(records) {
  const writes = [];
  return {
    writes,
    doc: (path) => path,
    runTransaction: async (callback) =>
      callback({
        get: async (path) => ({
          exists: !!records[path.split('/').pop()],
          data: () => records[path.split('/').pop()],
        }),
        update: (path, fields) => writes.push({ path, fields }),
      }),
  };
}
test('correction defaults to dry-run without opening Firestore or writing', async () => {
  const db = database({ 'tmdb:movie:603': matching });
  let opened = false;
  await runCorrection({
    argv: args(),
    getDb: () => {
      opened = true;
      return db;
    },
    log: () => {},
  });
  assert.equal(opened, false);
  assert.deepEqual(db.writes, []);
});
for (const value of ['high', 'unknown']) {
  test(`apply conditionally writes only named facet and audit fields (${value})`, async () => {
    const { CLASSIFIER_VERSION } = await import(
      '../../src/domain/media/classification.mjs'
    );
    for (const records of [
      { 'tmdb:movie:603': matching },
      { 'tmdb:603': matching, 'tmdb:movie:603': { ...matching, type: 'show' } },
    ]) {
      const db = database(records);
      await runCorrection({
        argv: args(['--apply']).map((a) =>
          a.startsWith('--value=') ? `--value=${value}` : a,
        ),
        appId: 'test',
        getDb: () => db,
        log: () => {},
      });
      assert.equal(db.writes.length, 1);
      assert.deepEqual(db.writes[0].fields, {
        'media.classificationOverride.attributes.comfort': value,
        'media.classificationOverride.reason': 'Reviewed',
        'media.classificationOverride.version': CLASSIFIER_VERSION,
        'media.classificationOverride.correctedAt':
          db.writes[0].fields['media.classificationOverride.correctedAt'],
      });
      assert.equal(
        typeof db.writes[0].fields['media.classificationOverride.correctedAt'],
        'number',
      );
    }
  });
}
test('apply rejects absent or mismatched catalog identities without writes', async () => {
  const db = database({ 'tmdb:603': { ...matching, providerId: '99' } });
  await assert.rejects(
    runCorrection({ argv: args(['--apply']), getDb: () => db, log: () => {} }),
    /No matching/,
  );
  assert.deepEqual(db.writes, []);
});
for (const invalid of ['--facet=bogus', '--value=bogus']) {
  test(`rejects ${invalid} before accessing Firestore`, async () => {
    const argv = args().map((a) =>
      a.startsWith(invalid.split('=')[0] + '=') ? invalid : a,
    );
    await assert.rejects(
      runCorrection({
        argv,
        getDb: () => {
          assert.fail('must not access Firestore');
        },
        log: () => {},
      }),
      /Supply/,
    );
  });
}
