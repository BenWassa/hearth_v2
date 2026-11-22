// Curated collections (#55, #57): the explicit single-film "Add" path against real Firestore rules.
// npx -y firebase-tools@latest emulators:exec --only firestore --project demo-hearth "node scripts/emulator/curatedAdd.emulator.mjs"
// If absent locally: npm install --prefix /tmp/hearth-rules-testing --no-package-lock --ignore-scripts --legacy-peer-deps @firebase/rules-unit-testing@5.0.2
// Share the app SDK: ln -s "$PWD/node_modules/firebase" /tmp/hearth-rules-testing/node_modules/firebase
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  addWatchlistItem,
  removeWatchlistItems,
} from '../../src/services/firebase/watchlist.js';
import { buildWatchlistPayload } from '../../src/domain/media/schema.js';
import { toWatchlistPayload } from '../../src/components/curated/watchlistFilm.js';
import { isRemoved } from '../../src/domain/watchlist/removal.js';

assert.match(
  process.env.FIRESTORE_EMULATOR_HOST || '',
  /^(localhost|127\.0\.0\.1|\[::1\]):\d+$/,
  'Run using emulators:exec against localhost',
);
const require = createRequire(import.meta.url);
let rulesModule;
try {
  rulesModule = require.resolve('@firebase/rules-unit-testing/package.json');
} catch {
  rulesModule = createRequire('/tmp/hearth-rules-testing/package.json').resolve(
    '@firebase/rules-unit-testing/package.json',
  );
}
const rulesPackage = JSON.parse(await readFile(rulesModule, 'utf8'));
const { initializeTestEnvironment } = await import(
  pathToFileURL(
    resolve(dirname(rulesModule), rulesPackage.exports['.'].node.import),
  ).href
);
const env = await initializeTestEnvironment({
  projectId: 'demo-hearth',
  firestore: {
    rules: await readFile(
      new URL('../../firestore.rules', import.meta.url),
      'utf8',
    ),
  },
});
const A = 'CdP5YrCYW1d1RjqVQVbnm5QJCLV2';
const B = '7lGXb8XSW4NVSoIPWW8udn3tntK2';
const OUTSIDER = 'outsider-uid-0000000000000';
const claims = { firebase: { sign_in_provider: 'password' } };
const a = env.authenticatedContext(A, claims).firestore();
const b = env.authenticatedContext(B, claims).firestore();
const outsider = env.authenticatedContext(OUTSIDER, claims).firestore();
const appId = 'curated-add-emulator';
const spaceId = `household-${Date.now()}`;
const catalog = async (id) =>
  (await getDoc(doc(a, 'artifacts', appId, 'media_catalog', id))).data();
const ref = (db, id) =>
  doc(db, 'artifacts', appId, 'spaces', spaceId, 'watchlist_items', id);

// Mirror the app: FilmPreview builds the payload, handleAddItem wraps it.
const film = (providerId, title) => ({
  provider: 'tmdb',
  providerId: String(providerId),
  title,
  year: 1954,
  posterUrl: `https://image.tmdb.org/t/p/w500/${providerId}.jpg`,
  directors: ['Akira Kurosawa'],
});
const curatedAdd = (db, uid, f) => {
  const payload = buildWatchlistPayload(
    { ...toWatchlistPayload(f), status: 'unwatched' },
    uid,
  );
  return addWatchlistItem({
    db,
    appId,
    spaceId,
    payload: { ...payload, additionOrigin: 'manual' },
    allowRestore: false,
  });
};

let failures = 0;
let total = 0;
async function scenario(label, action) {
  total++;
  try {
    await action();
    console.log(`PASS ${label}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${label}`, error);
  }
}
try {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'artifacts', appId, 'spaces', spaceId),
      {
        members: [A, B],
        ownerUid: A,
        name: 'Emulator household',
        nameLower: 'emulator household',
      },
    );
  });

  let sevenSamuraiId;
  await scenario('1 new film is added under real rules', async () => {
    const result = await curatedAdd(a, A, film(346, 'Seven Samurai'));
    assert.equal(result.status, 'added');
    sevenSamuraiId = result.id;
    const saved = (await getDoc(ref(a, result.id))).data();
    assert.equal(saved.title, 'Seven Samurai');
    assert.equal(saved.type, 'movie');
    const identity = (await catalog(result.id)).source;
    assert.equal(identity.provider, 'tmdb');
    assert.equal(identity.providerId, '346');
    assert.equal(saved.addedBy, A);
    assert.equal(isRemoved(saved), false);
  });

  await scenario(
    '2 adding a film already on the shelf reports exists and keeps watched state and note',
    async () => {
      await setDoc(
        ref(a, sevenSamuraiId),
        {
          status: 'watched',
          note: 'Saw it in 2019',
          userState: { status: 'watched', note: 'Saw it in 2019' },
        },
        { merge: true },
      );
      const before = (await getDoc(ref(a, sevenSamuraiId))).data();
      const result = await curatedAdd(b, B, film(346, 'Seven Samurai'));
      assert.equal(result.status, 'exists');
      assert.deepEqual((await getDoc(ref(a, sevenSamuraiId))).data(), before);
    },
  );

  await scenario(
    '3 a Recently removed film is never silently restored',
    async () => {
      const added = await curatedAdd(a, A, film(3782, 'Ikiru'));
      assert.equal(added.status, 'added');
      await removeWatchlistItems({
        db: a,
        appId,
        spaceId,
        itemIds: [added.id],
        removedBy: A,
      });
      const before = (await getDoc(ref(a, added.id))).data();
      assert.equal(isRemoved(before), true);
      const result = await curatedAdd(b, B, film(3782, 'Ikiru'));
      assert.equal(result.status, 'removed');
      const after = (await getDoc(ref(a, added.id))).data();
      assert.equal(isRemoved(after), true);
      assert.deepEqual(after, before);
    },
  );

  await scenario(
    '4 unverified film identity is refused before any write',
    async () => {
      assert.throws(
        () =>
          toWatchlistPayload({
            provider: 'tmdb',
            providerId: 'abc',
            title: 'X',
          }),
        /could not be verified/,
      );
      assert.throws(
        () =>
          toWatchlistPayload({
            provider: 'imdb',
            providerId: '12',
            title: 'X',
          }),
        /could not be verified/,
      );
    },
  );

  await scenario(
    '5 two members saving the same film at once: one added, one exists, one document',
    async () => {
      const results = await Promise.all([
        curatedAdd(a, A, film(12493, 'High and Low')),
        curatedAdd(b, B, film(12493, 'High and Low')),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [
        'added',
        'exists',
      ]);
      assert.equal(results[0].id, results[1].id);
      assert.ok((await getDoc(ref(a, results[0].id))).exists());
      assert.equal((await catalog(results[0].id)).source.providerId, '12493');
    },
  );

  await scenario('6 a non-member cannot add to the household', async () => {
    await assert.rejects(
      curatedAdd(outsider, OUTSIDER, film(5026, 'Rashomon')),
      (error) => error.code === 'permission-denied',
    );
  });
} finally {
  await env.cleanup();
}
console.log(
  `${total - failures}/${total} scenarios passed; ${failures} failed`,
);
process.exitCode = failures ? 1 : 0;
