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


## Implementation revision (2026-10-26)

The user's clarified navigation is **Tonight → World → saga → film**. Every represented World appears on Tonight, even for small libraries or a single child saga. This supersedes the earlier capped saga-preview and singleton-bypass proposals in the issue's historical discussion. The prior implementation in PR #8 used those earlier proposals and is corrected by this revision.

Eligibility follows the approved editorial catalog plus persistent member-shared Show/Hide/Default overrides keyed by canonical provider/collection ID. Fast & Furious, Dark Knight and Back to the Future may appear with one owned feature; Paddington and Ghostbusters are excluded by default. No numeric ownership/provider threshold auto-promotes. Explicit World metadata is validated and survives catalog/template roundtrips; brand association, saga membership and first-class visibility remain separate.

Worlds include Wizarding World, Marvel, Star Wars, Pixar, Disney, DC, DreamWorks Animation and optionally Ghibli when represented. Child sagas, standalone features, shorts/specials and TV have separate sections and counts. Bond uses Explore films rather than an invented next-film sequence. Nested film details preserve the saga and its focus/scroll. On-demand provider hydration is bounded at three and never substitutes a TV show for a missing movie ID.

The shared-preference service/hook has 21 targeted tests and the new Firestore rules have passed 25 actual isolated emulator attack checks. No production household writes or deployment occurred. The rules must ship with the later reviewed release. See [complete validation and mobile screenshots](../collections/VALIDATION.md) for the final integrated test/build results and [implementation decisions](../../COLLECTIONS_REDESIGN.md) for semantics and limitations. Keep this issue record open until review/merge and actual GitHub closure.
