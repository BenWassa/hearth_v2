# Active Sprint Plan

Archive snapshot: `_archive/SPRINTS_NEW_REPO_2026-02-18.md`

## S19 - Tonight Tray Currently Watching + Progress Visibility Fix
Goal: Ensure the Tonight tray has an explicitly horizontal Currently Watching rail and visible per-show series progress on poster cards.

Root-cause review (from current code):
- `src/views/TonightView.js` includes shows in `currentlyWatchingShows` when episode progress exists, even if `status` is not `watching`.
- `src/components/cards/PosterCard.js` only renders the bottom progress bar when `item.status === 'watching'`.
- Result: in-progress shows can appear in Currently Watching without any visible progress bar.
- Rail scroll only appears once card width overflows container width, so current compact card sizing can make the rail appear non-scrollable for common list sizes.

Deliverables:
- Introduce a shared `isShowInProgress` predicate based on episode progress + completion checks, and use it for both:
  - Currently Watching membership
  - Poster progress-bar visibility
- Keep Currently Watching exclusive to `type === 'show'` and exclude fully watched/complete series.
- Make horizontal rail behavior explicit for Currently Watching (card sizing and scroll affordance/snap so swipe/trackpad horizontal movement is obvious).
- Add regression tests for:
  - In-progress shows with non-`watching` status still showing progress bars
  - Completed shows excluded from Currently Watching
  - Horizontal rail layout class contract for Currently Watching section
- Add/update manual QA checklist for mobile and desktop tray behavior.

Done when:
- A show with partial `episodeProgress` always shows a subtle bottom progress bar in Tonight cards, regardless of whether status is `unwatched` or `watching`.
- Currently Watching is visibly horizontal and can be scrolled/swiped when item count exceeds viewport width.
- Fully watched shows do not appear in Currently Watching.
- Tests fail on previous behavior and pass on new behavior.

## Immediate Execution Order
1. Extract and share in-progress predicate.
2. Update PosterCard progress-bar gate.
3. Strengthen Currently Watching rail scroll affordance.
4. Add tests and run targeted test suite.
5. Run manual QA checklist and capture release notes.
