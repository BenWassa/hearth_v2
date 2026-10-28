# Issue #7: why rows look wrong, and a plan for the open decisions

- **Status:** Closed 2026-10-28 — delivered via #26; mood-row cap of 5/6 awaits owner confirmation.
- **Issue:** https://github.com/BenWassa/hearth_v2/issues/7 · **PR:** #26 (merged)
- **Date:** 2026-10-27
- **Method:** traced `primaryTheme` over the 30-title demo seed and over the 51 classification fixtures, once with the deterministic rules only (what production has today, Gemini is off) and once with the reviewed fixture labels (what a fully classified library would look like). Browser QA at 320, 390 and 448 px passed every assertion.

## Part 1. Findings

### 1. "Need a Laugh" is empty, and it is not only a demo problem

The routing logic is fine. With real facets, comedy-first titles do land in Need a Laugh: 6 of 51 with the reviewed labels, 4 of 51 with rules only (Abbott Elementary, Brooklyn Nine-Nine, I Love Lucy, 3 Idiots). The row is empty because of where the evidence comes from.

| Cause                             | Detail                                                                                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rules read keywords only          | `classifyMedia` sets `comedyFirst` only from the keywords `sitcom`, `stand-up comedy`, `slapstick`, `screwball comedy`. Genre never counts (by design in #20: "do not include every genre-tagged comedy"). |
| Demo seeds carry no keywords      | All 30 seeds have every facet `unknown`, so their theme comes only from the legacy vibe tag.                                                                                                               |
| Legacy vibes have no comedy value | The legacy tags are comfort, easy, gripping, visual, classic. `easy` and `comfort` both map to the Comfort theme, so no legacy tag can ever reach Need a Laugh.                                            |
| Pre-#20 behaviour was genre based | The old Tonight put any title with the Comedy genre in Need a Laugh unless it was gripping or visual. That behaviour was removed, and nothing replaced it for libraries without keywords.                  |

Production impact (important): with Gemini off, rules-only classification leaves **38 of 51 titles `unknown`**. Existing titles keep working through their legacy vibe tags, but **every title added with the new tag-free Add flow will mostly land in the fallback row ("More to Watch")**, and few households will ever see Need a Laugh. This is the larger issue behind the confusing demo.

### 2. The Classics row is dropped in the demo

The 13 to 30 tier allows 4 rows. The demo produces five: Easy & Comforting (10), Deep Dives (7), Spectacles (6), Quick Bites (4), The Classics (3). Ties on activity score are broken by item count, so Quick Bites (4) beats The Classics (3) and the Classics are not shown. Quick Bites is meant to be a contextual time row, not a competing mood (#7 section B), and The Classics is meant to be intentional editorial curation, so neither should lose a slot this way.

### 3. Two related facts that came up

- In the fixture labels, 23 of 51 titles are Deep Dives. "Fun gripping ride" titles (Ocean's Eleven, Only Murders, Stranger Things, Dangal) share a row with dense, intense ones (Severance, Gone Girl). That is the case for a separate Get Hooked row.
- Titles whose facets are all `medium` (the classic films with no curated flag) score into Deep Dives because the weights favour `focused`. That is a scoring artifact, not intent.

## Part 2. Proposed fixes for the issues above (recommended)

1. **Comedy.** Add a weak, bounded genre signal inside `primaryTheme` only (no classifier version bump, no cache invalidation): when comedyFirst is unknown and the non-automatic legacy vibe is `easy` or `comfort` and `Comedy` is the first-listed TMDB genre, treat the title as comedy-first (medium). Gripping or visual vibes and non-comedy-first genres do not qualify. This restores the old behaviour in a tighter form and keeps the "not every genre-tagged comedy" rule. Also add keywords to the demo seeds so they exercise the real rules. Tests: Paddington 2, Legally Blonde, School of Rock, Knives Out and Only Murders each keep one plausible home.
2. **Slots.** Make Quick Bites an extra optional slot that does not count against the mood-row cap, and guarantee The Classics a slot whenever it has at least the minimum items. In the demo this shows all five rows (an estimated 1.8 screens at 390 px, versus the measured 1.5 to 1.6 today).
3. **Unknown handling.** Keep the fallback row but title it neutrally (see Part 3), and have the allocator prefer the weak signals above before giving up, so a tag-free Add does not default to "unknown".
4. **Unrelated to Tonight composition but worth tracking:** rules-only coverage is weak. Raising it needs either the Gemini rollout (#21) or broader keyword rules. That is a #21 strategy decision.

## Part 3. The open decisions: investigation and recommendation

| Decision                        | What I found                                                                                                                                                                                                                                                                                                                                                                | Recommendation                                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Get Hooked / Unwind naming**  | Deep Dives holds 45% of fixture titles and mixes fun thrillers with dense dramas. A Get Hooked row (plot momentum high, complexity and attention at most medium) would hold about 5 of those 23 and make Deep Dives mean intense or intricate. "Unwind" is just a test name for Easy & Comforting. PRODUCT.md voice is "quiet and human, a friend setting out the evening". | Add **Get Hooked** as a sixth theme (small, needs facets; with rules-only data it will often be empty and simply not render). **Keep Easy & Comforting**; "Unwind" adds nothing. |
| **Placeholder names**           | "Tonight's picks" (compact tier) and "More to Watch" (fallback) are placeholders.                                                                                                                                                                                                                                                                                           | "Tonight's picks" is fine as is. Rename the fallback to **"Also on the shelf"**, which says what it is without implying a mood.                                                  |
| **Classic TV**                  | Two demo shows are tagged classic by the household (I Love Lucy, The Twilight Zone) and currently fall into "More to Watch". The film-first rule was a default, not a decision.                                                                                                                                                                                             | **Allow classic TV when the household or maintainer marked it classic** (legacy vibe or curated flag). Do not infer classics from age.                                           |
| **Mid-series Quick Bites**      | A started show already sits in Currently Watching. Letting it into Quick Bites would show it twice or pull it out of Currently Watching.                                                                                                                                                                                                                                    | **No.** Quick Bites stays unstarted shows and short films.                                                                                                                       |
| **30 vs 35 minutes**            | The threshold is one named constant. 30 means "fits a half-hour slot" and keeps most sitcoms; 35 starts admitting dramedies.                                                                                                                                                                                                                                                | **Keep 30.** Revisit with real runtimes once more of the shelf has TMDB data.                                                                                                    |
| **Tier boundaries**             | QA found no sparse rails and no overflow at 320, 390, 448. 1 to 5 titles gives one compact row, 6 to 12 up to 2 rows, 13 to 30 up to 5 mood/fallback rows, 31+ up to 6; Quick Bites is extra.                                                                                                                                                                               | **Keep boundaries and minimums; raise mood-row caps to 5 and 6**, with the slot change in Part 2.                                                                                |
| **Hero repeating a rail title** | The hero draws from all unwatched titles, so a title can appear in the hero and a rail. This was already true before #26.                                                                                                                                                                                                                                                   | Keep as is (the hero is navigation, not a mood row); document it. Revisit only if it bothers you in use.                                                                         |
| **Titles beyond 12 in a row**   | Rows are capped at 12; the rest stay on the Shelf.                                                                                                                                                                                                                                                                                                                          | Keep. It matches PRODUCT.md "calm, finite".                                                                                                                                      |

## Suggested order of work

1. Slot change (Quick Bites outside the cap, Classics guaranteed). Small, self contained.
2. Comedy weak-signal fix and seed keywords, with the scenario tests above.
3. Get Hooked theme, classic-TV rule, and the renamed fallback, after your review of Part 3.
4. Update the Tonight copy in PRODUCT.md and DESIGN.md for whatever you accept, then close #7.

## Implementation record (2026-10-27)

Implemented the approved extra Quick Bites slot, guaranteed qualifying Classics slot, bounded first-genre comedy signal, honest demo keywords, Get Hooked theme, explicitly curated classic TV, and neutral fallback title "Also on the shelf". Easy & Comforting and Tonight's picks remain. Tier boundaries, minimums, 12-card cap, deduplication, 30-minute threshold and exclusion of started shows remain. Get Hooked requires high momentum with neither complexity nor attention high; unknown facets qualify as not-high. The demo now qualifies three Get Hooked and three Need a Laugh titles; the updated five-mood-row cap selects Easy & Comforting (7), Spectacles (5), Deep Dives (4), The Classics (4), and Need a Laugh (3), with Quick Bites (4) extra. Get Hooked (3) loses the equal-strength tie to Need a Laugh in the default theme order. Hero may repeat a rail title because it remains navigation. Classifier and version are unchanged.

### Mood-row cap adjustment

With six mood themes, the lead agent decided to raise the 13–30 tier from 4 to 5 mood/fallback rows and the 31+ tier from 5 to 6. The cap is a tunable UX parameter, awaiting owner confirmation. The 1–5 compact tier, 6–12 limit of 2 mood/fallback rows, all minimums, 12-card cap, guaranteed qualifying Classics slot and extra Quick Bites row remain unchanged.

The 30-title demo renders these rows in strength order:

| Row               | Count |
| ----------------- | ----: |
| Easy & Comforting |     7 |
| Spectacles        |     5 |
| Quick Bites       |     4 |
| Deep Dives        |     4 |
| The Classics      |     4 |
| Need a Laugh      |     3 |
