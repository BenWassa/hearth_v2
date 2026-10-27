# Issue #7 — Tonight: MECE thematic rows and activity-aware selection

- **Status:** Open — planning / validation (no application code changed by this document)
- **GitHub issue:** https://github.com/BenWassa/hearth_v2/issues/7
- **Last reviewed:** 2026-10-25
- **Related:** [Collections scalability #6](https://github.com/BenWassa/hearth_v2/issues/6), [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), [OTHER_UPGRADES.md](../../OTHER_UPGRADES.md)
- **Primary implementation:** `src/views/TonightView.jsx`, `src/views/components/tonight/sectionBalance.js`, `src/views/components/tonight/SuggestionSection.jsx`, relevant media/watch-progress domain helpers.

## Outcome sought

When two people open Tonight, the thematic rows should provide **different, immediately legible reasons to watch something**, in an appropriately short page. Repeated titles and near-identical labels increase decision time.

The algorithm must distinguish:

1. **State/navigation** — hero, Collections, Currently Watching, Coming Soon.
2. **Primary viewing intention** — one dominant thematic home per eligible title.
3. **Secondary attributes** — comedy genre, energy, runtime, visual style, other genres, preference and activity evidence.
4. **Presentation** — which rows appear tonight, their order, and which candidate cards represent them.

**MECE applies to primary thematic assignment and to visible Tonight thematic placements, NOT to descriptive metadata.** A title can legitimately be funny, comforting, visually impressive, short, and intense simultaneously.

## Current code audit (main on 2026-10-25)

| Row | Current predicate | Distinctness defect |
| --- | --- | --- |
| Easy & Comforting | `vibe === 'comfort' || energy === 'light'` | Light action, comedy, or thriller is not necessarily comforting |
| Need a Laugh | `genres` contains Comedy and vibe is not gripping/visual | Genre membership is weaker than comedy-first intent; collides with comfort |
| Quick Bites | `type === 'show' && (runtimeMinutes <= 35 || runtime <= 35)` | A null runtime qualifies in JavaScript; duration dimension competes with mood |
| Deep Dives | `energy === 'focused' || vibe === 'gripping'` | Gripping but accessible != complex/deep; focused visual content also qualifies |
| Spectacles | `type === 'movie' && vibe === 'visual'` | Excludes qualifying TV; can also be focused |
| The Classics | `type === 'movie' && vibe === 'classic'` | Coherent but excludes classic TV by design |

Current `balanceRows(rows)` caps each independent row to a computed average of total row sizes. It **does not deduplicate**. Daily category-salted shuffling masks repeated order but does not model usefulness. Thematic JSX ordering is fixed. `Currently Watching` already sorts by modified timestamp, while theme rows do not.

### Static seed audit

Using the 30 **declared** titles in `src/template/seedLibrary.js` (15 films, 15 shows), retaining their declared `null` TV runtime before mapped media enrichment:

| Raw pool | Size |
| --- | ---: |
| Easy & Comforting | 14 |
| Need a Laugh | 6 |
| Quick Bites | 15 |
| Deep Dives | 14 |
| Spectacles | 3 |
| The Classics | 3 |
| **Total raw placements** | **55** |

- **22/30 titles** match at least two raw predicates.
- **3/30** match at least three.
- This is a code-level input experiment, not measured real-user exposure; provider metadata, later row caps, and UI behavior can alter what appears.
- `runtimeMinutes === null` passes `<= 35` via JavaScript coercion, placing all 15 base seed TV entries into Quick Bites. A positive, finite runtime guard is mandatory.

### Overlap cases worth regression tests

| Title | Raw matches before enrichment | Proposed primary category | Why |
| --- | --- | --- | --- |
| Paddington 2 | Comfort + Laugh | Easy & Comforting | Gentle warmth drives selection |
| The Intern | Comfort + Laugh | Easy & Comforting | More heartwarming than comedy-first |
| Legally Blonde | Comfort + Laugh | Need a Laugh | Light comedy-first |
| Knives Out | Laugh + Deep | Deep Dives | Mystery and close attention dominate; test vs Get Hooked |
| The Martian | Comfort + Deep | Deep Dives | Sustained engagement overrides comfort tag |
| Ocean's Eleven | Comfort + Deep | Get Hooked | Playful, accessible plot-driven watch |
| Spider-Man: Into the Spider-Verse | Comfort + Spectacles | Spectacles | Animation is a defining reason |
| Blade Runner 2049 | Deep + Spectacles | Spectacles | Exceptional visual craft outweighs attention demand |
| Roman Holiday | Comfort + Laugh + Classics | The Classics | Curatorial classic selection |
| The Godfather | Deep + Classics | The Classics | Primary Classics identity |
| Friday Night Lights | Comfort + Deep + potentially Quick | Easy & Comforting | Human drama; runtime must be validated |
| Only Murders in the Building | Comfort + Deep + potentially Quick | Get Hooked (test) | Accessible mystery, lighter than Deep Dives |

These placements are **research hypotheses**, not hard-coded definitive editorial truths. Validate borderline titles using representative user studies / a reviewer-maintained fixture.

## Taxonomy options and design decision

- **Option A:** retain current six thematic labels and fix overlap. Lowest change; retains a broad Deep Dives definition.
- **Option B (preferred experiment):** Easy & Comforting, Need a Laugh, **Get Hooked**, Deep Dives, Spectacles, The Classics. Quick Bites becomes contextual/time-driven and steals placements only when displayed.
- **Option C:** Unwind, Laugh, Immersive, Spectacles, Classics. Simpler but loses a valuable distinction between an involving plot and an attention-demanding work.

### Preferred Option B: operational definitions

| Primary | Include if the principal reason to choose is… | Avoid if… |
| --- | --- | --- |
| Easy & Comforting | warm, gentle, familiar, low-friction, reassuring | primarily joke-forward or intense |
| Need a Laugh | light/comedy-first experience | merely contains comedic moments; comedy-drama requiring deep focus |
| Get Hooked | easy-to-enter momentum, mystery, accessible excitement | genuinely complex/attention-heavy or visual craft is the point |
| Deep Dives | demanding, intense, intricate, thoughtful immersion | accessible action excitement without significant attention demand |
| Spectacles | exceptional visuals, cinematography, animation, nature, scale | merely a big-budget film without visual distinctiveness |
| The Classics | intentionally curated classic films | just older without classic/curatorial fit |

### Proposed assignment of the full 30-item seed

This is one **illustrative complete partition**, not a final automated classifier:

- **Easy & Comforting (6):** Paddington 2; The Intern; Ted Lasso; Gilmore Girls; Friday Night Lights; The Great British Bake Off.
- **Need a Laugh (5):** Legally Blonde; School of Rock; Abbott Elementary; Brooklyn Nine-Nine; I Love Lucy.
- **Get Hooked (4):** Ocean's Eleven; Only Murders in the Building; Stranger Things; The Twilight Zone.
- **Deep Dives (6):** The Martian; Knives Out; Gone Girl; The Dark Knight; Severance; The Wire.
- **Spectacles (6):** Spider-Man: Into the Spider-Verse; The Grand Budapest Hotel; Blade Runner 2049; Planet Earth II; The Crown; Arcane.
- **The Classics (3):** Roman Holiday; Casablanca; The Godfather.

`I Love Lucy` and `The Twilight Zone` expose the classic-TV policy ambiguity. Preserve current film-first Classics until the product decision is explicit, then re-test the partition.

### Quick Bites is orthogonal

Quick Bites answers **“How much time do we have?”** rather than **“What mood?”**. It may contain short comedy, comfort, documentary, or drama, but a Quick Bites card must not simultaneously appear in a thematic row tonight.

- Evaluate true **watch-unit runtime**: next available/unwatched episode for series; full film runtime for a film.
- Only positive finite numeric durations qualify. `null`, `undefined`, blank, negative, `NaN` never qualify; no `<=` comparison before normalization.
- Test **<=30 minutes** as a clear initial label threshold, and <=35 as an alternate. Prefer one consistent value reflected in UI copy and tests.
- If no trustworthy episode runtime exists, omit from Quick Bites rather than guessing from `runtimeMinutes` if that field is ambiguous. A validated series typical-runtime fallback may be considered explicitly.
- Surface the row when short-form choice provides real value, not just because any short show exists.

## Classification and page-level allocation

Suggested pure pipeline (exact signatures subject to implementation):

1. `getEligibleTonightItems(items, now)`: normalize IDs/status; exclude watched/completed; separate in-progress shows as a navigation section.
2. `deriveWatchAttributes(item, episodeData)`: validated runtime, vibe, energy, genres, type, candidate visual/comedy/gripping hints, reliable user actions and data confidence.
3. `scorePrimaryCategories(item, attributes)`: one suitability score per candidate; no irreversible `if/else` relying solely on genre.
4. `assignPrimaryCategory(item, scored)`: return one primary category (or explicitly internal `other/unknown`). Manual user vibe/energy metadata should remain meaningful, not overwritten.
5. `buildRowCandidates(assignments, secondaryAttributes)`: if Quick Bites activated, reserve eligible items once; score each item within its primary category.
6. `selectTonightRows(candidates, recentActions, constraints)`: choose visible category set and order, preserving distinctness and variety.
7. `allocateUniqueCards(rows)`: maintain a global set of canonical title IDs (including duplicate provider IDs when needed), cap each visible row, and ensure no card is placed twice.
8. Presentation consumes a row model; `TonightView.jsx` should not own all category-domain rules.

**No rigid first-match precedence** between Comfort/Laugh or Deep/Spectacle. Use suitability + competing row quality, with an editorial tie-break for genuinely ambiguous test fixtures. An internal fallback prevents invented classification; its titles stay on the Shelf and can be surfaced in a small general-purpose section when useful.

Canonical identity: prefer stable local watchlist ID; ensure duplicate catalog entries representing the same provider/title cannot crowd several rows without deliberate separate-user-entry semantics.

## Dynamic row composition proposals

These numbers are **UX test parameters**, not a final policy:

| Eligible unwatched shelf | Example Tonight composition |
| --- | --- |
| 0 | empty-state action to add/import; no ghost rails |
| 1–5 | compact mixed selection or single coherent row; no 1-card carousel farm |
| 6–12 | up to 2 strong rows where each has >=2 distinct items |
| 13–30 | up to 3–4 distinctive rows where each has >=3 distinct items |
| 31–50+ | up to 4–5 rows, capped cards with clear Shelf escape path |

Candidate row utility can account for (a) number of good matches, (b) category-fit scores, (c) diversity and minimal repetition, (d) strong *deliberate* recent title additions, (e) confirmed watched-event recency, (f) stable row order and presentation. **Do not rank by raw updatedAt as viewing recency**; normal edits and metadata enrichment can modify it.

Allow `Currently Watching` to lead when active; do not mix `watching` series into unwatched thematic rails. `Coming Soon` remains informational, not a primary mood. Coordinate Collections placement with #6 so feature/index navigation doesn't overwhelm selection.

Stable ordering: keep the row arrangement and item order stable during active session/day unless the user changes relevant watchlist state. Any date-seeded shuffle should only break otherwise equal relevance.

## Scenario test matrix

| Scenario | Setup | Expected |
| --- | --- | --- |
| Empty | 0 entries | useful add/import state, zero empty mood rails |
| Single | 1 unwatched title | title discoverable without pointless category carousel |
| Small mixed | 5 mixed films/shows | compact composition with no duplicated items |
| Mid-sized | 12 titles across six moods | no weak 1-item rails; sensible coverage |
| Base seed | 30 declared seed items | compare exact categories and 30 unique primary assignments |
| Large balanced | 50+ entries and 25+ collections | bounded Tonight; all Shelf entries reachable |
| Comedy-heavy | 20 sitcoms and comedy films | Laugh stays strong; no artificial near-duplicate Comfort rail |
| Comfort-heavy | comfort drama plus light comedy | distinguish primary motive, suppress duplicate |
| Plot/complex mix | mystery, thrillers, dense dramas | Get Hooked vs Deep Dives demonstrably different |
| Visual-heavy | animation, nature docs, large films and TV | Spectacles works for both media types |
| Short episode | 22-minute next episode | eligible for contextual Quick Bites, once |
| Runtime invalid | null, undefined, 0, -5, NaN, blank | not Quick Bites |
| Series episode variance | first ep 24m, next ep 55m | Quick Bites reflects next watchable episode |
| Active TV | 3 partially watched series | Currently Watching contains them, mood pool excludes |
| Completed TV | all released episodes watched | does not return to unwatched theme selection |
| New addition | one freshly deliberately added title | moderate recency benefit; stable visible rows |
| Edit-only | metadata refresh or import timestamp churn | no false “recently watched” boost |
| Date change | repeated open on same day / following day | stable same-session; only controlled variation |
| Classic TV policy | I Love Lucy, Twilight Zone | explicit, tested inclusion/exclusion policy |
| User override | customized vibe or energy | visible category change only when intended |
| Limited metadata | missing genre/runtime/vibe | safe fallback; not falsely classified |

Add unit tests for selector eligibility, classifier ties, runtime validation, allocation invariants, and dynamic composition; add Tonight component/integration tests with a mocked but realistic row renderer. Test responsive at 320/390/448 CSS px, reduced motion, card accessibility, and rewind/cloning behavior (clones are presentation only, not logical duplicate recommendations).

## Engineering stages

1. **Safety/correctness first:** repair Quick Bites runtime checks; add cross-row duplicate audit/tests; prevent watched and in-progress contamination.
2. **Pure domain selection:** separate classification from UI; define category contract, scoring, tie-breaks, and fixtures; keep current user-facing tags usable.
3. **Dynamic page composition:** meaningful row utility, minimum counts, card caps, stable order; unify global allocation and row count logic.
4. **Activity-aware tuning:** use real event timestamps if captured, not metadata-derived recency. Avoid introducing a tracking system merely for novelty.
5. **Product validation and cleanup:** compare taxonomy A/B/C with seed and skewed libraries; update copy/design and relevant PRODUCT/DESIGN docs *only on accepted decisions*; visual/a11y QA.

## Explicit unresolved decisions

- Is **Get Hooked** a recognizable and sufficiently distinct category versus Deep Dives? Test with ambiguous titles before committing.
- Is **Easy & Comforting** preferable to the shorter **Unwind**?
- Should **The Classics** include curated classic TV, or remain cinema-only?
- Does Quick Bites mean **30** or **35** minutes? Does the time-oriented section appear automatically or on explicit time intent?
- Should primary assignment respect a user-selected vibe as a hard constraint or a strong but overridable signal?
- How much activity awareness is useful without drifting toward opaque recommendation-engine behavior?
- How should title identity be resolved if the same provider title appears as separate local entries?

## Done means

- All checkboxes in [issue #7](https://github.com/BenWassa/hearth_v2/issues/7) verified, full scenario matrix passing, no duplicated visible thematic titles, and no false-short `Quick Bites`.
- The Tonight selection clearly reduces choices without burying unique saved titles.
- When completed, move this file (preserving history via git) from `docs/open/` to `docs/closed/`, update status and link in the issue.


## Issue #20 integration (2026-10-26)

[Automatic classification implementation](issue-020-implementation-record.md) now supplies independent, versioned viewing facets. `tonightClassification.js` implements scored primary assignment, typed canonical deduplication, exclusion of active/completed shows, and positive finite next-watchable runtime checks. Existing six labels remain; Quick Bites uses <=30 minutes and reserves its titles once. Automatic Comfort is never inferred from a missing tag or Light energy alone. Historic user/import tags stay preserved. These safety/assignment changes support #7, but do not claim completion of its dynamic row composition, activity weighting, taxonomy experiments, or user validation. Rules-only coverage is deliberately sparse; the optional Gemini quality pilot is still gated.
