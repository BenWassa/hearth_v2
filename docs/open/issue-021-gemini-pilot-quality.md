# Issue #21 — Gemini pilot quality and production rollout gate

- **Status:** Open — code/evaluation improvements prepared; fixture approval complete; live re-evaluation remains.
- **GitHub issue:** https://github.com/BenWassa/hearth_v2/issues/21
- **Branch:** `chore/fixtures-reviewed`
- **Date:** 2026-10-28
- **Parent:** #20 automatic classification

## Scope

The five-title `gemini-3.5-flash-lite` pilot proved the server path, shared daily budget, schema validation and resumable evaluator, but it did not meet the rollout gates. This follow-up separates fixture quality, evaluator defects, prompt/inference policy and model variability before any production enablement.

Production Gemini remains disabled. This branch does not authorize additional live calls or a catalog backfill.

## Findings from the saved pilot

The original pilot contained 15 valid predictions from 17 provider attempts across Paddington 2, The Intern, The Martian, Legally Blonde and The School of Rock. The saved report used the first prediction for agreement even though three predictions were collected, so agreement depended on run ordering. `--limit=5` also meant “five unfinished titles this invocation”; after those completed, a later resume could silently advance to new titles.

The request set `temperature: 0`. Current Google Gemini documentation says Gemini 3.5 Flash-Lite deprecates and ignores sampling parameters including temperature and recommends explicit instructions instead. The pilot therefore did not establish deterministic temperature-zero behavior. Google also documents `minimal` as the default/recommended thinking level for high-volume classification on this model and recommends clear JSON Schema descriptions.

References checked 2026-10-27:

- https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/generate-content/thinking

## Five-title adjudication

The initial five-title adjudications below were independent agent reviews, not approval at that time. On 2026-10-28, all 50 real fixtures were approved through the owner-delegated three-reviewer blind process (Codex, Claude Sonnet, Claude Opus), with lead spot check and owner delegation recorded. Every real fixture must still have `review === "approved"` to pass rollout.

| Title | Changed labels | Rationale |
| --- | --- | --- |
| Paddington 2 | plot momentum low → medium; visual unknown → medium | Clear quest/heist/rescue progression; vibrant hybrid presentation supports noticeable visual authorship without asserting exceptional/high craft. |
| The Intern | visual unknown → low | Gentle, straightforward workplace/relationship comedy remains high-comfort and low-momentum; visual presentation is adjudicated as conventional rather than unresolved. |
| The Martian | narrative complexity high → medium; visual unknown → high; attention high → medium | Mostly linear mainstream survival story with parallel Earth/Mars problem-solving; strong visual identity; technical detail requires attention but does not make the narrative densely difficult. |
| Legally Blonde | visual unknown → medium | Strongly authored pink/fashion identity supports a medium visual signal; other labels remain. |
| The School of Rock | comfort medium → high; visual unknown → low | Explicit comforting evidence already forces high comfort in deterministic rules, so the old gold label was impossible for the hybrid to match. Visual presentation is adjudicated as conventional. |

Each fixture preserves a detailed disagreement note; the subsequent delegated review approved the answer key.

### Re-score of the saved v1 predictions

No new provider calls were made for this re-score. Applying the adjudicated labels and majority-vote agreement to the existing three predictions per title changes the five-title v1 picture to:

| Facet | Agreement | Stability | Majority unknown |
| --- | ---: | ---: | ---: |
| Comfort | 80% | 80% | 0% |
| Comedy first | 100% | 100% | 0% |
| Plot momentum | 80% | 60% | 20% |
| Narrative complexity | 80% | 100% | 0% |
| Visual distinctiveness | 0% | 20% | 80% |
| Attention demand | 100% | 80% | 0% |

This isolates the remaining problem more clearly: most non-visual agreement is already at the provisional 80% threshold after benchmark cleanup, but repeat stability still fails for comfort, plot momentum and attention demand, and visual distinctiveness remains unusable. Prompt/policy v2 therefore targets rubric clarity and visual calibration rather than changing the model at the same time.

## Implemented candidate policy

- Classifier version: `viewing-2`.
- Prompt: `viewing-prompt-2`.
- Inference policy: `gemini-policy-2`.
- Cache policy key includes model + prompt + inference-policy version.
- Removed deprecated `temperature: 0`.
- Explicit `thinkingLevel: minimal`.
- Added per-facet JSON Schema descriptions and level anchors.
- Narrowed deterministic complexity rules: generic `complex` no longer proves narrative complexity; bare nonlinear structure is medium complexity/attention, while stronger signals such as unreliable narrator, mind-bending or time paradox remain high.
- Added a rollout-blocking rule/fixture consistency check for opposing low/high labels, with adjacent differences reported separately.
- Added safe diagnostic reasons for invalid/upstream/timeout outcomes without storing model text.
- Gemini results carry provider-attempt count plus prompt/policy identity into blend metadata.

No model change is proposed yet. Changing the model now would confound prompt, fixture and evaluator changes.

## Evaluator changes

- `--limit=N` selects a stable prefix of N real fixtures on every invocation.
- `--keys=a,b,c` selects exact canonical titles and rejects unknown or duplicate keys.
- Agreement uses the majority value across repeated predictions; stability remains a separate all-runs-equal metric.
- Output distinguishes total fixtures, real fixtures, selected titles, attempted titles, completed titles and provider attempts.
- Results preserve safe outcome diagnostics alongside status history.
- Resume compatibility requires classifier, model, prompt, inference-policy, policy-key identity and the exact same title selection.
- The report lists two-step conflicts in `ruleExpectedConflicts`; rollout requires that list to be empty. Adjacent differences appear in `ruleExpectedOneStepDifferences` and never block rollout.

