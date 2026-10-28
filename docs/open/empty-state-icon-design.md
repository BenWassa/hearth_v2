# Empty-state icon design handoff

GitHub issue: [#46](https://github.com/BenWassa/hearth_v2/issues/46)

## Purpose

Design a small icon or restrained illustration for Hearth’s empty Tonight page. The layout and copy are already simplified; the visual should give the empty body a focal point without adding onboarding steps.

Primary scope: Tonight with an empty shelf. Consider whether the same visual language can extend to Library and Memories, but do not require three new assets.

## Current implementation

- Baseline commit: `115d92e` (local commit; may not yet be pushed).
- Shared component: `src/views/components/ShelfEmptyState.jsx`.
- Call sites: `src/views/TonightView.jsx` and `src/views/ShelfView.jsx`.
- Design references: `PRODUCT.md`, `DESIGN.md`.
- Local preview: `http://localhost:5174/?mode=demo` in the current dev session. Use the Empty shelf demo scenario; a refresh may reset demo state.
- The content group is centered horizontally and vertically between the header and floating bottom navigation.
- Existing shared layout uses a minimum height of `calc(100svh - 15rem - var(--safe-top) - var(--safe-bottom))`. Recheck the visual balance after adding an icon rather than assuming this calculation remains ideal.

Tonight currently reads:
> Add something to watch
> Your movies and shows will appear here.
> [Add your first title]

Library reads:
> Your Library is empty
> Keep the movies and shows you want to watch here.
> [Add your first title]

Memories reads:
> Nothing watched yet
> Titles you mark as watched will appear here.

Memories links to Library when titles exist, otherwise Add. Populated shelves and filter-no-match states are separate cases.

## Direction to explore

Explore two or three rough concepts in the real empty-state layout before polishing one. Suggested starting points, not approved designs:

1. A simple shelf with a small film or screen detail.
2. A quiet armchair or paired seats, suggesting choosing something together.
3. A reduced Hearth motif, related to the existing candle/heart/shelf identity without repeating the full app logo.

Start around 56–80 CSS pixels, centered above the title with roughly 20–24px separation. Treat these as exploration values. The icon should read clearly on a 390px phone without dominating the heading or moving the group into the navigation.

Prefer a clean SVG or React SVG component that remains crisp at small sizes. The app already uses `lucide-react`; compare stroke weight and optical size with the existing navigation icons. Review existing icons through the Better Icons skill before choosing a stock base. Use original vector work if a stock symbol feels generic. If raster exploration is useful, use the imagegen skill and retain a transparent background; final asset format should follow the chosen visual.

## Constraints and user feedback

- Keep copy plain. The user explicitly rejected sentimental/clichéd prose.
- No eyebrow on Tonight. No numbered steps or extra onboarding text.
- Preserve one clear action: Add your first title.
- Keep the content centered with balanced body spacing. Left alignment and an upper-left cluster were explicitly rejected.
- Hide sort/type filters when the active Library or Memories tab has no titles. Keep filters available when they cause zero matches.
- Recently removed is hidden when there is nothing to restore.
- Warm stone neutrals on the near-black shell. Amber remains primarily the action color; do not create a competing bright accent.
- No decorative gradient panels, glass cards, emoji substitute, generic sparkle badge, or animation needed.
- This is an empty-state illustration, not a replacement app icon or new navigation item.

## Deliverables and acceptance

- Present 2–3 visual concepts in context, then refine the chosen direction.
- Supply the final asset and integrate it through the shared empty-state component with an explicit optional illustration slot or variant.
- Decide deliberately where it appears: empty Tonight first; Library/Memories reuse only if appropriate. Avoid showing an onboarding illustration on filter-no-match states by default.
- Decorative graphics use `aria-hidden="true"` (SVG) or empty alt text (image); the heading and button convey the meaning.
- Verify at 320, 390, and 448px widths plus desktop and a short landscape viewport. Keep text legible, the action reachable, and navigation unobstructed.
- Capture screenshots of Tonight, Library, and Memories after integration. Judge visual centering of the whole group, not just DOM alignment.
- Run relevant view tests and lint. Run `graphify update .` after code changes.
- Keep unrelated demo-scenario changes out of this work.

Companion handoff: `docs/open/empty-state-icon-design.md`.
