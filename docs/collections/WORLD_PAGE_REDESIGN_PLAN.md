# World page redesign plan

Status: decisions made 2026-10-26, nothing built. Evidence: [WORLD_PAGE_RESEARCH_BRIEF.md](WORLD_PAGE_RESEARCH_BRIEF.md) (findings are external and mostly Low confidence for franchise pages; the Disney+ logo-only hero and the Plex tile-to-detail-page pattern are the useful parts).

## Decisions

1. **Structure: hybrid.** Big flagged sagas keep a poster rail. Every other saga becomes a tile in a two-column index.
2. **Big sagas: hand-set flag** in `src/config/collectionCatalog.js`, not an owned-film threshold, so the layout does not jump as the shelf changes.
3. **Hero: art only.** No visible title and no Next up block. The `h1` stays as screen-reader text and as the fallback if the image fails.
4. **Saga tile opens a new saga page.** It replaces `CollectionDetailsModal`, which is deleted in the same work after verification.
5. **Chevrons removed** from shelf headings. The saga page is reached from a tile, or from a quiet "Details" text button on a big-saga rail (to confirm at build time).

## World page, top to bottom

1. Hero art, edge to edge, faded into Shell Black. Floating back control. No visible title.
2. Big-saga rails: one per flagged saga the household owns 2 or more films of, plain serif heading, no chevron. A flagged saga with fewer than 2 owned films falls back to a tile.
3. Saga tile index: two columns, each tile a saga backdrop with the serif saga name, 44px minimum target, no counts on the tile. Every other saga with owned films appears here.
4. Other films, Shorts & specials, TV series: unchanged rails, shown only when present.

Result by World (estimated): Ghibli is hero plus Other films; Disney, DC, Pixar-minus-Toy-Story are hero plus tiles; Marvel is Avengers, Thor and X-Men rails plus about 12 tiles instead of about 15 rows.

Initial flag set (4 or more total films, from general knowledge, verify against TMDB): Avengers, Thor, X-Men, Harry Potter, Skywalker Saga, Toy Story, Shrek, Kung Fu Panda.

## Saga page (replaces the modal)

Must carry over everything the modal does today: provider-aware counts, truthful "listed by provider" wording when format metadata is missing, a separate Shorts & specials section, "Explore films" instead of an invented order for anthologies (James Bond), owned films shown even when provider data is incomplete, and no flash of the previous saga's parts when switching. Layout: saga backdrop hero, serif title, owned films as a poster grid in release order, then provider-listed films not on the shelf, then shorts. Reached from the World tile index and from Tonight's Collections rail, both through `openCollection` in `TonightView.jsx`.

## Tonight World tiles: new art pack (decided 2026-10-26)

Source: `hearth_worlds_option2_production.zip` (untracked in the repo root, also in ~/Downloads; do not commit it). Tonal diagonal gradients plus a transparent `wordmark.svg` per World. Covers are 1600x900 and about 6KB each.

Decisions:
- **Tonight tiles use the pack**: `cover.webp` as the background with `wordmark.svg` as foreground, as the pack's README specifies. Never overlay the SVG on a `-with-logo` image (the name would duplicate).
- **All eight wordmarks as supplied.** The user accepted them. Known caveat, recorded so it is not lost: Disney, Marvel, DC and Star Wars are vector traces from a ChatGPT mockup, not verified official marks, with no license (the pack README says so). The other four are typeset text. COLLECTIONS_REDESIGN.md's "no imitation logos" line must be amended to match. Revisit before any public release.
- **Collision to avoid**: the pack's `cover.webp` has the same path as the current World page hero art. Copy the pack in as `public/assets/worlds/<id>/tile.webp` and `wordmark.svg`, leaving `cover.webp` untouched. Add a `tile` and `wordmark` field per World in `collectionWorlds.js`.
- **World page hero keeps the current art.** Pack `hero.webp` files are not used for now.
- **Palette**: the pack's gradients replace the OKLCH World Tint on Tonight tiles. Amend DESIGN.md's World Tint Rule and its "Tonight loads no World artwork" line. Marvel red and Star Wars brown are allowed because tint never encodes state. `--world-accent` stays for the World page rule.
- **Accessibility**: tiles are interactive, so the accessible name is the World name (wordmark `alt=""`, visible text hidden or `aria-label`); keep a warm-stone fallback so navigation never waits on an image; verify wordmark contrast on each gradient.
- **Clean up before shipping**: the traced Disney, DC and Star Wars wordmarks show jagged edges in the contact sheet. Re-trace or smooth them.
- **Not used**: the pack's Python scripts, concept masks and `gradient.css` files (palette is already in the manifest and README), previews. The mockup's "WORLD COLLECTIONS" label and "Browse all" button do not match the current Tonight design and are illustrative only.

Added to the work split: a fifth worker for the Tonight tiles (asset import as `tile.webp`, `WorldTile` update, DESIGN.md and COLLECTIONS_REDESIGN.md amendments). It touches different files from the World page work, so it can run in parallel.

## Open items to settle during build

- Saga tile visual: backdrop art plus name over a scrim, versus text-only like Tonight's World tiles. Must not read as a duplicate of Tonight's Collections poster rail.
- Whether a "Details" button on big rails is needed once the saga page exists.
- Whether the saga page is a Dialog layered over the World page (as the modal is now) or a routed view. A Dialog keeps back and focus behavior consistent with the current film-details nesting.
- Timeline order for Star Wars and the MCU: out of scope for this pass.

## Work split (proposed)

1. **Data and logic (subagent):** catalog flag, `buildWorlds` grouping into `railSagas` and `tileSagas`, tests. Files: `collectionCatalog.js`, `collectionWorlds.js` and their tests.
2. **World page UI (Codex, worktree):** hero change, `SagaTile` and tile index, chevron removal in `WorldShelves.jsx`, `CollectionsBrowseView.jsx`.
3. **Saga page (Codex or subagent, worktree):** port `CollectionDetailsModal` behavior into the new page, wire `openCollection`, delete the modal and its tests last.
4. **Docs:** update DESIGN.md (Collections browser and Worlds section, "only horizontal rails" wording, tile index) and COLLECTIONS_REDESIGN.md.
5. **Review (me):** read each diff, run lint, vitest and build, screenshot at 320, 390 and 448 widths before and after.

Do not commit unless asked.
