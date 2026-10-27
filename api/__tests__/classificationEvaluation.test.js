const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  selectLiveFixtures,
  representativeValue,
} = require('../../scripts/classificationEvaluation.cjs');

const fixtures = [
  { input: { providerId: '1', type: 'movie', title: 'One' } },
  { input: { providerId: '2', type: 'movie', title: 'Two' } },
  { input: { providerId: '3', type: 'show', title: 'Three' } },
  { input: { providerId: '999999999', type: 'movie', title: 'Synthetic' } },
];

test('classification evaluation uses stable prefix limits and explicit canonical keys', () => {
  const limited = selectLiveFixtures(fixtures, ['--limit=2']);
  assert.equal(limited.mode, 'prefix-limit');
  assert.deepEqual(limited.keys, ['tmdb:movie:1', 'tmdb:movie:2']);
  assert.deepEqual(
    selectLiveFixtures(fixtures, ['--limit=2']).keys,
    limited.keys,
  );

  const explicit = selectLiveFixtures(fixtures, [
    '--keys=tmdb:tv:3,tmdb:movie:1',
  ]);
  assert.equal(explicit.mode, 'explicit-keys');
  assert.deepEqual(explicit.keys, ['tmdb:tv:3', 'tmdb:movie:1']);
  assert.deepEqual(
    explicit.fixtures.map((fixture) => fixture.input.title),
    ['Three', 'One'],
  );

  assert.throws(
    () => selectLiveFixtures(fixtures, ['--keys=tmdb:movie:404']),
    /Unknown evaluation key/,
  );
  assert.throws(
    () => selectLiveFixtures(fixtures, ['--keys=tmdb:movie:1,tmdb:movie:1']),
    /duplicate keys/,
  );
});

test('classification evaluation uses majority predictions for agreement while leaving instability visible', () => {
  const prediction = (value) => ({ comfort: { value } });
  assert.equal(
    representativeValue(
      [prediction('high'), prediction('medium'), prediction('medium')],
      'comfort',
    ),
    'medium',
  );
  assert.equal(
    representativeValue(
      [prediction('low'), prediction('medium'), prediction('high')],
      'comfort',
    ),
    'unknown',
  );
  assert.equal(representativeValue([prediction('high')], 'comfort'), 'high');
});
