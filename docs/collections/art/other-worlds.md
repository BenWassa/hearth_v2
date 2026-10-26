# Lane C — galaxy and magic World artwork (approved revision)

- **Issue:** [#13](https://github.com/BenWassa/hearth_v2/issues/13)
- **Direction contract:** [#10](https://github.com/BenWassa/hearth_v2/issues/10), Direction D2
- **Branch:** `art/worlds-galaxy-magic`
- **Date:** 2026-10-26
- **Status:** User-approved image composition in ChatGPT on 2026-10-26; PR remains unmerged pending normal code/integration review.

## Approved previews

![Approved landscape covers and portrait hero comparisons](other-worlds-preview.jpg)

![Illustrative 390px Tonight and World view layout](other-worlds-mobile-preview.jpg)

The mobile comparison is a **static layout study**, not a browser-captured screenshot or an exact implementation of Hearth's current components. The navigation, dynamic saga content and accessible overlays remain with integration issue #14.

## Delivered assets

All paths are under `public/assets/worlds/<id>/`; imagery is opaque RGB WebP. The existing transparent typography-only `wordmark.svg` files remain unchanged. Titles are also embedded in the generated bitmaps: use **either** an image's built-in title **or** a wordmark/accessible HTML overlay to avoid double labels.

| World | Asset | Dimensions | File size |
|---|---|---|---:|
| Star Wars | `star-wars/cover.webp` | 1600×900 | 143.6 KiB |
| Star Wars | `star-wars/hero.webp` | 1080×1920 | 234.5 KiB |
| Wizarding World | `wizarding-world/cover.webp` | 1600×900 | 223.4 KiB |
| Wizarding World | `wizarding-world/hero.webp` | 1080×1920 | 315.4 KiB |
| Studio Ghibli | `studio-ghibli/cover.webp` | 1600×900 | 208.0 KiB |
| Studio Ghibli | `studio-ghibli/hero.webp` | 1080×1920 | 352.0 KiB |

All six files were decoded after encoding and confirmed to be the required sizes. All covers are under 350 KiB and all heroes under 600 KiB.

## Change from previous draft

The initial PR used crops from a single multi-panel source expanded with deliberately blurred side margins. During visual review the owner identified these as objectionable. Those six WebPs have been **fully replaced** by **six separately generated full-frame originals**, rather than by masked, blurred or artificially extended crops. Decorative horizontal rules and the small star beneath each world name were removed from all six. The generated compositions and title treatments otherwise retain the owner-approved direction.

## Source mapping and generation provenance

Generated with OpenAI ImageGen in the associated issue #13 ChatGPT conversation on 2026-10-26. Each world now has independently generated landscape and portrait originals, with the following local source-image identifiers retained in the conversation (the multi-megabyte PNG masters are not committed).

| World | Cover generation (PNG master) | Hero generation (PNG master) |
|---|---|---|
| Star Wars | `twin_suns_over_desert_settlement.png` | `twin_suns_over_a_desert_outpost.png` |
| Wizarding World | `wizarding_world_under_moonlight.png` | `wizarding_world_castle_under_moonlight.png` |
| Studio Ghibli | `studio_ghibli_sunset_lakeside_panorama.png` | `ghibli_sunset_over_the_lakeside_village.png` |

The ImageGen sources are natively 1672×941 (landscape) and 941×1672 (portrait). The outputs were independently resized/cropped to their exact production dimensions using Pillow/Lanczos, encoded in lossy WebP at quality 87 (method 6); **no blurred edge extension** or nonlinear stretching was applied. Cover art and hero art are not derived by cropping one another.

- **Star Wars:** twin-sun desert at dusk, rugged outpost skyline, strong golden galactic signature.
- **Wizarding World:** castle above moonlit lake, illuminated stone arch and warm lantern, elegant gold editorial signature.
- **Studio Ghibli:** quiet hillside garden and warm-lit house by sunset lake, soft hand-crafted atmosphere and restrained serif signature.
- **Rights:** Generated artwork and brand names evoke identifiable media properties; no third-party source images or official logo files were downloaded or pasted into these assets. Generation does not establish endorsement or trademark/brand licensing. Intended for this user's private watchlist app; review rights separately before broader distribution. The existing SVG signatures use platform fonts rather than distributed proprietary font files.

## Crop, legibility and integration notes

- **Tonight:** use the complete 16:9 `cover.webp` image; the main title is deliberately positioned in the upper/middle region and within a safe central span. At ~170px card width, provide a separate accessible programmatic name/visible title as necessary.
- **World page:** `hero.webp` is a true portrait frame, not an extension of the landscape. For a height-constrained header, prioritize the upper and central composition and keep the next saga/movie content in or near the first viewport. The long hero image is a source asset, **not** a requirement for a full-height splash.
- **Hearth shell:** `#0c0a09` and amber controls `#d97706`; artwork may include other cinematic hues but must not alter the app tokens.
- **Raster content:** artwork only contains the World title, not buttons, progress, episode counts, film metadata or user watch history.
- The unchanged `wordmark.svg` assets are optional scalable accessible signatures; avoid displaying duplicate raster/vector titles.

## Validation checklist

- [x] Six newly generated full-frame source compositions; no multi-panel crops or blurred sidebands
- [x] Dividers and star ornaments beneath title removed from all six
- [x] Cover sizes **1600×900**, hero sizes **1080×1920**; all six WebPs decode successfully
- [x] Production size budgets respected for cover and hero
- [x] Updated contact sheet and a 390px-width illustrative mobile study
- [x] No shared UI/config/Firestore changes and no other production lane touched
- [x] User visual approval for this artwork in conversation
- [ ] Browser QA: responsive `object-fit` behavior, title fallback, navigation, focus, a11y, reduced-motion and actual saga content—owned by #14
- [ ] PR review, CI and merge—intentionally deferred to project maintainer

## Integrator handoff

Maintain the World IDs and paths in `src/config/collectionWorlds.js`. Tonight uses 16:9 covers; direct World pages use full-bleed portrait heroes with browseable content, not a second 'Explore' gate. Do not infer UX or watchlist behavior from the static artwork studies.

**Do not merge or deploy as part of this art lane.**
