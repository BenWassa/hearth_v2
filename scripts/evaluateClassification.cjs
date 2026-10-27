// Offline by default. Live runs are explicit and resume partial results under
// the same persisted daily attempt budget as production. No private data.
const fs = require('node:fs');
const path = require('node:path');
const fixtures = require('../src/domain/media/classificationFixtures.json');
const gemini = require('../api/_lib/geminiClassifier');
const {
  createClassificationService,
} = require('../api/_lib/classificationService');
const { initializeFirebaseAdmin } = require('../server/firebaseAdmin');
const {
  realFixtures,
  selectLiveFixtures,
  representativeValue,
} = require('./classificationEvaluation.cjs');

const run = async () => {
  const domain = await import('../src/domain/media/classification.mjs');
  const live = process.argv.includes('--gemini');
  const out = path.resolve(
    process.argv.find((a) => a.startsWith('--out='))?.slice(6) ||
      'docs/open/issue-020-evaluation.json',
  );
  const selection = live
    ? selectLiveFixtures(fixtures, process.argv.slice(2))
    : {
        mode: 'all-real',
        keys: realFixtures(fixtures).map(
          (fixture) => domain.classifyMedia(fixture.input).key,
        ),
        fixtures: realFixtures(fixtures),
      };
  const selectedKeys = new Set(selection.keys);
  const runs = live ? 3 : 1;
  if (live) {
    // Match the local server: shell variables win, then local/API/base files.
    for (const envFile of ['.env.local', '.env.api', '.env']) {
      require('dotenv').config({ path: envFile, override: false, quiet: true });
    }
    if (!gemini.enabled()) throw new Error('Missing pilot configuration');
    initializeFirebaseAdmin();
  }
  let previous = {};
  if (live && fs.existsSync(out)) {
    previous = JSON.parse(fs.readFileSync(out));
    if (previous.mode !== 'rules+gemini') previous = {};
    if (
      previous.model &&
      (previous.model !== process.env.GEMINI_MODEL ||
        previous.version !== domain.CLASSIFIER_VERSION ||
        previous.promptVersion !== gemini.PROMPT_VERSION ||
        previous.inferencePolicyVersion !== gemini.INFERENCE_POLICY_VERSION ||
        previous.policyKey !== gemini.policyKey())
    )
      throw new Error(
        'Use a fresh output path after changing model/prompt/policy/version',
      );
    if (
      Array.isArray(previous.selection?.keys) &&
      JSON.stringify(previous.selection.keys) !== JSON.stringify(selection.keys)
    )
      throw new Error(
        'Use a fresh output path after changing evaluation selection',
      );
  }
  const saved = new Map(
    (previous.results || []).map((result) => [result.key, result]),
  );
  const budget = createClassificationService();
  let exhausted = false;
  let attemptedTitlesThisRun = 0;
  let providerAttemptsThisRun = 0;
  const reserveAttempt = async () => {
    const reserved = await budget.reserveAttempt();
    if (reserved) providerAttemptsThisRun += 1;
    return reserved;
  };
  const results = [];
  for (const fixture of fixtures) {
    const baseline = domain.classifyMedia(fixture.input);
    const old = saved.get(baseline.key);
    // Freeze public fixture inputs for a reproducible multi-day comparison.
    const prior = old?.sourceRevision === baseline.sourceRevision ? old : null;
    const predictions = live
      ? (prior?.predictions || []).slice()
      : [baseline.attributes];
    const statuses = live ? (prior?.statuses || []).slice() : ['disabled'];
    const outcomes = live ? (prior?.outcomes || []).slice() : [];
    const synthetic = fixture.input.providerId === '999999999';
    if (
      live &&
      !synthetic &&
      selectedKeys.has(baseline.key) &&
      !exhausted &&
      predictions.length < runs
    ) {
      attemptedTitlesThisRun++;
      while (predictions.length < runs) {
        const response = await gemini.infer({
          input: domain.normalizeClassificationInput(fixture.input),
          reserveAttempt,
        });
        outcomes.push({
          status: response.status,
          reason: response.reason || null,
          providerAttempts: response.providerAttempts || 0,
        });
        if (response.status !== 'complete') {
          exhausted = ['budget', 'quota'].includes(response.status);
          statuses.push(response.status);
          break;
        }
        predictions.push(
          domain.blendClassification(baseline, response.attributes, {
            model: response.model,
            promptVersion: response.promptVersion,
            inferencePolicyVersion: response.inferencePolicyVersion,
          }).attributes,
        );
        statuses.push(response.status);
      }
    }
    results.push({
      key: baseline.key,
      sourceRevision: baseline.sourceRevision,
      synthetic,
      statuses,
      outcomes,
      rules: baseline.attributes,
      predictions,
      expected: fixture.expected,
      reviewerDisagreement: fixture.disagreement,
    });
  }
  const summarize = (select, expectedRuns = runs) => {
    const matrices = Object.fromEntries(
      domain.FACETS.map((name) => [name, {}]),
    );
    const totals = Object.fromEntries(
      domain.FACETS.map((name) => [
        name,
        { agreement: 0, evaluated: 0, unknown: 0, stable: 0 },
      ]),
    );
    for (const result of results.filter((r) => !r.synthetic)) {
      const predictions = select(result);
      if (!predictions.length) continue;
      for (const name of domain.FACETS) {
        const expected = result.expected[name];
        const predicted = representativeValue(predictions, name);
        const cell = `${expected} -> ${predicted}`;
        matrices[name][cell] = (matrices[name][cell] || 0) + 1;
        totals[name].evaluated++;
        totals[name].agreement += expected === predicted ? 1 : 0;
        totals[name].unknown += predicted === 'unknown' ? 1 : 0;
        totals[name].stable +=
          predictions.length === expectedRuns &&
          predictions.every((p) => p[name].value === predicted)
            ? 1
            : 0;
      }
    }
    const metrics = Object.fromEntries(
      Object.entries(totals).map(([name, t]) => [
        name,
        {
          count: t.evaluated,
          agreement: t.evaluated ? t.agreement / t.evaluated : null,
          unavailableRate: t.evaluated ? t.unknown / t.evaluated : null,
          stability: t.evaluated ? t.stable / t.evaluated : null,
        },
      ]),
    );
    return { metrics, confusionMatrices: matrices };
  };
  const rules = summarize((r) => [r.rules], 1);
  const hybrid = live ? summarize((r) => r.predictions) : null;
  const real = results.filter((r) => !r.synthetic);
  const selected = real.filter((r) => selectedKeys.has(r.key));
  const complete =
    real.length >= 50 && real.every((r) => r.predictions.length === runs);
  const completedTitleCount = real.filter(
    (r) => r.predictions.length === runs,
  ).length;
  const everAttemptedTitleCount = real.filter((r) =>
    (r.statuses || []).some((status) => status !== 'disabled'),
  ).length;
  const previousProviderAttempts = Number.isInteger(
    previous.providerAttemptsTotal,
  )
    ? previous.providerAttemptsTotal
    : 0;
  const providerAttemptsTotal =
    previousProviderAttempts + providerAttemptsThisRun;
  const subjective = domain.FACETS.filter((f) => f !== 'curatedClassic');
  const passed =
    live &&
    complete &&
    fixtures
      .filter((f) => f.input.providerId !== '999999999')
      .every((f) => f.review === 'approved') &&
    subjective.every(
      (f) =>
        hybrid.metrics[f].agreement >= 0.8 &&
        hybrid.metrics[f].unavailableRate <= 0.35 &&
        hybrid.metrics[f].stability >= 0.95,
    );
  const report = {
    version: domain.CLASSIFIER_VERSION,
    promptVersion: gemini.PROMPT_VERSION,
    inferencePolicyVersion: gemini.INFERENCE_POLICY_VERSION,
    policyKey: live ? gemini.policyKey() : 'rules',
    model: live ? process.env.GEMINI_MODEL : null,
    mode: live ? 'rules+gemini' : 'rules',
    runsPerTitle: runs,
    thresholds: {
      agreement: 0.8,
      unavailableRate: 0.35,
      stability: 0.95,
      approvedHumanFixture: true,
    },
    rolloutPassed: Boolean(passed),
    liveEvaluationComplete: live && complete,
    fixtureReview:
      'agent-reviewed pilot labels remain human-unapproved; all rollout labels require explicit independent human approval',
    selection: {
      mode: selection.mode,
      keys: selection.keys,
    },
    evaluationCounts: {
      fixtureCount: fixtures.length,
      realFixtureCount: real.length,
      selectedTitleCount: selected.length,
      attemptedTitleCountThisRun: attemptedTitlesThisRun,
      everAttemptedTitleCount,
      titlesWithPredictions: real.filter((r) => r.predictions.length > 0)
        .length,
      completedTitleCount,
      completedSelectedTitleCount: selected.filter(
        (r) => r.predictions.length === runs,
      ).length,
      providerAttemptsThisRun,
      providerAttemptsTotal,
    },
    providerAttemptsTotal,
    rules,
    hybrid,
    results,
  };
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify(
      {
        out,
        mode: report.mode,
        selection: report.selection,
        evaluationCounts: report.evaluationCounts,
        rolloutPassed: report.rolloutPassed,
        rules: rules.metrics,
        hybrid: hybrid?.metrics || null,
      },
      null,
      2,
    ),
  );
};
run().catch(() => {
  console.error(
    'Classification evaluation unavailable; check configuration, output version, credentials and daily budget. No provider response or secret is logged.',
  );
  process.exitCode = 1;
});
