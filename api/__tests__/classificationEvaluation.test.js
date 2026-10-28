const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  selectLiveFixtures,
  findRuleExpectedConflicts,
  findRuleExpectedOneStepDifferences,
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

test('two-step rule differences block consistency; one-step differences are informational', () => {
  for (const rule of ['low', 'medium', 'high', 'unknown']) {
    for (const expected of ['low', 'medium', 'high', 'unknown']) {
      const results = [
        {
          key: 'tmdb:movie:1',
          rules: { comfort: { value: rule } },
          expected: { comfort: expected },
        },
      ];
      const levels = ['low', 'medium', 'high'];
      const distance =
        rule === 'unknown' || expected === 'unknown'
          ? 0
          : Math.abs(levels.indexOf(rule) - levels.indexOf(expected));
      const entry = { key: 'tmdb:movie:1', facet: 'comfort', rule, expected };
      const conflicts = findRuleExpectedConflicts(results);
      assert.deepEqual(conflicts, distance === 2 ? [entry] : []);
      assert.equal(
        conflicts.length === 0,
        distance !== 2,
        'consistency gate only blocks two-step differences',
      );
      assert.deepEqual(
        findRuleExpectedOneStepDifferences(results),
        distance === 1 ? [entry] : [],
      );
    }
  }
  assert.deepEqual(findRuleExpectedConflicts(), []);
  assert.deepEqual(findRuleExpectedOneStepDifferences(), []);
  assert.deepEqual(
    findRuleExpectedConflicts([{ rules: { comfort: { value: 'high' } } }]),
    [],
  );
});

test('Gemini preview shares live selection and request body without network or credential access', async () => {
  const {
    buildGeminiDryRun,
  } = require('../../scripts/classificationEvaluation.cjs');
  const gemini = require('../_lib/geminiClassifier');
  const domain = await import('../../src/domain/media/classification.mjs');
  const originalFetch = global.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  const originalLimit = process.env.GEMINI_DAILY_REQUEST_LIMIT;
  let calls = 0;
  global.fetch = () => {
    calls++;
    throw new Error('Network forbidden');
  };
  process.env.GEMINI_API_KEY = 'dummy-secret';
  delete process.env.GEMINI_MODEL;
  delete process.env.GEMINI_DAILY_REQUEST_LIMIT;
  try {
    for (const args of [['--limit=2'], ['--keys=tmdb:tv:3,tmdb:movie:1']]) {
      const report = await buildGeminiDryRun(fixtures, args);
      assert.deepEqual(
        report.selection.keys,
        selectLiveFixtures(fixtures, args).keys,
      );
      assert.equal(report.requests.length, 2);
      assert.equal(JSON.stringify(report).includes('dummy-secret'), false);
      assert.match(report.requests[0].model, /not configured/);
      const selected = selectLiveFixtures(fixtures, args).fixtures[0];
      const input = domain.normalizeClassificationInput(selected.input);
      assert.deepEqual(
        report.requests[0].body,
        gemini.buildRequestBody(input, domain.FACETS, domain.LEVELS),
      );
      assert.deepEqual(Object.keys(report.requests[0].publicMetadata), [
        'title',
        'type',
        'year',
        'genres',
        'keywords',
      ]);
      assert.equal(
        report.requests[0].body.generationConfig.temperature,
        undefined,
      );
      assert.deepEqual(
        report.requests[0].body.generationConfig.thinkingConfig,
        { thinkingLevel: 'minimal' },
      );
      assert.equal(report.plan.totalPredictions, 6);
      assert.equal(report.plan.estimatedProviderAttempts, 7);
      assert.equal(report.plan.dailyCap, 20);
      assert.equal(report.plan.utcDaysNeededEstimate, 1);
    }
    process.env.GEMINI_MODEL = 'preview-model';
    process.env.GEMINI_DAILY_REQUEST_LIMIT = '2';
    const report = await buildGeminiDryRun(fixtures);
    assert.equal(report.requests[0].model, 'preview-model');
    assert.equal(report.plan.totalPredictions, 9);
    assert.equal(report.plan.estimatedProviderAttempts, 11);
    assert.equal(report.plan.utcDaysNeededEstimate, 6);
    process.env.GEMINI_DAILY_REQUEST_LIMIT = '999';
    assert.equal((await buildGeminiDryRun(fixtures)).plan.dailyCap, 100);
    for (const limit of ['0', '-1', '1.5', 'invalid']) {
      process.env.GEMINI_DAILY_REQUEST_LIMIT = limit;
      const blocked = await buildGeminiDryRun(fixtures);
      assert.equal(blocked.plan.dailyCap, 0);
      assert.equal(blocked.plan.utcDaysNeededEstimate, null);
    }
    assert.equal(calls, 0);
    assert.deepEqual(
      gemini.projectPublicMetadata({
        title: 'Public',
        note: 'private',
        householdId: 'private',
      }),
      {
        title: 'Public',
        type: undefined,
        year: undefined,
        genres: undefined,
        keywords: undefined,
      },
    );
  } finally {
    global.fetch = originalFetch;
    for (const [name, value] of Object.entries({
      GEMINI_API_KEY: originalKey,
      GEMINI_MODEL: originalModel,
      GEMINI_DAILY_REQUEST_LIMIT: originalLimit,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('Gemini dry-run CLI never loads Firebase/dotenv or reads credentials and writes JSON', () => {
  const { spawnSync } = require('node:child_process');
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'classification-preview-'),
  );
  const output = path.join(directory, 'preview.json');
  const script = `
    const Module = require('node:module');
    const originalLoad = Module._load;
    Module._load = function(name, ...args) {
      if (/firebase|dotenv|classificationService/.test(name)) throw new Error('Forbidden module: ' + name);
      return originalLoad.call(this, name, ...args);
    };
    global.fetch = () => { throw new Error('Forbidden network'); };
    process.env = new Proxy(process.env, { get(target, name) {
      if (name === 'GEMINI_API_KEY' || name === 'GEMINI_API') throw new Error('Forbidden credential read');
      return target[name];
    }});
    process.argv = ['node', 'evaluateClassification.cjs', '--gemini', '--dry-run', '--limit=5', '--out=' + ${JSON.stringify(
      output,
    )}];
    require('../../scripts/evaluateClassification.cjs');
  `;
  try {
    const result = spawnSync(process.execPath, ['-e', script], {
      cwd: __dirname,
      encoding: 'utf8',
      env: { PATH: process.env.PATH, GEMINI_API_KEY: 'dummy-secret' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /No call was made/);
    const json = fs.readFileSync(output, 'utf8');
    assert.equal(
      (json + result.stdout + result.stderr).includes('dummy-secret'),
      false,
    );
    const report = JSON.parse(json);
    assert.equal(report.requests.length, 5);
    assert.equal(report.plan.totalPredictions, 15);
    assert.equal(report.plan.estimatedProviderAttempts, 17);
    assert.equal(report.plan.utcDaysNeededEstimate, 1);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
