# Three household decisions

October 2026. For the two people sharing the shelf. Reply with one option per decision, for example: “Shows A; Import A; Undo B.” These are proposals, not approved changes. Sizes: S is a contained change, M spans UI and state, L adds shared recovery or matching behaviour.

## 1. What should the main button do for shows?

Today: the fixed bottom action sits outside the scrolling details ([ItemDetailsModal.jsx:1026](../../src/components/ItemDetailsModal.jsx#L1026)). Saved unwatched movies show “Mark watched”, watched movies “Back to shelf”, and unsaved movies “Add to shelf”; shows return no action bar ([ActionBar.jsx:4](../../src/components/ItemDetailsModal/components/ActionBar.jsx#L4)). Shows use season and episode controls instead ([ItemDetailsModal.jsx:979](../../src/components/ItemDetailsModal.jsx#L979)). A universal “Mark watched” could imply completing a whole series.

| Option | What you see | Size and risk |
| --- | --- | --- |
| A. Go to episodes | A saved show has “View episodes” at the bottom. It moves to the episode controls without changing progress; unsaved shows offer “Add to shelf”. | S. Low risk; needs a clear focus destination and a quiet unavailable state when episodes are missing. |
| B. Mark one episode | A saved show offers “Mark S1 E3 watched”, naming the next released, unwatched episode. If none is known, it offers “View episodes”. | M. Missing or stale episode data could select the wrong episode; repeat taps must not advance twice. |
| C. Keep episode controls only | Shows stay as they are, with progress actions inside the season section. | S. No new completion risk, but the main action remains harder to find. |

**Recommend A.** It makes the next step clear without guessing what you watched. Say **“yes to build Shows A”** to add the show-specific bottom action, scroll and focus behaviour, and loading/missing-data handling. No whole-series completion button.

## 2. Should Import accept a plain list of titles?

Today: Import parses JSON, then falls back to CSV ([importer.js:454](../../src/domain/import/importer.js#L454)); CSV requires a header including `title` and a data row ([importer.js:368](../../src/domain/import/importer.js#L368)). The UI begins with “Generate JSON with an LLM”, followed by paste and review; that first step can be skipped ([ImportModal.jsx:424](../../src/views/ImportModal.jsx#L424), [ImportModal.jsx:845](../../src/views/ImportModal.jsx#L845)). A list such as “The Office” cannot safely identify a version or media type by itself.

| Option | What you see | Size and risk |
| --- | --- | --- |
| A. Paste, then choose matches | Paste one title per line, optionally with a year. Review a finite list of matches showing poster, year and movie/show; choose or skip each before adding. | L. More review taps and provider requests; no silent first-result choice. Wrong remakes remain possible if a choice is rushed. |
| B. Paste as unmatched titles | Each line becomes an unlinked draft. Choose movie/show before adding, then match details later. | M. Fast entry, but incomplete artwork, duplicates and later matching work can clutter the shelf. |
| C. Keep JSON and CSV | Keep the existing prompt, paste and review flow. | S. No new matching work, but a simple list still needs conversion outside Hearth. |

**Recommend A.** A short review is easier than repairing the wrong shelf later. Say **“yes to build Import A”** to add plain-list entry and explicit match review, retain JSON/CSV, and handle ambiguous, missing and failed matches without adding them silently. Nothing is imported until confirmed.

## 3. How should bulk-delete recovery work?

Today: Shelf asks for confirmation, then calls bulk delete with the second confirmation skipped ([ShelfView.jsx:74](../../src/views/ShelfView.jsx#L74), [ShelfView.jsx:187](../../src/views/ShelfView.jsx#L187)). Success returns to Tonight; failure shows a retry message ([useAppState.js:2161](../../src/app/useAppState.js#L2161)). The service runs independent deletes through `Promise.all`, so some can succeed before another fails, with no rollback or recovery ([watchlist.js:546](../../src/services/firebase/watchlist.js#L546)).

| Option | What you see | Size and risk |
| --- | --- | --- |
| A. Brief Undo before deletion | After confirmation, selected titles disappear on this device and a 10-second “Undo” appears. Deletion starts after that window; closing the app cancels the pending removal. | M. The other device still sees the titles during the window. Commit-time partial failure needs per-title results; concurrent edits need a version check. |
| B. Recently removed | After confirmation, titles leave the shelf and can be restored by either person from “Recently removed” for 24 hours. A short message links there. | L. Requires shared soft deletion, expiry and conflict handling; restoration must never overwrite newer household edits. |
| C. Keep confirmation only | The current confirmation remains, with clearer permanent-removal wording and per-title failure feedback. | M. Partial failures become clearer, but mistaken successful deletions remain permanent. |

**Recommend B.** Both people can recover a mistake, even after closing the app. Say **“yes to build Undo B”** to add shared removal records, a 24-hour restore view, expiry cleanup and per-title results. Removal and restore must check for concurrent edits, preserve newer changes, and report conflicts rather than overwrite them. Recovery applies to Shelf bulk delete only.

## Other owner items

- **Fixtures:** approve or revise the labels and resolve the two comfort conflicts in the [Gemini review packet](issue-021-fixture-review-packet.md).
- **Five-title v2 pilot:** approve the exact five titles and a daily cap in the [pilot gate](issue-021-gemini-pilot-quality.md#preview-before-approving-live-calls). Preview only: `node scripts/evaluateClassification.cjs --gemini --dry-run --limit=5 --out=/tmp/gemini-preview.json`. This makes no live calls; approval is still pending.
- **Mood rows:** confirm caps of 5 for 13–30 titles and 6 for 31+, with Quick Bites extra, in [#7 row decisions](../closed/issue-007-row-decisions-plan.md) and the [issue record](../closed/issue-007-tonight-mece-rows.md).
- **Pixel:** complete the real-device Back gesture checks and record results in [#22 manual QA](issue-022-android-back-navigation.md#manual-qa).
- **Real login:** manually sign in with a real account, load the shared shelf, reload and sign out; record the Firebase lazy-load smoke result on [PR #34](https://github.com/BenWassa/hearth_v2/pull/34).
- **v3.17.0:** review the [deployment checklist](../DEPLOYMENT.md) and [release changes](https://github.com/BenWassa/hearth_v2/compare/v3.16.0...main), then state ready or list blockers. This brief does not establish release readiness.
