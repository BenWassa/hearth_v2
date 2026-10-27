# Issue #21 — Gemini pilot quality and production rollout gate

- **Status:** Open — code/evaluation improvements prepared; live re-evaluation and human fixture approval remain.
- **GitHub issue:** https://github.com/BenWassa/hearth_v2/issues/21
- **Branch:** `codex/issue-21-gemini-pilot-quality`
- **Date:** 2026-10-27
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

These are independent agent adjudications, **not human approval**. The fixture field is `agent-reviewed`, so the rollout gate requiring `review === "approved"` stays closed.

| Title | Changed labels | Rationale |
| --- | --- | --- |
| Paddington 2 | plot momentum low → medium; visual unknown → medium | Clear quest/heist/rescue progression; vibrant hybrid presentation supports noticeable visual authorship without asserting exceptional/high craft. |
| The Intern | visual unknown → low | Gentle, straightforward workplace/relationship comedy remains high-comfort and low-momentum; visual presentation is adjudicated as conventional rather than unresolved. |
| The Martian | narrative complexity high → medium; visual unknown → high; attention high → medium | Mostly linear mainstream survival story with parallel Earth/Mars problem-solving; strong visual identity; technical detail requires attention but does not make the narrative densely difficult. |
| Legally Blonde | visual unknown → medium | Strongly authored pink/fashion identity supports a medium visual signal; other labels remain. |
| The School of Rock | comfort medium → high; visual unknown → low | Explicit comforting evidence already forces high comfort in deterministic rules, so the old gold label was impossible for the hybrid to match. Visual presentation is adjudicated as conventional. |

Each fixture preserves a detailed disagreement note and still requires a human reviewer.

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
- Added safe diagnostic reasons for invalid/upstream/timeout outcomes without storing model text.
- Gemini results carry provider-attempt count plus prompt/policy identity into blend metadata.

No model change is proposed yet. Changing the model now would confound prompt, fixture and evaluator changes.

## Evaluator changes

- `--limit=N` selects a stable prefix of N real fixtures on every invocation.
- `--keys=a,b,c` selects exact canonical titles and rejects unknown or duplicate keys.
- Agreement uses the majority value across repeated predictions; stability remains a separate all-runs-equal metric.
- Output distinguishes total fixtures, real fixtures, selected titles, attempted titles, completed titles and provider attempts.
- Results preserve safe outcome diagnostics alongside status history.
- Resume compatibility requires classifier, model, prompt, inference-policy and policy-key identity.

The exact five canonical pilot keys are:

`tmdb:movie:346648`, `tmdb:movie:257211`, `tmdb:movie:286217`, `tmdb:movie:8835`, `tmdb:movie:1584`.

## Remaining gates

1. Run repository unit/API/lint/build checks on this branch.
2. Obtain explicit human approval or revision of all 50 real fixture labels.
3. Run a new owner-approved five-title v2 pilot using a fresh output file.
4. Complete all 50 titles with three valid predictions each within approved quotas.
5. Meet >=80% agreement, <=35% unknown and >=95% repeated-run stability on every subjective facet.
6. Confirm metadata-sharing permission, account-specific provider quota and production billing/smoke behavior.
7. Keep production Gemini disabled until all gates pass.
