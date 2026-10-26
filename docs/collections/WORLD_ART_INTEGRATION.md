# World artwork integration (#14)

Integration branch: `feat/world-art-integration`, **stacked on PR #9** (`design/impeccable-critique-optimize-extract`) so that extracted UI primitives remain present. PR #9 is itself stacked on PR #8 (`feat/collections-worlds`). **Recommended merge order:** review/merge #8 → retarget/reconcile and merge #9 → review/merge artwork #15, #16, #17 → retarget this PR to main and remove duplicate binary additions if already present. No automatic merging or deployment.

## Exact production assets

All eight canonical IDs use local `cover.webp` (1600×900, 16:9) and `hero.webp` (1080×1920, 9:16). Signatures are `wordmark.png` (Marvel, DC, Pixar, Disney, DreamWorks) or `wordmark.svg` (Star Wars, Wizarding World, Studio Ghibli) from their respective **existing** art commits. The Git blobs are copied byte-for-byte, not regenerated or re-encoded. Original provenance remains in `docs/collections/art/{superhero,animation,other-worlds}.md` from the art lanes. These assets and related PRs still require owner review; do not infer copyright clearance from noncommercial use.

## Behaviour

- Tonight and the full Collections overview display 16:9 landscape cover buttons with visible HTML titles, image error fallback and stable layout. Household-represented World visibility and all existing editorial rules remain unchanged.
- One click opens the **actual** World view. The artwork is a bounded first section inside the same scroll container, immediately followed by search, sort, sagas, Other films, Shorts & specials and TV. No Explore gate, extra route, carousel or new dock tab.
- Portrait hero uses at most 39dvh (216–360px), fades into the shell and reserves dimensions before images decode. A transparent wordmark is progressive enhancement; accessible heading and real text remain if missing or corrupt.
- Existing overview/tile focus restoration, Escape/back, nested saga→film navigation, pagination/search, 44px controls and PR #9 reduced-motion behavior are reused rather than rewritten.

## QA / blockers

- Unit coverage added for eight exact manifest paths, first World hero with immediate saga content, corrupt hero fallback, standalone films.
- Responsive design target: 320, 390 and 448px; actual browser screenshots at those widths, keyboard focus, offline and slow-network emulation **must be captured before this PR is considered ready**. Do not treat mockups or PR #8 screenshots as verification of the integrated artwork.
- Required local/CI commands: `npm run lint:ci`, `npm run format:check`, `npm run test:unit`, `npm run test:api`, `npm run build`. Do not deploy Firestore rules from PR #8 in this integration lane.
- Potential follow-up: image-generated PNG wordmarks in the superhero/animation lanes are large relative to their displayed size; optimize them in the owning art PRs if measured first-paint or mobile bandwidth requires it.
