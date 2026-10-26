// Run only against an isolated Firestore emulator. No production SDK connection.
// Example: firebase emulators:exec --only firestore --project demo-hearth-collections \
//   'node scripts/testCollectionPreferenceRules.cjs'
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  Timestamp,
} = require('firebase/firestore');

const address = process.env.FIRESTORE_EMULATOR_HOST;
assert(
  address,
  'FIRESTORE_EMULATOR_HOST is required; this test never targets production.',
);
const projectId = 'demo-hearth-collections';
const [host, port] = address.split(':');
const apps = [];
const memberId = 'CdP5YrCYW1d1RjqVQVbnm5QJCLV2';
const otherTrustedId = '7lGXb8XSW4NVSoIPWW8udn3tntK2';
let checks = 0;
const dbFor = (uid, provider = 'google.com') => {
  const app = initializeApp({ projectId }, `rules-${apps.length}`);
  apps.push(app);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, host, Number(port), {
    mockUserToken: {
      sub: uid,
      user_id: uid,
      firebase: { sign_in_provider: provider },
    },
  });
  return db;
};
const path = (db, key = 'tmdb:263', spaceId = 'household') =>
  doc(
    db,
    'artifacts',
    'test-app',
    'spaces',
    spaceId,
    'collection_preferences',
    key,
  );
const denied = async (label, operation) => {
  await assert.rejects(
    operation,
    (error) => error.code === 'permission-denied',
    label,
  );
  checks++;
};
const allowed = async (label, operation) => {
  await operation;
  checks++;
  console.log(`PASS ${label}`);
};
const seed = async (members) => {
  const response = await fetch(
    `http://${address}/v1/projects/${projectId}/databases/(default)/documents/artifacts/test-app/spaces/household`,
    {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer owner',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          members: {
            arrayValue: {
              values: members.map((uid) => ({ stringValue: uid })),
            },
          },
        },
      }),
    },
  );
  assert.equal(response.ok, true, await response.text());
};
(async () => {
  try {
    await seed([memberId]);
    const member = dbFor(memberId),
      other = dbFor(otherTrustedId),
      stranger = dbFor('not-whitelisted'),
      anonymous = dbFor('demo-visitor', 'anonymous');
    await allowed(
      'member creates explicit hide',
      setDoc(path(member), { visible: false, updatedAt: serverTimestamp() }),
    );
    assert.equal((await getDoc(path(member))).data().visible, false);
    checks++;
    await allowed(
      'member lists household overrides',
      getDocs(
        collection(
          member,
          'artifacts',
          'test-app',
          'spaces',
          'household',
          'collection_preferences',
        ),
      ),
    );
    await denied('other trusted nonmember cannot read', getDoc(path(other)));
    await denied(
      'other trusted nonmember cannot change',
      setDoc(path(other), { visible: true, updatedAt: serverTimestamp() }),
    );
    await denied('untrusted user cannot read', getDoc(path(stranger)));
    await denied(
      'untrusted user cannot create',
      setDoc(path(stranger, 'tmdb:264'), {
        visible: true,
        updatedAt: serverTimestamp(),
      }),
    );
    await denied(
      'cross-household writes stay denied',
      setDoc(path(member, 'tmdb:263', 'other-household'), {
        visible: true,
        updatedAt: serverTimestamp(),
      }),
    );
    await denied(
      'anonymous template preferences cannot persist',
      setDoc(path(anonymous, 'tmdb:263', 'template-demo-space'), {
        visible: true,
        updatedAt: serverTimestamp(),
      }),
    );
    for (const [label, key, data] of [
      [
        'wrong visibility type',
        'tmdb:264',
        { visible: 'show', updatedAt: serverTimestamp() },
      ],
      ['missing visibility', 'tmdb:264', { updatedAt: serverTimestamp() }],
      ['missing timestamp', 'tmdb:264', { visible: true }],
      [
        'extra privilege field',
        'tmdb:264',
        { visible: true, updatedAt: serverTimestamp(), role: 'admin' },
      ],
      [
        'forged historical timestamp',
        'tmdb:264',
        { visible: true, updatedAt: Timestamp.fromMillis(0) },
      ],
      [
        'invalid identity',
        'tmdb:264.extra',
        { visible: true, updatedAt: serverTimestamp() },
      ],
      [
        'overlong provider identity',
        `${'x'.repeat(21)}:264`,
        { visible: true, updatedAt: serverTimestamp() },
      ],
      [
        'overlong collection identity',
        `tmdb:${'x'.repeat(81)}`,
        { visible: true, updatedAt: serverTimestamp() },
      ],
    ])
      await denied(label, setDoc(path(member, key), data));
    await denied(
      'valid create cannot bypass validation through update',
      setDoc(path(member), {
        visible: false,
        updatedAt: serverTimestamp(),
        rawHistory: ['private'],
      }),
    );
    await allowed(
      'member can change hide to show',
      setDoc(path(member), { visible: true, updatedAt: serverTimestamp() }),
    );
    await seed([memberId, otherTrustedId]);
    await allowed('another member sees shared value', getDoc(path(other)));
    await allowed(
      'another member can change the shared preference',
      setDoc(path(other), { visible: false, updatedAt: serverTimestamp() }),
    );
    assert.equal((await getDoc(path(member))).data().visible, false);
    checks++;
    await denied('stranger cannot delete', deleteDoc(path(stranger)));
    await allowed(
      'member resets by deleting the override',
      deleteDoc(path(member)),
    );
    assert.equal((await getDoc(path(member))).exists(), false);
    checks++;
    console.log(`${checks} Firestore preference rule checks passed.`);
  } finally {
    await Promise.all(apps.map(deleteApp));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
