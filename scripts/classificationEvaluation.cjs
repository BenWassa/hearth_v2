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

// Unknown means insufficient evidence, not an opposing ordinal level.
const ordinalLevels = ['low', 'medium', 'high'];
const findRuleExpectedDifferences = (results, matchesDistance) =>
  results.flatMap((result) =>
    Object.entries(result.rules || {})
      .filter(([name, signal]) => {
        const rule = ordinalLevels.indexOf(signal?.value);
        const expected = ordinalLevels.indexOf(result.expected?.[name]);
        return (
          rule >= 0 &&
          expected >= 0 &&
          matchesDistance(Math.abs(rule - expected))
        );
      })
      .map(([facet, signal]) => ({
        key: result.key,
        facet,
        rule: signal.value,
        expected: result.expected[facet],
      })),
  );

const findRuleExpectedConflicts = (results = []) =>
  findRuleExpectedDifferences(results, (distance) => distance >= 2);

const findRuleExpectedOneStepDifferences = (results = []) =>
  findRuleExpectedDifferences(results, (distance) => distance === 1);

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
  findRuleExpectedOneStepDifferences,
  representativeValue,
};

// No enablement check, credential access, provider calls or budget reservations.
const buildGeminiDryRun = async (fixtures, args = []) => {
  const domain = await import('../src/domain/media/classification.mjs');
  const gemini = require('../api/_lib/geminiClassifier');
  const selection = selectLiveFixtures(fixtures, args);
  const model = process.env.GEMINI_MODEL || '<GEMINI_MODEL: not configured>';
  const predictionsPerTitle = 3;
  const totalPredictions = selection.fixtures.length * predictionsPerTitle;
  const estimatedProviderAttempts = Math.ceil((totalPredictions * 17) / 15);
  const dailyCap = gemini.dailyRequestLimit();
  return {
    mode: 'gemini-dry-run',
    statement: 'No call was made. No daily budget was read or reserved.',
    selection: { mode: selection.mode, keys: selection.keys },
    plan: {
      titlesSelected: selection.fixtures.map((fixture) => fixture.input.title),
      predictionsPerTitle,
      totalPredictions,
      estimatedProviderAttempts,
      estimateBasis:
        'Estimate: observed 17 provider attempts per 15 predictions; rounded up. Not a guarantee or retry maximum.',
      dailyCap,
      dailyCapHardCeiling: 100,
      utcDaysNeededEstimate:
        dailyCap > 0 ? Math.ceil(estimatedProviderAttempts / dailyCap) : null,
      schedulingAssumption:
        'Full daily cap available each UTC day; existing budget usage is not inspected. Zero cap prevents completion.',
    },
    requests: selection.fixtures.map((fixture, index) => {
      const input = domain.normalizeClassificationInput(fixture.input);
      return {
        key: selection.keys[index],
        model,
        publicMetadata: gemini.projectPublicMetadata(input),
        method: 'POST',
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': '<credential supplied only for live calls>',
        },
        body: gemini.buildRequestBody(input, domain.FACETS, domain.LEVELS),
        temperaturePolicy:
          'Temperature omitted from the production request (model default; deprecated/ignored for Gemini 3.5 Flash-Lite).',
      };
    }),
  };
};
module.exports.buildGeminiDryRun = buildGeminiDryRun;