### Rule consistency policy

Rule consistency tolerates one ordinal step on low → medium → high: three independent human-level reviewers differ by one level on about a fifth of facet labels, so conservative keyword rules should not override the reviewed answer key on adjacent judgments. Only two-step low/high differences block rollout; one-step differences remain visible in `ruleExpectedOneStepDifferences` as informational entries. Unknown in either direction is non-blocking because insufficient evidence is not a contradictory level. Agreement, stability, live completion and approval gates remain required.

The exact five canonical pilot keys are:

`tmdb:movie:346648`, `tmdb:movie:257211`, `tmdb:movie:286217`, `tmdb:movie:8835`, `tmdb:movie:1584`.

## Verification

Local verification on 2026-10-28 passed: `npm run format:check`, `npm run lint:ci` (zero warnings), and `npm run test` (58 unit-test files / 470 unit tests, 47 API tests). Ran Prettier on all four touched files and `graphify update .`. The offline 50-real-title report at `/tmp/offline-check.json` records zero conflicts, three informational one-step differences, zero provider attempts, `liveEvaluationComplete: false` and `rolloutPassed: false`. No live evaluation was run.

## Remaining gates

1. Preserve approved status for all 50 real fixture labels under the recorded owner delegation.
2. Run a new owner-approved five-title v2 pilot using a fresh output file.
3. Complete all 50 titles with three valid predictions each within approved quotas.
4. Meet >=80% agreement, <=35% unknown and >=95% repeated-run stability on every subjective facet.
5. Confirm metadata-sharing permission, account-specific provider quota and production billing/smoke behavior.
6. Keep production Gemini disabled until all gates pass.

## Preview before approving live calls

```sh
node scripts/evaluateClassification.cjs --gemini --dry-run --limit=5 --out=/tmp/gemini-preview.json
# Or select exact canonical keys with --keys=tmdb:movie:346648,tmdb:movie:257211
```

This needs no enablement variables or API key and makes zero network calls. It does not read credentials, dotenv files, Firestore or the daily budget. The JSON shows each selected real title's production allowlisted metadata projection, exact shared production request body (system/user prompts, schema and generation config), model from `GEMINI_MODEL` or a labelled placeholder, and placeholder authentication. Temperature is explicitly documented as omitted by production; thinking level is `minimal`. Without `--out`, JSON prints to stdout; with it, stdout contains a short plan summary.

The plan uses three predictions per title and estimates attempts as `ceil(predictions × 17 / 15)` from the observed pilot. Estimated UTC days are `ceil(estimated attempts / daily cap)`, assuming the full cap is available each day; existing usage is never inspected. The shared production cap defaults to 20, clamps integer values to 0–100, and fails closed to 0 for invalid values. A zero cap reports no completion estimate. These estimates do not guarantee retry counts or completion. No call is made by this command; live calls still require owner approval.

## 2026-10-28 update: answer key review and v2 pilot

### Answer key (fixture labels)
The 50 real fixtures were re-labelled by three independent blind reviewers (Codex gpt-6.1-sol, Claude Sonnet, Claude Opus). Each saw only the film details and the production rubric, never an earlier label or any model output. Majority wins; the single three-way split (Jurassic Park, attention demand) resolves to the middle level. The owner delegated approval and the lead agent spot-checked recognisable titles.

- 231 of 306 labels unanimous; 305 of 306 have a majority.
- Reviewer agreement with the final key: Codex 87%, Claude Sonnet 91%, Claude Opus 97%. The old provisional labels matched on only 149 of 306 (they used "unknown" for 24% of cells; the key uses it for 2%).
- Rule consistency: only contradictions two or more levels apart block rollout. Three one-step differences are listed in the offline report and do not block.

### v2 pilot (5 films, three predictions each, 14 provider calls of the 20-call daily cap)
Raw report: `issue-021-gemini-pilot-v2-2026-10-28.json`.

| Aspect | Agreement with key | Unknown | Same answer in all three runs |
| --- | --- | --- | --- |
| Comfort | 100% | 0% | 80% |
| Comedy first | 60% | 0% | 80% |
| Plot momentum | 80% | 0% | 80% |
| Narrative complexity | 80% | 0% | 80% |
| Visual distinctiveness | 60% | 20% | 40% |
| Attention demand | 100% | 0% | 80% |

Four of five films completed three valid predictions. Agreement and unknown rate are close to the bars on five films; repeat stability is far below the 95% bar on every aspect.

### Finding: repeat stability
The model gives a different answer on a repeat run in 20% to 60% of cases. Public references suggest sampling controls (temperature, top-p, top-k) are not reliable levers on this model family, and the production request sets none, so stability cannot simply be forced. A stored label is computed once per title and cached for 30 days, so what matters operationally is whether that one label matches the key and whether a majority of three runs does. Proposed replacement for the stability gate (owner decision pending): majority-of-three agreement with the key at least 80% per aspect, single-run agreement at least 75%.

### Quota
The 50-title three-run evaluation needs about 170 provider calls: about 9 UTC days at a cap of 20, or 2 days at a cap of 100 (the hard ceiling in code), subject to the actual Google quota (owner to confirm).
