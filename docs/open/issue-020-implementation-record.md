# Issue #20: automatic viewing classification

Status: implementation complete locally; optional Gemini rollout is gated on credentials, independent editorial review, live evaluation, and metadata-sharing permission. Do not close or move to `docs/closed/` until those checks pass.

Issue: https://github.com/BenWassa/hearth_v2/issues/20
Companion: [Tonight allocation #7](issue-007-tonight-mece-rows.md)
Implementation authorized by the user on 2026-10-26. The earlier research-only restriction no longer applies to this work.

## Product scope and decisions

Search → select → **Add to Shelf**. Add, collection-details add, and import review contain no Vibe/Energy selectors. Notes remain optional. Adding waits for valid TMDB title facts, never for Gemini or the full TV episode tree. Existing background episode refresh continues after saving. Import retains its existing identity-resolution workflow.

Seven independent facets: `comfort`, `comedyFirst`, `plotMomentum`, `narrativeComplexity`, `visualDistinctiveness`, `attentionDemand`, `curatedClassic`. Each has an allowlisted `unknown | low | medium | high` value, an ordinal confidence using the same vocabulary, and a method. The classification carries `viewing-1`, canonical identity, English locale policy, stable public source revision, and (when used) model and `viewing-prompt-1`. Confidence is not a calibrated probability. `unknown` is an abstention, not low.

Public facts (type, duration, genre, release year) remain separate. Exact descriptive TMDB keyword evidence drives the cheap baseline; genre membership, animation, budget, and age alone never imply warmth, visual excellence, attention, or classic status. Uncertain titles remain on the Shelf and in ordinary eligible hero selection. No general-purpose recommendation feed is added.

Keep the six existing Tonight labels in this issue. A pure scored allocator gives each eligible canonical title one thematic home; in-progress/completed shows and watched films are excluded. Visual TV is allowed. Historical manual/unknown-origin tags remain stronger than inferred facets. Quick Bites reserves positive numeric watch units **at most 30 minutes**, using the next released unwatched episode for TV, not typical series runtime. Missing episode metadata abstains. Shorts/short films can qualify. Its placement is unique across thematic rows. Richer #7 dynamic composition and a Get Hooked label remain separate work.

`userState.tagProvenance` records tags per field: new missing fields are `automatic`; imported existing fields are `imported`; unknown historic origins are `legacy`. The resolver accepts known provenance such as seeded/manual too. Existing values are never overwritten or relabelled automatic. Generated facets live in the shared media catalog, separate from per-space tags, notes, status, episode progress, and activity timestamps. A catalog override is a separate facet-only layer. No category editing or reset UI is shipped.

## Implementation map

- `src/domain/media/classification.mjs`: normalization, canonical typed identity, versioned evidence rules, strict facet validator, conservative hybrid blending, provenance and admin overlay.
- `src/domain/media/tonightClassification.js`: category scoring, next-watchable runtime, eligibility and unique allocation. `TonightView.jsx` consumes these rows through its existing balance/shuffle/presentation path.
- TMDB provider appends `keywords` to existing detail requests. Mapper supports movie `keywords.keywords` and TV `keywords.results`. Existing 429 retry/concurrency behavior is preserved.
- `POST /api/media/classify`: verified, non-anonymous Firebase ID token plus the existing approved-user allowlist; existing backend rate limiter; strict body containing only `{ id, type }`; `no-store` responses. No client-provided synopsis, notes, identity or history is accepted for inference.
- `api/_lib/classificationService.js`: in-process promise deduplication, Firestore transaction lease, source-hash/version/policy cache, conditional facet-only catalog writes and shared daily budget.
- `api/_lib/geminiClassifier.js`: direct REST API, strict JSON Schema/enums, runtime semantic validation, no tools/search, default 5-second timeout (hard maximum 10 seconds), at most two attempts on 5xx. Quota/timeout/invalid response/budget failure returns the baseline. Every provider attempt, including a retry, first reserves a persisted daily budget unit.
- `src/services/mediaApi/classificationQueue.js`: batches up to 10 canonical titles per request through `/api/media/classify-batch`; 1.2-second spacing between batches; three attempts per canonical title per open session; 15-minute transport/persistence retry delay. It polls for newly added/imported titles. The saved shelf is the durable pending-work source; browser retry markers are scoped to app/space. Navigation/unmount aborts the active request and suppresses late results. Storage failure does not prevent the current session from progressing.
- `persistCatalogClassification`: conditional transaction using actual field-path updates, no activity timestamp update. Repeated additions cannot overwrite cached enrichment with a baseline. Shared spaces retain their own historical tags and progress.

Shelf auto-groups titles from automatic classification while preserving stronger historical/manual tags. Operational browser console logs are gated by the `hearth:debug` flag.

## Cache, revision and failure policy

Canonical inference key is `tmdb:movie:<id>` or `tmdb:tv:<id>`, even where the historic watchlist/catalog ID remains `tmdb:<id>`. This change does not migrate existing document IDs. Catalog writes verify the actual provider/type before applying facets. Legacy manual rows without a usable provider identity receive local rules only until ordinary metadata hydration resolves their identity.

The cache is in server-only `classification_cache`, keyed by canonical identity, storing classifier/prompt/model policy and a SHA-256 hash of normalized public facts. Fresh provider facts invalidate old revisions; fetchedAt, artwork and personal changes do not. Cache hits reuse classification. Successful/disabled results last 30 days; quota/budget/provider inference failures use baseline with a 24-hour enrichment retry. A 60-second lease recovers work after process termination. Simultaneous requests in one process share TMDB too; across instances, the lease prevents duplicate Gemini calls. A crashed call can consume a budget unit without a result; it cannot create unbounded retries.

No work assumes CPU after an HTTP response or client exit. The browser retries missing/version-stale results on a later active session. Closing the app means pending work can wait. There is no Cloud Functions, scheduler, queue service or always-running worker. A successful cache write followed by a failed catalog write retries the cached result without another model call. Catalog corrections, personal state, and creation/activity dates survive enrichment.

Server cache and daily-budget documents are denied to clients by the existing catch-all rules; the Admin SDK uses IAM. Library options includes a Credits section with the unmodified official TMDB logo, source link and required non-endorsement notice. The local logo was downloaded from the TMDB attribution page. Existing catalog rules are unchanged. No rule deployment is needed. Existing `(default)` database was verified as STANDARD / FIRESTORE_NATIVE / nam5. No database or other cloud resource was provisioned.

## Secret setup

Preferred name: **`GEMINI_API_KEY`**. `GEMINI_API` is accepted as an alias for the user's proposed name. Neither uses a `VITE_` prefix.

Local: add the key to the ignored `.env.local` or `.env.api` at the repo root. The server and pilot script load `.env.local`, then `.env.api`, then `.env`; existing shell variables take precedence. `.env.api.example` documents all controls. Do not paste the key into chat or a tracked file.

Production: Firebase console → App Hosting → the Hearth backend → settings/environment → add a **secret** backed by Cloud Secret Manager. Name/map it to `GEMINI_API_KEY`, grant only the backend service identity access, and expose it at **RUNTIME** only. A commented `apphosting.yaml` reference is supplied; it remains commented so deployments without the optional secret continue to work.

CLI alternative:

```sh
npx -y firebase-tools@latest apphosting:secrets:set GEMINI_API_KEY --project hearthv2
```

Grant the selected App Hosting backend access using the CLI's backend prompt or console. Do not put a key in the shell command. Add the secret reference from `apphosting.yaml` only after the secret exists, and deploy through the normal release workflow.

Controls:

| Variable                           | Default / policy                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`                   | absent, server only; `GEMINI_API` alias accepted                                                    |
| `GEMINI_MODEL`                     | absent; select a currently available structured-output model with a verified free tier in AI Studio |
| `GEMINI_CLASSIFICATION_ENABLED`    | false; explicit pilot/rollout decision                                                              |
| `GEMINI_METADATA_SHARING_APPROVED` | false; explicit review of TMDB reuse permission                                                     |
| `GEMINI_DAILY_REQUEST_LIMIT`       | 20 provider attempts/day, transactional across instances; 0 disables calls; hard ceiling 100        |
| `GEMINI_TIMEOUT_MS`                | 5000; bounded 100–10000                                                                             |

A key alone does not enable inference. No paid tier is activated by code. Provider availability/prices/quotas must be confirmed in the actual AI Studio project before selecting a model.

## Privacy, rights and costs

Gemini receives only a server-fetched projection: title, movie/show type, year, genres and bounded keywords. No TMDB overview, review text, private note, watchlist contents, account identifier, progress or history is sent. No raw model requests/responses are logged or stored. The API key travels in a header, not a URL. Malformed and unexpected schema fields are rejected. The LLM cannot change provider identity, year, duration or facts. `curatedClassic` remains unknown unless set by a maintainer.

Google's unpaid-service terms permit content use/service improvement and human review; public-only inputs are intentional. Whether these particular TMDB-derived fields may be shared with the model still needs explicit rights review. TMDB's terms page was unavailable during verification; the implementation does not claim that a free API key grants redistribution/model-input rights. Sharing is gated off until approved.

Firebase App Hosting already requires Blaze. This implementation retains `minInstances: 0`, adds no persistent worker, and creates only cache/budget documents on demand. No new infrastructure was deployed or billing plan changed. Initial baseline classification typically adds one cache lease transaction, one cache commit transaction and up to two catalog probes/conditional writes (typed and historical IDs), plus one client catalog transaction; SDK conflict retries can add operations. Each Gemini attempt adds one transactional budget read/write. Cached/version-complete browser work is skipped; no inference is regenerated on app open. API cache retries may re-fetch one TMDB detail payload to validate its revision, but reuse model output.

The database's free allowance is 50,000 reads and 20,000 writes/day (one eligible database), shared with the rest of the app. Existing Cloud Run/build/storage/network and optional Secret Manager usage are independently billable beyond allowances. The small pilot budget bounds model attempts, **not the total Firebase bill**. A dollar-exact incremental cost cannot be guaranteed without live project usage and region-specific billing; monitor billing and set project budget alerts. Do not describe this as guaranteed zero-cost hosting.

Primary references, checked 2026-10-26:

- [TMDB append-to-response](https://developer.themoviedb.org/docs/append-to-response), [movie keywords](https://developer.themoviedb.org/reference/movie-keywords), [TV keywords](https://developer.themoviedb.org/reference/tv-series-keywords), [rate limits](https://developer.themoviedb.org/docs/rate-limiting), [FAQ/attribution](https://developer.themoviedb.org/docs/faq).
- [Gemini keys](https://ai.google.dev/gemini-api/docs/api-key), [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [terms](https://ai.google.dev/gemini-api/terms), [pricing](https://ai.google.dev/gemini-api/docs/pricing), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).
- [App Hosting secrets](https://firebase.google.com/docs/app-hosting/configure), [App Hosting costs](https://firebase.google.com/docs/app-hosting/costs), [Firestore quotas](https://firebase.google.com/docs/firestore/quotas).

## Evaluation and rollout gates

The fixture contains 50 real films/shows, including the existing 30 seeds, plus one synthetic low-information case. Public TMDB identity, genres, keywords and runtime were refreshed during implementation; a mismatched Joan of Arc ID was corrected from the provider. Editorial facet labels are **provisional annotations**, not a measured human consensus or training truth. Each case records reviewer ambiguity; independent reviewers must adjudicate/update `review` before passing a rollout gate.

```sh
# Offline, deterministic rules evaluation; no AI calls
node scripts/evaluateClassification.cjs

# Explicit live pilot, three repeated predictions per item; uses persisted budget
# Set flags/key/model in .env.local or .env.api after rights review. No secret in command.
node scripts/evaluateClassification.cjs --gemini --limit=5 --out=/tmp/hearth-classification-pilot.json
```

Increase the title limit only within the confirmed provider/project quotas. A full three-run evaluation needs at least 150 calls and therefore multiple days with the hard daily ceiling, or a pre-existing approved result set. Re-run with the same output path on later days to resume incomplete predictions. Model, prompt and classifier versions must match, and frozen public fixture inputs keep the multi-day comparison reproducible. `--limit` bounds newly attempted titles in one invocation. Do not bypass the hard ceiling or interpret partial batches as a passing full pilot.

The JSON report includes per-facet exact agreement, a confusion matrix (including unknown), unavailable rate, multi-run stability, rules predictions alongside hybrid predictions, prompt/model version and subjective reviewer notes. Predetermined thresholds: >=80% agreement per subjective facet, <=35% unknown per subjective facet, >=95% repeated-run stability, all 50 real titles covered, reviewed fixture approved. Classic curation is reported separately from the model quality gate.

Current [offline evidence](issue-020-evaluation.json): deterministic but sparse baseline. Most subjective facets abstain on this fixture. It does **not** meet semantic coverage targets and must not be described as AI quality validation. Rules remain a safe fallback, not a claim of complete subjective coverage.

### Owner-approved five-title pilot — 2026-10-27

The owner approved a bounded five-title live pilot, including sharing the public metadata projection described above. The [saved report](issue-020-gemini-pilot-2026-10-27.json) used `gemini-3.5-flash-lite`, confirmed available to the configured key through the models API. The five titles were Paddington 2, The Intern, The Martian, Legally Blonde and The School of Rock. Each completed three valid predictions. Seventeen provider attempts were counted in the shared daily budget (limit 20), including one invalid response and one timeout; both incomplete titles completed on a bounded resume. The runner's report contains all 50 real fixture records, but only these five received live predictions.

| Subjective facet       | Agreement with provisional labels | Stable across three predictions | Unknown rate |
| ---------------------- | --------------------------------- | ------------------------------- | ------------ |
| Comfort                | 80%                               | 80%                             | 0%           |
| Comedy first           | 100%                              | 100%                            | 0%           |
| Plot momentum          | 60%                               | 60%                             | 0%           |
| Narrative complexity   | 80%                               | 100%                            | 0%           |
| Visual distinctiveness | 40%                               | 20%                             | 40%          |
| Attention demand       | 80%                               | 80%                             | 0%           |

This small sample does not satisfy the rollout thresholds or substitute for the required reviewed 50-title evaluation. Labels remain provisional; the observed disagreements need editorial adjudication alongside prompt/model review. Production enablement flags and model remain unset. The pilot flags were scoped to the local runner process; no household/catalog classification was written by the evaluator, only the shared operational budget counter. App Hosting secret access was repaired separately, and the existing 3.16.0 release was confirmed live with build `3.16.0-20261027105016-fb57043` and a healthy API.

## Maintainer correction workflow

No in-app correction/reset controls. A developer with existing Firebase Admin credentials can inspect a dry-run plan:

```sh
node scripts/correctClassification.cjs --id=603 --type=movie --facet=visualDistinctiveness --value=high --reason="Reviewed visual craft"
```

The owner decides who may run `--apply`; possessing Admin credentials alone is not authorization. Add `--apply` only after reviewing the plan and receiving that owner authorization. It conditionally updates existing matching catalog documents, changes only the named facet override and its audit fields, and leaves generated cache, personal tags, activity and progress intact. `--value=unknown` forces an explicit abstention. Corrections are shared editorial metadata; avoid personal data in the reason. Reload the catalog-backed shelf to display a correction. Remove an override field only through the controlled Admin workflow when intending to restore automatic evidence.

## Verification

All 353 unit tests and 33 API tests pass, plus lint with zero warnings and a production Vite build. Headless Chromium exercised Add and item details at 320/390/448 CSS px with reduced motion: Add enabled after valid metadata, no tag selectors, and no horizontal overflow. Screenshots were visually reviewed. This caught and removed an old demo-only Comfort/Balanced fallback, so unknowns now behave consistently in the demo too. A separate transaction regression covers late/stale classification results and shared-catalog preservation. No browser session used a Gemini key.

## Acceptance ledger

Implemented and locally testable:

- Independent bounded facets, explicit unknown, provenance, pure classifier and validation.
- Movie/TV keyword normalization, version/source/policy cache, dedupe, leases and atomic budgets.
- Search/select/add without manual tags; optional episode hydration cannot block a valid title.
- Import without invented defaults, preservation of historical/imported choices and shared-space state.
- Resumable bounded backfill with count/error progress in the developer console.
- Unique thematic placement and positive next-watchable runtime checks; no classification-editing UI.
- Mocked quota/offline/timeout/malformed output/partial failure/cache race/multi-space tests; full unit and API suites; lint and production build.
- A 51-case fixture, reproducible evaluation report, external correction workflow and secret/deployment documentation.

Required before closure/AI rollout: live Gemini pilot after the key is supplied, independently reviewed facet gold labels, adjudication of disagreements, TMDB sharing permission, actual AI Studio free-tier quota confirmation, and production smoke/billing review after an authorized deployment. These are external validation gates, not silently passed checkboxes. No deployment or production backfill has been performed in this session.
