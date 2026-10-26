# Collections

Implemented from [Issue #6 and both research comments](https://github.com/BenWassa/hearth_v2/issues/6).

## Navigation and presentation

Tonight shows zero to two compact, directly actionable saga rows and a 44px **Browse all N sagas** action. With no reliable recent activity it shows the browse entry alone. Two compact rows keep a predictable footprint; a large lead cover plus a second row took space away from Currently Watching. There is no horizontal Collections carousel and no fourth dock tab.

The full-height Collections browser has search, Recently active and A–Z, an optional World section, and every saga exactly once across Recently active and the remaining list. Search covers the whole library directly, including unclassified sagas. It ignores case, diacritics and the trailing “Collection” suffix. World navigation is an optional shortcut rather than a required hierarchy.

Libraries of five or fewer sagas skip World tiles. Only represented Worlds appear. A World with one saga opens that saga directly. There is no artificial “Other” World. World details show saga count, films on the household shelf and unwatched shelf films. Back restores the overview's scroll and tile focus; saga details leave the browser mounted, preserving search, sort, scroll and focus. Escape dismisses the topmost dialog.

**Eligibility decision:** include every recognized movie saga with a stable provider collection ID and name, including two-film collections and a single owned part. This consciously replaces the old three-provider-part gate: missing or failed provider counts cannot hide a household saga or cause async entries to appear.

## Household intent and migration

`watchlist_items` gains optional `additionOrigin: manual | import` and `userState.markedWatchedAt`. Manual adds get a server creation timestamp; imports retain creation time for record existence but never gain a recent-intent boost. An imported watched film does not acquire a fabricated watch date.

Movie status transitions use a Firestore transaction that reads the current shared record. Unwatched → watched sets a server timestamp; watched → unwatched clears it. Repeated writes of the same status preserve the original event, including writes from another household member. Direct detail status edits use the same path. TV progress, notes, metadata refreshes, ratings and `updatedAt` never contribute.

No backfill or destructive migration is required. Old records without origin/watch-event fields have unknown activity and deterministic alphabetical fallback. This intentionally trades some initial personalization for truthful history. Undo removes the watch signal; intentional add activity can remain. Rewatch event history and chronological streaming telemetry are out of scope.

## Ranking

Pure functions in `src/domain/media/collectionActivity.js` take an injected clock. Invalid/future timestamps are ignored. Distinct film identities count once.

Tonight uses an actionability ladder:

1. Explicit watch within 30 days with another unwatched film on the shelf.
2. Deliberate addition within 14 days with unwatched shelf films.
3. Explicit watch within seven days with known additional unowned provider parts.
4. In-progress shelf saga with an explicit watch within 60 days.

Within a tier, watch intent decays with a ten-day half-life, add intent with seven days, with a bounded boost for multiple distinct films added in the last week. Fully exhausted sagas never fill Tonight merely to reach two rows. Browser order instead uses the most recent meaningful event, independent of completion, then name and stable ID. Ratings do not participate.

Tonight identities, browser order, recent-section membership and World order freeze for the visit. Live progress and removals still update. New sagas append deterministically. Re-entering the browser or **Refresh order** explicitly incorporates newer activity. Provider enrichment changes neither eligibility nor the saved order.

## Worlds and artwork

`src/config/collectionWorlds.js` is editorial taxonomy version 1, verified against TMDB collection and search APIs on 2026-10-25. It maps provider collection IDs to Marvel, Star Wars, Pixar, Disney Animation and DreamWorks. Marvel includes recognizable Sony Marvel sagas. Avengers is one saga within Marvel, not the MCU. Disney Animation deliberately excludes Pixar, Marvel, Lucasfilm and unrelated Disney-owned live-action brands. Unmapped IDs remain fully searchable.

Worlds reference canonical rollups and never duplicate watchlist/progress storage. Ordering uses the most recently active child, rather than a size-biased sum. Maintain classification by checking the provider ID/name and incrementing the version for editorial changes; never guess from a title or company name.

Saga rows use existing TMDB collection artwork with 96px landscape crops, lazy loading and w300 TMDB sources. World covers use original CSS geometry with warm tonal surfaces and serif titles, avoiding falsely representative films or unlicensed promotional art. The optional `cover` property accepts a supplied, licensed custom image; load failures preserve the typographic treatment. No Disney+ assets or imitation logos are used. TMDB imagery remains subject to the app's existing attribution and [TMDB terms](https://developer.themoviedb.org/docs/faq).

## Providers and failure

Optional small-saga counts share a process-wide FIFO pool capped at three active requests, cached/deduplicated by provider, ID and locale. Health/provider failures leave all local sagas available. Counts are hints, not proof that all franchise films are owned. Saga details reuse the existing loading/error experience and label shelf progress separately from known saga totals.

Limitations: provider totals are optional and currently fetched for locally small sagas; unknown totals never imply exhaustion or an owned next film. Taxonomy is intentionally finite and needs editorial additions over time. Upcoming parts can appear in provider details and are labeled as outside the shelf until added.

## Reproduction and validation

Read-only template fixtures: `?demo=1&collectionsFixture=25`, `50`, `1` or `0`. Add `&dispersedWorlds=1` for unclassified distribution. These never write to a connected household. Metadata in `src/template/collections-fixture.json` comes from TMDB; activity and members are synthetic. `buildCollectionFixture` accepts a fixed clock for tests.

Tests cover ranking, expiration, imports, undo, concurrent repeated status writes, unknown/future dates, missing classifications, distributions, zero through 75 sagas, search, sorting, World drill-down/back/focus/scroll, frozen realtime ordering, and 50 provider lookups with failure and peak concurrency three. Mobile captures live in `docs/collections/screenshots/` at 320px, 390px and 448px. Controls were measured at >=44px and browser/page widths matched each viewport.
