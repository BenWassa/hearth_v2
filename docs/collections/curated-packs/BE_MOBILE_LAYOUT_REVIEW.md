# Black Comedy Excellence — 390px mobile layout review

**Date:** 2026-11-10  
**Issue:** https://github.com/BenWassa/hearth_v2/issues/55  
**Status:** Interactive **standalone HTML design prototype** developed locally for review. **Not** a production Hearth implementation or approved final UX. No feature code, backend, migrations or production assets changed.

## Work completed

Created a self-contained, offline-safe HTML prototype with embedded compressed concept artwork, modeled on Hearth's current dark design system and present React UI. It is a review artifact, **not yet committed to this branch** because it embeds exploratory artwork and temporary content. The file is available from the conversation artifact link.

### Current Hearth integration verified from source

- \`src/views/components/tonight/CollectionsRail.jsx\`: 2:3 card rail, cell widths \`clamp(7rem,32vw,9rem)\`; currently renders from household saga rollups only and returns null for zero eligible sagas.
- \`src/views/CollectionsBrowseView.jsx\`: All collections and World destination currently implemented as fullscreen modal/dialog with back and scroll handling; BE requires its own explicit destination and independent registry.
- \`src/views/TonightView.jsx\`: existing Collections rail placement.
- \`DESIGN.md\`, \`DESIGN.json\`, \`src/index.css\`: Shell Black #0c0a09, Soot #1c1917, stone ramp, muted text, platform serif headings and native system sans body, 44px touch controls, full-screen World hero vignette.

### Prototype screens

1. **Tonight:** Existing 2:3 Collections rail including a BE cover concept. Rail card opens BE full page.
2. **BE full page:** 16:9 print-heritage portrait hero on right, native title overlay left/bottom; concise description; 6-film \`Start here\` shelf; \`Explore by theme\` chapter cards; two-column \`All films\` index. Text-only cards for themes without approved art.
3. **Comic Icons chapter:** existing microphone concept banner, a featured-performer space, three secondary portrait positions, and related film shelf. All performer images intentionally left as placeholders because identities are not approved.
4. **Film preview:** name/year and explicit locally simulated \`Add to Library\` state. This is **not a real provider or Firestore action**.
5. **Editorial / Compact mode toggle:** user can compare more editorial prose/large chapter card hierarchy versus faster film/content access. This is prototype-only, **not a proposed production preference setting**.

### Assets included only for demonstration

- Concept BE portrait cover, print-heritage 2:3.
- Selected-style BE text-free right-portrait hero in 16:9.
- Comic Icons microphone banner with baked title as an interim graphic. The production asset handoff spec still recommends text-free art with Hearth-rendered title.
- **Film artwork is deliberately not simulated with generated movie posters.** Simple poster-colored tiles are labelled **POSTER PREVIEW**; production uses verified poster assets from TMDB after identity and rights checks.
- No real celebrity portrait assets were incorporated into the prototype; they have not been approved.
- The chapter and sample film sequences are **draft illustrations**, not a final film-to-chapter classification.

## Design findings / proposed decisions for owner review

**Keep**
- Native Hearth Shell Black and stone ramp around the imagery, rather than making the whole page cream or red.
- One-tap Tonight rail → full-screen BE, no intermediate promotional splash.
- Large right-aligned hero portrait gives room for live title and short intro. Text-free hero remains useful for responsive layout.
- Serif title + concise supporting sans copy; no repeated image title in the BE hero.
- Short film shelf at start, not an import checklist.
- Comic Icons as editorial hybrid: header → one featured profile area → three secondary portraits → a movie shelf. Keep celebrity page navigation only as a future, explicit content-gated decision.
- A two-column All films grid at 390px, due title/year legibility.
- No extra rail for one curated pack.

**Modify before implementation**
- Current Comic Icons *concept reference* bakes \`Comic Icons\` into the image, while full-page chapter currently renders a second live text heading. **Production must use text-free microphone background OR suppress duplicate header text, keeping one accessible heading.** Recommend text-free graphic plus native H1 for consistent responsiveness.
- At phone size, a fixed 16:9 hero leaves the live H1 near lower artwork; check at 320px and with long translations, and adjust scrim appropriately.
- Maintain actual Tonight scroll position/focus on back; the prototype resets when returning to a screen and must not be used to infer navigation acceptance.
- The concept's floating dock appears on all screens; actual Hearth full-page overlay may hide/bypass the dock based on existing navigation rules. Decide during implementation, avoid competing back controls.
- Only 3 chapter previews are currently shown; all authored chapters need a complete reachable index even when not illustrated.
- No real data flow or offline states. Film detail CTAs require exact TMDB identity mapping and safe Firestore add, including recently-removed explicit restore.
- The image and UI must be checked with portrait-cover typography readable at ~112–144px and with true responsive crops at 320px.

## Recommended first implementation milestone

Create a **feature-flagged static editorial-pack page shell** (no writes):
1. BE tile in Collections even with zero saved films.
2. Full-page BE header + \`Start here\` fixture + chapter navigation + finite film index.
3. Back/focus/scroll tests in Android/browser history.
4. Data-backed film art only once provider IDs are verified.
5. Add-to-Library flow last, as a separate strict-write milestone.

This should be split into implementation tasks/PRs rather than mixing content validation, design artwork and Firestore writes at once.

## Explicit unresolved decisions

- Do users prefer **Editorial** or **Compact** page density? Prototype supports comparison; no setting needs to ship.
- Should Comic Icons sit as a **full chapter page**, or can an editorial-hybrid section live within the main BE page and only expand when entered? Current mock uses full chapter page, but every extra tap should justify its value.
- Specific featured/supporting performers and whether editorial person pages justify their own navigation remain open.
- Remaining four chapter graphics should not be generated in bulk before validating chapter-card size and content hierarchy.
- Rights/attribution/film IDs/BE source commit still require review.

## Test notes

The HTML was opened in headless Chromium using in-memory HTML content, and the following prototype checks were exercised:
- Render and navigate to BE full page.
- Render and navigate to Comic Icons.
- Open \`Friday (1995)\` mock film detail.
- Toggle local \`Add to Library\` state.
- Switch to Compact layout.

Both layout screens were captured at a 1150×920 desktop viewport containing a **390px simulated phone**. These checks are limited to the standalone HTML concept and **do not count as Hearth application test passes**.

## Related docs
- [Technical/product scope](../../open/issue-055-curated-film-packs.md)
- [BE content blueprint](BLACK_COMEDY_EXCELLENCE_BLUEPRINT.md)
- [Individual generation prompts](ASSET_GENERATION_PROMPTS.md)
