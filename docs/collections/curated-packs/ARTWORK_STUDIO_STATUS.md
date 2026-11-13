# Black Comedy Excellence — artwork studio status and future Workspace handoff

> **LATEST CREATIVE DECISION — 2026-11-13:** All six Black Comedy Excellence chapter heroes are to be **remade as full-bleed, portrait-oriented film collages** with the **live serif title over a localized dark blur/fade**, without decorative lines or a reserved left-side green text block. The old green-space rules, including the Spoofs 42–45% requirement below, remain historical only and are **superseded for new hero artwork**. Preserve original locked PNGs as archives; the new full-bleed versions require separate approval. **Read [FULL_BLEED_CHAPTER_HERO_DIRECTION.md](FULL_BLEED_CHAPTER_HERO_DIRECTION.md) before generating.** Comic Icons' microphone-led identity must be retained or deliberately reviewed, not replaced with random people. This is creative design, **not app implementation**.


**Status:** Creative asset production and review in ChatGPT; **no Hearth app implementation in this workstream**. Updated **2026-11-13**.

**Tracking:** [Artwork-only issue #62](https://github.com/BenWassa/hearth_v2/issues/62) · [Parent product / future Workspace implementation #55](https://github.com/BenWassa/hearth_v2/issues/55) · [Draft planning PR #56](https://github.com/BenWassa/hearth_v2/pull/56).

## Binding workflow / ownership

1. **This ChatGPT artwork conversation:** research exact film stills and performers; generate, visually review, revise and approve all creative assets. Preserve locked originals unchanged and record explicit owner decisions.
2. **After all creative approvals:** package validated source images with metadata, SHA-256, pixel dimensions, crops, provenance and clear outstanding rights/identity notes. Export approved final artwork only; rejected/unapproved trials stay archived.
3. **Later, in Workspace:** user supplies the actual ZIP; Workspace inspects the existing Hearth repo and implements the curated collection, optimized assets, components, responsive behavior, Add-to-Library flows, tests and PR under #55. **No UI/runtime edits or integration before this handoff.**

This supersedes older notes in the parent issue and artwork prompts saying “no image generation yet”. That was true at planning time, but the owner subsequently selected Print Heritage and authorized iterative art production here. The product plan and 50-film editorial catalog remain **provisional** until separately validated.

## Locked art direction

**Print Heritage**, vintage editorial screen printing / layered film-poster collage. Forest green `#173B2B`, burnt red `#B23A24`, muted ochre `#E8A11C`, warm cream `#F3D9A7`, charcoal `#201B17`. Organic hand-torn paper, restrained wear, matte halftone and printable ink colors; no glassy/orange action-poster finish, purple/black gradient substitutions, or glowy perfectly cut seams. Accurate historical actor appearances and film-specific poses matter.

For **Spoofs**, title-safe space must now cover **~42–45% across the entire left height**, even where the torn boundary descends. Prefer a mostly vertical but naturally irregular tear; full character collage on the right 55–58%. This stricter current decision supersedes the earlier general 35–40% suggestion for this banner. No chapter names/text baked into art; Hearth renders live headings (the 2:3 cover is a possible exception).

**Strong accepted visual comparisons:** #10 Friends, #17 Action, #23 Roots. The selected early Direction B image is a style reference only, not a reliable likeness reference.

## Authoritative 29-image decision register (2026-11-12)

| Decision | Assets | Important qualifier |
| --- | --- | --- |
| **LOCK creative selection** | #01 alt cover, #02 primary cover, #03 full-page hero, #04 Comic Icons microphone, #05–09 portraits, #10 Friends, #17 Action, #23 Roots, #28 Love preferred base | 13 creative locks; **#28 Love is still incomplete**, and #04 contains embedded text |
| **REVISE** | #11 Spoofs original, #29 Love alternate | Do not integrate |
| **UNDECIDED** | #13 Love older with text | Reference only |
| **REJECT** | #12, #14–16, #18–22, #24–27 | Keep only in archival 29-image review package |

Creative lock is not clearance for release, ownership/licensing, identity verification or mobile quality. **Confirmed production-ready: 0.**

## Remaining art studio work

- **P0 Spoofs & Satire:** the latest green/organic-torn-paper candidate of 2026-11-13 is the correct general direction but **not locked**. Correct the diagonal tear narrowing the lower-left title-safe zone; reduce orange gloss; check authentic likeness and costumes of Shawn Wayans/Ashtray, Marlon Wayans/Loc Dog, Keenen Ivory Wayans/Jack Spade and Michael Jai White/Black Dynamite. Validate a simulated live heading at 390px. The film trio is *Don't Be a Menace*, *I'm Gonna Git You Sucka*, *Black Dynamite*.
- **P1 Love & Relationships:** preferred visual base is #28 but chapter marked **INCOMPLETE**. Correct Quincy/Monica (*Love & Basketball*: Omar Epps with short visible hair, Sanaa Lathan accurate era/costume), preserve accepted *Boomerang* and *Martin & Gina* fragments, and remove embedded writing/underline/house marks. Film art references to *Love & Basketball* and TV *Martin* do **not** alter the provisional 50-film corpus automatically.
- **P2 Comic Icons:** #04 visual composition locked; produce controlled text-free derivative or explicitly decide on a single heading without duplicate text. Keep original unchanged.
- **P3 Final QA:** source identity, 320/360/390/448px crops, contrast, title region, dimensions, SHA and provenance/rights/attribution notes. Export approved originals and (later) optimized derivatives; do not mislabel 1672×941 concepts as 1920×1080 originals.

## Local handoff organization

The ChatGPT artwork studio produced:

- **Active working pack**: `Hearth_BE_Art_Studio_Working_Pack_2026-11-13.zip` (about 65 MB; **SHA-256** `b588260d6295c1d67886670d91da9db9d86a128c6da6ccbc13f5be52792e0950`). Contains **20 image records**: 12 creatively locked originals; 1 incomplete preferred Love base, 2 Love references; Spoofs original and 3 recent revisions; one historical style reference. Also contains READMEs, status, precise source paths, dimensions, checksums, work queue, Workspace handoff instructions, contact sheet and a text-safe diagnostic.
- **Historical 29-image review**: `Hearth_BE_Art_Review_With_PNGs.zip` (preserves rejected variants and old review source; intentionally excluded from active pack).

These packages exist as **ChatGPT conversation files**, not in GitHub; do not claim Workspace or GitHub can access the ZIP until explicitly transferred. Binary art is intentionally not uploaded to GitHub in this docs-only PR.

## Workspace intake gate (all unchecked)

- [ ] User explicitly approves final Spoofs banner, Love banner and Comic Icons production heading treatment.
- [ ] Every selected asset has stable ID, accurate source/cast, full-resolution deliverable, validated crop and checksum.
- [ ] The final manifest clearly separates selected from rejected/incomplete; all intended film posters come from verified provider paths.
- [ ] Provenance and rights/credit review completed or consciously documented as unresolved.
- [ ] Final ZIP supplied to Workspace and verified byte-for-byte by manifest.
- [ ] Workspace implementation performed separately in a focused code PR linked to #55, with app UI, device QA and add-to-library tests.

**This is a tracking source, not an implementation PR or rights sign-off.**
