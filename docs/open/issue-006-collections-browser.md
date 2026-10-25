# Issue #6 — Collections: scalable saga browser

- **Status:** Open (existing issue; this document backfills the new docs convention)
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

- [ ] Decide preview entry vs preview cards at realistic mobile sizes.
- [ ] Implement dedicated finite searchable Collections browser and navigation.
- [ ] Define verified activity-sorting semantics (no false freshness).
- [ ] Clarify collection progress denominator and labels.
- [ ] Bound optional external metadata lookups.
- [ ] Add multi-size and 25+ saga regression coverage.
- [ ] Verify all acceptance criteria in issue #6.

When verified/closed, move this file to `docs/closed/`, update status, and link the new path in the issue.
