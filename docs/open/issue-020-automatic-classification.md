# Issue #20 — Automatic title classification, zero-friction Add

- **Status:** Open — implemented; rollout/closure gated on #21 (2026-10-28). Original research and plan retained below.
- **Implementation record:** [issue-020-implementation-record.md](issue-020-implementation-record.md) describes what was built (this document is the original research and plan).
- **GitHub issue:** https://github.com/BenWassa/hearth_v2/issues/20
- **Research date:** 2026-10-26
- **Related:** [Tonight MECE categories #7](https://github.com/BenWassa/hearth_v2/issues/7), [#7 research record](../closed/issue-007-tonight-mece-rows.md), [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), [Technical overview](../TECHNICAL_OVERVIEW.md)
- **Relevant areas:** `src/views/AddView.jsx`; `src/config/constants.js`; `src/views/TonightView.jsx`; `src/domain/media/{schema,adapters}.js`; `src/services/firebase/watchlist.js`; `api/_lib/{providerClient,mappers/mediaMapper}.js`; `src/app/useAppState.js`; Firebase security rules and App Hosting runtime.

## Product objective

Hearth currently requires users to decide what a movie _is_ before they have watched it: Vibe (Comfort, Easy, Gripping, Visual, Classic) and Energy (Light, Balanced, Focused) are configured in the Add screen and persist as user state. That is avoidable decision friction. Users should select a TMDB result and add it without classification questions. Inference must not become an opaque recommendation engine or a high-maintenance public taxonomy.

**Recommended direction: hybrid metadata + rules + optional Gemini semantic inference**; classifications persist as reusable, versioned metadata; rare incorrect classifications are corrected manually outside the UI, never via a user-facing edit control. No automatic AI calls should prevent a successful Add.

### What is fact versus subjective interpretation?

| Attribute                                                          | Reliable automatic source                                                   | Caveat                                                                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| TMDB title ID, media type, genres, runtime, release year, overview | TMDB details                                                                | Facts can be absent, stale or different across TV episodes                                             |
| Short watch unit / Quick Bites eligibility                         | Validated **movie** runtime or next watchable episode runtime               | TV average/first episode runtime is not always the next episode; `null <= 35` bug in old Tonight logic |
| Comedy-first, comforting, gripping, narrative complexity           | Heuristics + LLM reading synopsis/keywords                                  | Qualitative judgments, cannot be inferred accurately from genre alone                                  |
| Visual distinctiveness / spectacle                                 | Keyword hints + LLM + small curated fixture                                 | Cinematography cannot be conclusively assessed from synopsis, budget or poster                         |
| Focus requirement                                                  | Heuristics + LLM estimate                                                   | Complex != dark, intense != hard to follow; different viewers have different experiences               |
| Classic                                                            | Curated editorial evidence; conditional film year/recognized identity hints | Age and popularity are _insufficient_ to qualify                                                       |
| "Currently Watching", watched/unwatched                            | User episode/action state                                                   | **Never** AI-generated                                                                                 |
| User preference or user correction                                 | Explicit user input, if provided                                            | **Never** replaced by inference                                                                        |

## Repository audit and consequences

- `src/config/constants.js`: `VIBES=[comfort,easy,gripping,visual,classic]`; `ENERGIES=[light,balanced,focused]`.
- `src/views/AddView.jsx`: default empty vibe/energy local state, chip controls, and submitted fields in both flat payload and `userState`; the add UI can be simplified without changing the TMDB search affordance.
- `src/views/TonightView.jsx`: independent predicates for comfort/energy, comedy/genre, focused/gripping, visual and classic. The #7 record measures **55 raw row placements for 30 titles**, including **22 titles matching at least two**. Those are seed-logic observations, not user-performance data.
- `api/_lib/providerClient.js`: existing `append_to_response` detail call and retry-on-429 logic; `api/_lib/mappers/mediaMapper.js`: currently maps plot/genre/runtime/rating but not keyword terms.
- `src/services/firebase/watchlist.js`: separate media catalog and watchlist payloads. `userState.vibe/energy` are mixed with flat compatibility properties; explicit user overrides **must not** be stored as indistinguishable generic inferred values.
- `src/domain/media/schema.js`, `adapters.js`: schema v2 and flattening require a backwards-compatible read layer. Imports/templates/Decision filters need separate verification.
- `docs/TECHNICAL_OVERVIEW.md`: App Hosting API + Firestore/Auth; it already refreshes TMDB metadata, but background application jobs are not automatically durable when browser sessions end.

## External-source evaluation — free-only requirement

| Source               | Terms/limits (checked Oct 26, 2026)                                                                                                                                                                                                                | Quality and decision                                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TMDB developer API   | Non-commercial use is free with logo attribution. Old 40 requests/10 seconds limit was disabled in 2019; current protective rate is roughly 40 requests/second, adjustable; handle 429/Retry-After.                                                | **Primary.** Keep server-side; extend detail call with `keywords`, optionally TV `content_ratings`. No dedicated mood/focus property.                                                                            |
| Gemini API free tier | Some supported model input/output tokens free; _live_ RPM/TPM/RPD, model access vary by project and can change. JSON Schema structured outputs are supported. **Unpaid requests/outputs can be used for Google product development/human review.** | **Optional** subjective classification. No private notes, identities, whole household list or viewing history. Review provider-data redistribution permissions before sending TMDB synopsis/keywords as prompts. |
| OMDb                 | Official free key at 1,000 calls/day, CC BY-NC restrictions on its website.                                                                                                                                                                        | Fallback only; largely duplicates TMDB facts and does not answer attention/visual questions.                                                                                                                     |
| Wikidata             | Queryable CC0 data; respect endpoint usage policy.                                                                                                                                                                                                 | Possible curated films, external IDs and known facts, not nuanced mood inference.                                                                                                                                |
| IMDb bulk datasets   | Limited personal non-commercial files, explicit attribution and no IMDb scraping.                                                                                                                                                                  | Not worth nightly updates, data matching and legal maintenance for mood inference.                                                                                                                               |
| TMDB user reviews    | Movie reviews endpoint exists but reviews are variable and may be unavailable; third-party prose rights.                                                                                                                                           | **Skip by default**. No external review scraping or large copyrighted text in LLM prompts.                                                                                                                       |
| YouTube trailers     | YouTube API quota/terms; analysis of audiovisual content adds complexity and dependence.                                                                                                                                                           | Out of scope: neither necessary nor safely free at scale.                                                                                                                                                        |

**Primary verification:**

- TMDB pricing/attribution: https://developer.themoviedb.org/docs/faq
- TMDB rate limits: https://developer.themoviedb.org/docs/rate-limiting
- TMDB one-request appended details: https://developer.themoviedb.org/docs/append-to-response
- TMDB movie keywords: https://developer.themoviedb.org/reference/movie-keywords
- TMDB TV keywords: https://developer.themoviedb.org/reference/tv-series-keywords
- TMDB TV content ratings: https://developer.themoviedb.org/reference/tv-series-content-ratings
- TMDB movie user reviews: https://developer.themoviedb.org/reference/movie-reviews
- Gemini tier pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini live limits guidance: https://ai.google.dev/gemini-api/docs/rate-limits
- Gemini structured outputs: https://ai.google.dev/gemini-api/docs/structured-output
- Gemini privacy/terms: https://ai.google.dev/gemini-api/terms
- Official OMDb key tiers: https://www.omdbapi.com/apikey.aspx
- Wikidata rights: https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service/Copyright
- IMDb limitations: https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX

### Why not Gemini alone?

Pros: quick classification of language-rich titles, fewer editorial heuristics. Cons: free-tier requests may run out, new titles may lack summaries, model revisions change outputs, outputs can be confidently wrong, prompts with user data violate our privacy intention, and a model calling one exclusive category will repeat Tonight's overlap mistakes. Use Gemini only to infer independent facets, and compare its output against human annotation. The application's normal Add flow must remain functional without Gemini.

### LLM input/output contract (proposal; not code)

**Input**: `{ provider:'tmdb', providerId, type, title, releaseYear, language, genres, overview, keywordNames, runtimeMinutes }` only after reviewing TMDB usage terms and stripping unsafe markup. Never send `spaceId`, `userId`, users' notes, activity, watchlist contents or other private material. Max input length and request size; publicly available provider description only.

**Output**: versioned object containing `comfort`, `comedyFirst`, `plotMomentum`, `narrativeComplexity`, `visualDistinctiveness`, `attentionDemand` each in `low | medium | high | unknown`; optional `classicEvidence` as `yes | no | unknown`; bounded evidence keywords and `uncertainFields` list. Validate object with independent app-side schema, never assume syntactically valid JSON is semantically correct. Avoid a 0–100 fake precision score. Protect against injected instructions in TMDB summaries/keywords: treat all metadata as untrusted data, not as agent commands.

**Contract invariants**:

1. Shared media-level inferred attributes are stored by `provider:type:id`, `classifierVersion`, `modelId` if applicable, `updatedAt`, `sourceRevision` and `provenance`. No raw secrets/private prompts.
2. Factual runtime/genre/identity are never overwritten by AI output.
3. Unknown remains unknown; no blank string coerced to `Comfort`.
4. `effectiveAttribute = explicitSpaceOverride ?? autoAttribute ?? unknown`; differentiate deliberate overrides from legacy imports/defaults. Provenance-less legacy inputs remain intact until a safe migration is designed.
5. Primary Tonight section is a **selection** derived from independent attributes and current library mix, not an inherent unique movie label. #7 governs unique cross-row placement and Quick Bites priority.
6. Users do not need to know the underlying implementation.

### Concrete mapping examples, not model ground truth

| Title                                     | Multiple valid facets                     | Suggested Tonight candidate                |
| ----------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| Paddington 2                              | gentle + funny + approachable             | Easy & Comforting                          |
| Legally Blonde                            | comedy-first + accessible                 | Need a Laugh                               |
| Ocean's Eleven                            | plot momentum + accessible                | Get Hooked (#7 proposed label)             |
| Severance                                 | focused + intricate                       | Deep Dives                                 |
| Spider-Man: Into the Spider-Verse         | visual distinctiveness + playful energy   | Spectacles                                 |
| Blade Runner 2049                         | visual achievement + attention-heavy      | Spectacles, not duplicated Deep Dives      |
| Roman Holiday                             | warm + funny + curated classic            | Classics                                   |
| Unknown independent film with no overview | genres and date may exist; mood uncertain | General Shelf/unknown, never false comfort |

These are _editorial examples_; validate with annotated reviewers, not by assuming a model's judgments are authoritative.

## Proposed execution architecture

```text
Search / select title
   ↓
existing TMDB details API ── append keywords, normalize/map (no new paid provider)
   ↓
Add to Shelf immediately; no vibe/energy form
   ↓
lookup media-level classification by provider:type:id + version
   ├─ present → apply cached independent facets
   └─ missing → deterministic classification with "unknown" when insufficient
                    ↓ optional, quota/privacy-approved
                 Gemini classification with strict JSON schema
                    ↓ validate, dedupe, version, cache and persist
   ↓
derive effective facets (per-space override wins)
   ↓
Tonight MECE selector (#7), Decision filters and Shelf cards
```

**Verified free-infrastructure boundary (Oct 26, 2026):** Firebase App Hosting **requires Blaze billing**; its underlying Cloud Run has a **2M requests/month no-cost allowance** and other service-specific allowances. Firestore Standard's published single free-database quota is 50,000 document reads/day and 20,000 writes/day. Cloud Functions deployment requires Blaze, and its deployed container storage can incur charges. For this personal, low-traffic app, the existing infrastructure may stay within no-cost allowances, but **zero charges cannot be guaranteed**. Set alerts, protect against unexpected classification loops, and never enable paid Gemini unintentionally. Sources: https://firebase.google.com/docs/app-hosting/costs , https://firebase.google.com/docs/firestore/quotas , https://firebase.google.com/docs/functions/quotas .

**Durability caution:** App Hosting request handlers and browser-driven tasks do not guarantee arbitrary post-response work. Phase 1 can classify heuristically on the existing details request and enqueue pending analysis for next app session; if the requirement is guaranteed work after the app closes, evaluate secured Firestore-triggered background workers/Cloud Tasks and their actual Firebase billing requirements first. Do not market that option as fully free until verified. Prefer idempotent convergence over a hidden permanent polling worker.

**Cache design:** key by canonical provider+mediaType+id rather than title; version semantic classifier; one owner resolves concurrent requests; no Gemini requests for every view/render; support manual refresh only on explicit action or policy change. Reuse catalog when multiple spaces save the same title. Use normalized keyword list/overview hash to invalidate when source changes rather than every TMDB timestamp refresh.

**Backfill:** list existing media catalog entries, deduplicate canonical titles, classify unclassified entries in bounded batches, checkpoint progress, retry 429/timeout with exponential backoff and jitter, report classifiable/unknown/errors; never reset watch status, notes or episode progress. Apply the same logic to imported libraries; document unresolved identity records.

**UI:** Search → select → Add; no mood/focus chips, no editing controls in item details. Exceptional errors may be corrected by a controlled maintainer/admin workflow outside the application. For accessibility ensure correction is keyboard/touch accessible. Do not expose an "AI model" screen in Tonight.

## Evaluation and deployment gates

1. Annotate >=50 diverse representative titles (the existing 30 seed + 20 varied new) across film/TV, genres, sparse metadata and tricky boundaries. Record two human labels for disagreement where possible.
2. Compare deterministic-only vs Gemini-assisted with per-attribute exact/adjacent agreement, hard category confusion, abstention rate, version repeatability, row usefulness and user corrections. Define acceptance thresholds before pilot; _do not quote accuracy without measurement_.
3. Test factual fidelity, empty keyword/overview, multilingual titles, adult/mature handling, timeouts/rate limits, parse failures, malformed model output, duplicate add across spaces, long-running/cancelled tasks, and cached model upgrades.
4. Compare before/after Add taps: no mandatory Vibe/Energy UI and no regression in save success/time. Include 320px/390px/448px portrait QA.
5. Implement #7 cross-row de-duplication separately; test attention versus gripping, comedy-first versus genre membership, and next-episode runtime.
6. Verify actual free Gemini quota **in AI Studio**, Google free-tier data retention terms, TMDB API attribution and third-party prompt processing rights, Firebase hosting/queue charges and secret storage. Budget-circuit-breaker must disable Gemini safely before charge. If license/terms cannot be confirmed, ship rule-only mode.
7. Do not backfill as a one-shot long UI request; use resumable checkpoints, incremental job status and a report.
8. QA Firestore rules so only authorized backend paths write automatic catalog metadata and per-space overrides remain restricted to authorized users.

## Implementation stages

- **Stage 0 — product/schema:** coordinate with #7, define attributes and provenance; human benchmark and privacy/terms gate.
- **Stage 1 — deterministic free foundation:** TMDB keywords normalization and mapper tests; derive low-risk facets; use cached classifications; remove required Add questions; unknown-state fallback.
- **Stage 2 — migration and corrections:** preserve existing manual choices and imports, adapt Decision filters, and document an exceptional maintainer-only correction procedure; no user-facing editing UI.
- **Stage 3 — optional Gemini A/B pilot:** gated backend with strict schema and model pin/version; measure gold-fixture gain and actual free-tier limits; no private input; maintain fallback.
- **Stage 4 — library backfill and Tonight integration:** resumable deduped reclassification, UX regression, #7 allocator and runtime fixes, telemetry restricted to aggregate non-personal operational metrics.

**Not accomplished by this document:** no Add redesign, classifiers, Gemini connection, Firestore migrations, background workers or backfills have been implemented or tested. Completion requires the checklist and verifiable tests in issue #20. Upon closure move this record to `docs/closed/` and update issue links + docs index.
