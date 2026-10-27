const fixtureKey = (fixture = {}) => {
  const input = fixture.input || {};
  const providerId = String(input.providerId || '').trim();
  if (!/^\d+$/.test(providerId)) return '';
  return `tmdb:${input.type === 'show' ? 'tv' : 'movie'}:${providerId}`;
};

const realFixtures = (fixtures = []) =>
  fixtures.filter((fixture) => fixture.input?.providerId !== '999999999');

const selectLiveFixtures = (fixtures = [], args = []) => {
  const real = realFixtures(fixtures);
  const explicitArg = args.find((arg) => arg.startsWith('--keys='));
  if (explicitArg) {
    const keys = explicitArg
      .slice(7)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (!keys.length) throw new Error('--keys requires at least one key');
    if (new Set(keys).size !== keys.length)
      throw new Error('--keys contains duplicate keys');
    const byKey = new Map(
      real.map((fixture) => [fixtureKey(fixture), fixture]),
    );
    const unknown = keys.filter((key) => !byKey.has(key));
    if (unknown.length)
      throw new Error(`Unknown evaluation key(s): ${unknown.join(', ')}`);
    return {
      mode: 'explicit-keys',
      keys,
      fixtures: keys.map((key) => byKey.get(key)),
    };
  }

  const limitArg = args.find((arg) => arg.startsWith('--limit='));
  if (limitArg) {
    const raw = Number(limitArg.slice(8));
    if (!Number.isInteger(raw) || raw < 1)
      throw new Error('--limit must be a positive integer');
    const chosen = real.slice(0, Math.min(raw, real.length));
    return {
      mode: 'prefix-limit',
      keys: chosen.map(fixtureKey),
      fixtures: chosen,
    };
  }

  return {
    mode: 'all-real',
    keys: real.map(fixtureKey),
    fixtures: real,
  };
};

const findRuleExpectedConflicts = (results = []) =>
  results.flatMap((result) =>
    Object.entries(result.rules || {})
      .filter(
        ([name, signal]) =>
          signal?.value &&
          signal.value !== 'unknown' &&
          result.expected?.[name] !== signal.value,
      )
      .map(([facet, signal]) => ({
        key: result.key,
        facet,
        rule: signal.value,
        expected: result.expected?.[facet] ?? null,
      })),
  );

const representativeValue = (predictions = [], facet) => {
  if (!predictions.length) return null;
  const values = predictions
    .map((prediction) => prediction?.[facet]?.value)
    .filter(Boolean);
  if (!values.length) return null;
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  const ranked = [...counts.entries()].sort(
    ([leftValue, leftCount], [rightValue, rightCount]) =>
      rightCount - leftCount || leftValue.localeCompare(rightValue),
  );
  if (values.length === 1) return ranked[0][0];
  return ranked[0][1] > values.length / 2 ? ranked[0][0] : 'unknown';
};

module.exports = {
  fixtureKey,
  realFixtures,
  selectLiveFixtures,
  findRuleExpectedConflicts,
  representativeValue,
};
