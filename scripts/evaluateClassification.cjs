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

const run = async () => {
  const domain = await import('../src/domain/media/classification.mjs');
  const live = process.argv.includes('--gemini');
  const out = path.resolve(
    process.argv.find((a) => a.startsWith('--out='))?.slice(6) ||
      'docs/open/issue-020-evaluation.json',
  );
  const limit = Math.min(
    fixtures.length,
    Math.max(
      1,
      Number(
        process.argv.find((a) => a.startsWith('--limit='))?.slice(8) ||
          fixtures.length,
      ),
    ),
  );
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
        previous.promptVersion !== gemini.PROMPT_VERSION)
    )
      throw new Error(
        'Use a fresh output path after changing model/prompt/version',
      );
  }
  const saved = new Map(
    (previous.results || []).map((result) => [result.key, result]),
  );
  const budget = createClassificationService();
  let exhausted = false;
  let attemptedTitles = 0;
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
    const synthetic = fixture.input.providerId === '999999999';
    if (
      live &&
      !synthetic &&
      !exhausted &&
      predictions.length < runs &&
      attemptedTitles < limit
    ) {
      attemptedTitles++;
      while (predictions.length < runs) {
        const response = await gemini.infer({
          input: domain.normalizeClassificationInput(fixture.input),
          reserveAttempt: budget.reserveAttempt,
        });
        if (response.status !== 'complete') {
          exhausted = ['budget', 'quota'].includes(response.status);
          statuses.push(response.status);
          break;
        }
        predictions.push(
          domain.blendClassification(
            baseline,
            response.attributes,
            response.model,
          ).attributes,
        );
        statuses.push(response.status);
      }
    }
    results.push({
      key: baseline.key,
      sourceRevision: baseline.sourceRevision,
      synthetic,
      statuses,
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
        const predicted = predictions[0][name].value;
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
  const complete =
    real.length >= 50 && real.every((r) => r.predictions.length === runs);
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
    fixtureReview: 'provisional until independent reviewers approve',
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
        titles: real.length,
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
