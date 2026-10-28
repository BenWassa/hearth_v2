// npx firebase emulators:exec --only firestore --project demo-hearth "node scripts/emulator/recentlyRemoved.emulator.mjs"
// If absent locally: npm install --prefix /tmp/hearth-rules-testing --no-package-lock --ignore-scripts --legacy-peer-deps @firebase/rules-unit-testing@5.0.2
// Share the app SDK: ln -s "$PWD/node_modules/firebase" /tmp/hearth-rules-testing/node_modules/firebase
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  addWatchlistItem,
  removeWatchlistItems,
  restoreWatchlistItems,
  purgeRemovedWatchlistItems,
  subscribeWatchlist,
  wipeWatchlist,
} from '../../src/services/firebase/watchlist.js';
import {
  REMOVAL_TTL,
  PURGE_TTL,
  isRemoved,
} from '../../src/domain/watchlist/removal.js';

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
// Use ESM so compat clients and app functions share the same SDK classes.
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
const claims = { firebase: { sign_in_provider: 'password' } };
const a = env.authenticatedContext(A, claims).firestore();
const b = env.authenticatedContext(B, claims).firestore();
const appId = 'recently-removed-emulator';
const spaceId = `household-${Date.now()}`;
const options = (db) => ({ db, appId, spaceId });
const items = (db) =>
  collection(db, 'artifacts', appId, 'spaces', spaceId, 'watchlist_items');
