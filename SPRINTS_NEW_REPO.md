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

## S20 - Tonight Cinematic UI Upgrade (Header + Hero + Streaming Rails)
Goal: Shift Tonight from utility-list layout into a premium cinematic browsing surface inspired by Apple TV / Netflix / HBO Max interaction patterns.

Design constraints and assumptions:
- Use high-quality backdrops/posters already in payload for the hero.
- Clearlogo is in scope for metadata mapping, but hero must always fall back to typography when logo is unavailable.
- Keep existing data model and detail/open flows (`onOpenDetails`, status toggles) intact.

Deliverables:
- Replace current Tonight top bar with a 3-column cinematic header in `src/views/components/tonight/TonightHeaderMenu.js`:
  - Left: hamburger action with existing menu open/close behavior.
  - Center: Hearth brand treatment (icon + serif wordmark).
  - Right: compact space/profile chip with truncation and hover states.
  - Preserve existing dropdown/menu JSX and action wiring.
- Add new hero carousel component `src/views/components/tonight/HeroCarousel.js`:
  - Accept mixed movie/show items and `onOpenDetails`.
  - Auto-advance every 5 seconds with cleanup-safe interval logic.
  - Smooth crossfade transitions between slides.
  - Strong readability overlays (bottom and left gradients).
  - Metadata row (`type`, `year`) and pagination dots.
  - Fallback to poster when backdrop is unavailable.
- Integrate hero + rail layout in `src/views/TonightView.js`:
  - Inject hero above suggestion sections with top 5 combined suggestions.
  - Keep Currently Watching as first content rail if populated.
  - Convert Movies and TV Shows from limited daily picks to full unwatched rails.
  - Pass rail-specific props (`layout="rail"`, edge fade, scrollbar hiding, padding, no Decide button) to match streaming UX.
- Add "rewind to start" end-of-rail behavior in `src/views/components/tonight/SuggestionSection.js`:
  - Add end-of-list trigger card or sentinel observer.
  - Smoothly scroll rail back to first poster when user reaches rail end.
  - Avoid accidental loops while user is actively dragging/swiping.
  - Keep accessibility intact for keyboard and reduced-motion users.
  - Scope rewind behavior to Movies and TV Shows rails only (exclude Currently Watching).
  - Define trigger contract: only fire when user reaches the final card region, then apply cooldown to prevent repeated auto-jumps.
- Bridge TMDB clearlogo data from API to UI:
  - Update `api/_lib/mappers/mediaMapper.js` to map `logoUrl` from `data.images.logos`.
  - Add mapper helper logic to prioritize English logos (`iso_639_1 === 'en'`) with first-logo fallback.
  - Keep null-safe fallback when logos are missing or malformed.
  - Ensure both `mapMovieDetails` and `mapShowDetails` include `logoUrl` in mapped output.
  - Preserve existing TMDB append behavior (`images`) verified by `api/__tests__/media.test.js`.
  - Add/adjust mapper tests to verify:
    - English-logo prioritization
    - First-logo fallback when no English logo exists
    - `logoUrl: null` when no logo list is present
  - Add data backfill task to populate stored `logoUrl` for existing library items.
- Update hero branding behavior to consume mapped logo metadata:
  - In `HeroCarousel.js`, render transparent image logo when `currentItem.logoUrl` exists.
  - Keep existing typography as fallback when logo image is unavailable or fails to load.
  - Preserve readability overlays and title/year/type metadata contract.
  - Use clearlogo + backdrop combination only in the Tonight hero element; do not change non-Tonight surfaces in this sprint.
- Quality and regression coverage:
  - Unit/component tests for hero fallback image behavior and carousel index cycling.
  - Interaction tests for rail rendering with full unwatched lists.
  - Interaction tests for end-of-rail rewind trigger behavior.
  - Include reduced-motion and keyboard navigation checks for rewind logic.
  - Manual QA pass for mobile swipe, desktop wheel/trackpad, and sticky header overlap.

Done when:
- Tonight opens with cinematic header and autoplaying hero at the top.
- Movie and TV rows behave as persistent horizontal rails over full unwatched catalogs.
- Reaching rail end visibly "rewinds" back to start without jank for Movies/TV rails only.
- Newly mapped movie/show detail payloads include `logoUrl` whenever TMDB `images.logos` data exists.
- Existing stored library items are backfilled with `logoUrl` where TMDB logo data is available.
- Hero visually prefers clearlogo artwork and gracefully falls back to text title when no logo is available.
- Clearlogo + backdrop pairing is used only in the Tonight hero; other views remain unchanged.
- Existing detail modal open action and status toggles continue to work.
- Test suite includes coverage for hero fallback/cycle, rewind trigger contract, and reduced-motion behavior.

## Immediate Execution Order
1. Map and validate `logoUrl` in `api/_lib/mappers/mediaMapper.js` (movie + show) and keep `images` append coverage green.
2. Implement stored-item backfill workflow for `logoUrl`.
3. Build and wire `HeroCarousel` in `src/views/components/tonight/HeroCarousel.js`.
4. Refactor `TonightHeaderMenu` to 3-column cinematic layout while preserving menu logic.
5. Recompose `TonightView` content stack: hero, Currently Watching rail, Movies rail, TV Shows rail.
6. Implement rewind trigger logic inside `SuggestionSection` for Movies/TV rails only, with cooldown + reduced-motion handling.
7. Add tests, run targeted suite, and complete device QA checklist.
