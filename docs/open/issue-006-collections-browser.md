# Issue #6 — Collections: scalable saga browser

- **Status:** Open, implementation in PR #8 pending review and merge
- **GitHub issue:** https://github.com/BenWassa/hearth_v2/issues/6
- **Backfilled:** 2026-10-25
- **Related product documents:** [COLLECTIONS_REDESIGN.md](../../COLLECTIONS_REDESIGN.md), [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md)
- **Companion issue:** [Tonight thematic rows #7](https://github.com/BenWassa/hearth_v2/issues/7)

## Problem

A real shelf has about 25 sagas. Collections currently presents all of them in a horizontally scrolling Tonight rail, without a direct, searchable browse index. This makes an individual saga hard to find, pushes immediate watch-choice content downward, and relies on repeated swiping. The existing implementation also has questions around “complete” counts, ordering, and the number of provider requests.

## Direction recorded in issue #6

- Replace the unbounded Tonight rail with a **small, intentional preview or a single Collections entry** and a clear “Browse all” action.
- Build a **dedicated finite Collections browser**, generally a compact vertical list on mobile with visible saga titles and artwork.
- Provide search, a meaningful recent-activity sort (with A–Z), and reliable count/status semantics distinguishing “on your shelf” from “in the saga”.
- Reuse existing collection rollups/details where practical; avoid uncontrolled concurrent provider-count fetching.
- Test with 0, 1, 3, 25, and 50 qualifying sagas, plus mobile widths and assistive interaction.
- Coordinate the Tonight preview location with issue #7 so Collections navigation does not crowd out the watch-decision experience.

## Source of truth

The [GitHub issue #6](https://github.com/BenWassa/hearth_v2/issues/6) contains the detailed implementation requirements, current source references, acceptance checklist, and design checkpoints. **Do not silently replace its decisions in this backfill summary.** Copy finalized implementation notes here as work progresses.

## Working checklist

- [x] Decide preview entry vs preview cards at realistic mobile sizes.
- [x] Implement dedicated finite searchable Collections browser and navigation.
- [x] Define verified activity-sorting semantics (no false freshness).
- [x] Clarify collection progress denominator and labels.
- [x] Bound optional external metadata lookups.
- [x] Add multi-size and 25+ saga regression coverage.
- [ ] Verify all acceptance criteria in issue #6.

When verified/closed, move this file to `docs/closed/`, update status, and link the new path in the issue.


## Implementation and verification (2026-10-25)

[PR #8](https://github.com/BenWassa/hearth_v2/pull/8) implements two compact activity-based Tonight rows (browse-only when signals are weak), the searchable finite browser, optional Worlds and existing saga details. Two compact rows preserve Tonight's hierarchy without a large lead cover. The eligibility decision deliberately includes recognized two-film sagas and single owned parts rather than gating local browsing on provider counts.

Manual/import origin and transactional movie watch timestamps distinguish deliberate intent from historical imports, metadata and notes. Unknown old dates remain unknown. The versioned provider-ID World mapping keeps Disney Animation distinct from Pixar/Marvel and avoids duplicating progress. Original typographic/geometric artwork supports optional licensed covers. Visit ordering freezes until explicit refresh/entry; live progress and removals still update.

Verified in the isolated feature checkout: 139 unit tests, 25 API tests, lint with zero warnings, production build, AST-only graph update, and native-browser checks/captures at 320/390/448px. Tests exercise 0–75 sagas, imports, undo, shared repeated writes, provider failure/concurrency, and search/scroll/focus return through saga details. See [validation and 12 screenshots](../collections/VALIDATION.md) and [implementation decisions/limits](../../COLLECTIONS_REDESIGN.md).

Remaining review: confirm final acceptance against the merged application. Firestore transaction contention has controlled SDK tests, not live multi-device validation. Provider totals are optional and the editorial World taxonomy will need maintenance. Keep this record under open/ until GitHub issue #6 actually closes.