const ref = (db, id) => doc(items(db), id);
const data = async (id) => (await getDoc(ref(a, id))).data();
const base = (id) => ({
  mediaId: id,
  addedBy: A,
  title: `Title ${id}`,
  type: 'show',
  status: 'watching',
  note: 'Keep this note',
  episodeProgress: { s1: [1, 2] },
  userState: {
    status: 'watching',
    note: 'Keep this note',
    episodeProgress: { s1: [1, 2] },
  },
  createdAt: Timestamp.fromMillis(1000),
  customHouseholdField: { keep: true },
});
const withoutMarkers = ({ removedAt, removedBy, removedItem, ...rest }) => rest;
const outcomes = (result, expected) => {
  assert.deepEqual(
    result.map(({ itemId, status, error }) => ({
      itemId,
      status,
      error: error?.code,
    })),
    expected.map(([itemId, status]) => ({ itemId, status, error: undefined })),
  );
};
let failures = 0;
async function scenario(label, action) {
  try {
    await action();
    console.log(`PASS ${label}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${label}`, error);
  }
}
try {
  // Only fixture creation bypasses rules. Every operation under test uses a client identity.
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'artifacts', appId, 'spaces', spaceId), {
      members: [A, B],
      ownerUid: A,
      name: 'Emulator household',
      nameLower: 'emulator household',
    });
  });
  for (const id of ['one', 'two', 'three', 'active']) {
    await setDoc(ref(a, id), base(id));
    await setDoc(doc(a, 'artifacts', appId, 'media_catalog', id), {
      mediaId: id,
      title: `Catalog ${id}`,
      type: 'show',
      source: { provider: 'tmdb' },
      media: { title: `Catalog ${id}`, type: 'show' },
    });
  }
  await scenario('1 A removes three; markers and retained state', async () => {
    outcomes(
      await removeWatchlistItems({
        ...options(a),
        itemIds: ['one', 'two', 'three'],
        removedBy: A,
      }),
      ['one', 'two', 'three'].map((id) => [id, 'removed']),
    );
    for (const id of ['one', 'two', 'three']) {
      const current = await data(id);
      assert.deepEqual(withoutMarkers(current), base(id));
      assert.equal(current.removedBy, A);
      assert.ok(current.removedAt.toMillis() > Date.now() - 60000);
      assert.equal(current.removedItem.title, `Catalog ${id}`);
      assert.deepEqual(current.removedItem.userState, base(id).userState);
    }
  });
  await scenario(
    '2 real subscription separates active and removed lists',
    async () => {
      let stop;
      try {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error('Subscription timed out')),
            10000,
          );
          let active;
          stop = subscribeWatchlist({
            ...options(b),
            onNext: (snapshot) => {
              active = snapshot.docs.map((d) => d.id).sort();
            },
            onRemoved: (removed) => {
              try {
                assert.deepEqual(active, ['active']);
                assert.deepEqual(removed.map((d) => d.id).sort(), [
                  'one',
                  'three',
                  'two',
                ]);
                assert.ok(
                  removed.every((d) =>
                    d.removedItem.title.startsWith('Catalog'),
                  ),
                );
                clearTimeout(timer);
                resolve();
              } catch (error) {
                clearTimeout(timer);
                reject(error);
              }
            },
            onError: (error) => {
              clearTimeout(timer);
              reject(error);
            },
          });
        });
      } finally {
        stop?.();
      }
    },
  );
  await scenario('3 B restores one with state preserved', async () => {
    outcomes(await restoreWatchlistItems({ ...options(b), itemIds: ['one'] }), [
      ['one', 'restored'],
    ]);
    const current = await data('one');
    assert.equal(isRemoved(current), false);
    assert.deepEqual(withoutMarkers(current), base('one'));
    for (const key of ['removedAt', 'removedBy', 'removedItem'])
      assert.equal(current[key], null);
  });
  await scenario('4 restore after 24h refused without mutation', async () => {
    await updateDoc(ref(a, 'two'), {
      removedAt: Timestamp.fromMillis(Date.now() - REMOVAL_TTL - 1000),
    });
    const before = await data('two');
    outcomes(await restoreWatchlistItems({ ...options(b), itemIds: ['two'] }), [
      ['two', 'expired'],
    ]);
    assert.deepEqual(await data('two'), before);
  });
  await scenario(
    '5 either member purges only removals older than seven days',
    async () => {
      for (const [db, id] of [
        [a, 'old-a'],
        [b, 'old-b'],
      ]) {
        await setDoc(ref(a, id), base(id));
        outcomes(
          await removeWatchlistItems({
            ...options(a),
            itemIds: [id],
            removedBy: A,
          }),
          [[id, 'removed']],
        );
        await updateDoc(ref(a, id), {
          removedAt: Timestamp.fromMillis(Date.now() - PURGE_TTL - 1000),
        });
        outcomes(
          await purgeRemovedWatchlistItems({
            ...options(db),
            itemIds: [id, 'one', 'active', 'two', 'three'],
          }),
          [
            [id, 'purged'],
            ['one', 'skipped'],
            ['active', 'skipped'],
            ['two', 'skipped'],
            ['three', 'skipped'],
          ],
        );
        assert.equal((await getDoc(ref(a, id))).exists(), false);
        for (const keep of ['one', 'active', 'two', 'three'])
          assert.ok(await data(keep));
      }
    },
  );
  await scenario(
    '6 re-add restores, preserving notes, ownership and progress',
    async () => {
      const before = withoutMarkers(await data('three'));
      assert.deepEqual(
        await addWatchlistItem({
          ...options(b),
          payload: {
            mediaId: 'three',
            addedBy: B,
            title: 'Replacement',
            note: 'Overwrite',
            userState: { status: 'unwatched', note: 'Overwrite' },
          },
        }),
        { id: 'three', status: 'restored' },
      );
      assert.deepEqual(withoutMarkers(await data('three')), before);
      assert.equal(isRemoved(await data('three')), false);
    },
  );
  await scenario(
    '7 non-members and unauthenticated clients cannot mark or delete',
    async () => {
      // B is whitelisted but is not a member of this second household: isolates membership from whitelist checks.
      const isolated = `${spaceId}-nonmember`;
      await env.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'artifacts', appId, 'spaces', isolated), {
          members: [A],
        });
        await setDoc(
          doc(
            db,
            'artifacts',
            appId,
            'spaces',
            isolated,
            'watchlist_items',
            'target',
          ),
          base('target'),
        );
      });
      for (const db of [
        b,
        env.authenticatedContext('outsider', claims).firestore(),
        env.unauthenticatedContext().firestore(),
      ]) {
        const target = doc(
          db,
          'artifacts',
          appId,
          'spaces',
          isolated,
          'watchlist_items',
          'target',
        );
        for (const patch of [
          { removedAt: Timestamp.now() },
          { removedBy: B },
          { removedItem: { title: 'Forged' } },
          { removedAt: null, removedBy: null, removedItem: null },
        ]) {
          await assert.rejects(
            updateDoc(target, patch),
            (error) => error.code === 'permission-denied',
          );
        }
        await assert.rejects(
          deleteDoc(target),
          (error) => error.code === 'permission-denied',
        );
      }
    },
  );
  await scenario('8 space wipe deletes removed documents too', async () => {
    assert.equal(isRemoved(await data('two')), true);
    await wipeWatchlist(options(b));
    assert.equal((await getDocs(items(a))).size, 0);
  });
} finally {
  await env.cleanup();
}
console.log(`${8 - failures}/8 scenarios passed; ${failures} failed`);
process.exitCode = failures ? 1 : 0;
