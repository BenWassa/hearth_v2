# Legendary Directors — artwork production register

**Status:** Planning ledger, 2026-11-13. **No authentic portraits or signatures have yet been delivered as independent production assets.** Current in-chat mockups are composite design references, not source files. Roster shown below is **provisional** and must be finalized under [#60](https://github.com/BenWassa/hearth_v2/issues/60) before production completion.

## Asset convention
- 2:3 Tonight rail tile: `public/assets/collections/legendary-directors/cover.webp`
- Portrait: `public/assets/collections/legendary-directors/directors/<slug>/portrait.webp`
- Signature (only after authenticity/rights validation): `public/assets/collections/legendary-directors/directors/<slug>/signature.svg` or `.png`
- Add a separate `hero.webp` only when a distinct 16:9 crop is justified; never upscale a small portrait.
- Preserve external source URL, source creator/owner and permissions, license, original size, crop treatment and review date **for each delivered asset** in `ART_PROVENANCE.md` (not yet created).
- Validate portrait legibility at 320/360/390/448px and cover at 112–144px wide. The signature is ornamental: if unavailable, show the person's name with normal type, no fabricated handwriting.

## Provisional portrait/signature register

| Director (provisional) | Slug | Portrait | Signature | Provenance |
| --- | --- | --- | --- | --- |
| Christopher Nolan | christopher-nolan | Not sourced | Not verified | Pending |
| Steven Spielberg | steven-spielberg | Not sourced | Not verified | Pending |
| Martin Scorsese | martin-scorsese | Not sourced | Not verified | Pending |
| Quentin Tarantino | quentin-tarantino | Not sourced | Not verified | Pending |
| Stanley Kubrick | stanley-kubrick | Not sourced | Not verified | Pending |
| Hayao Miyazaki | hayao-miyazaki | Not sourced | Not verified | Pending |
| Bong Joon-ho | bong-joon-ho | Not sourced | Not verified | Pending |
| Akira Kurosawa | akira-kurosawa | Not sourced | Not verified | Pending |
| Alfred Hitchcock | alfred-hitchcock | Not sourced | Not verified | Pending |
| Francis Ford Coppola | francis-ford-coppola | Not sourced | Not verified | Pending |
| Wong Kar-wai | wong-kar-wai | Not sourced | Not verified | Pending |
| Satyajit Ray | satyajit-ray | Not sourced | Not verified | Pending |

## Owner-approved concept, not yet files
- Portrait-driven directory and individual page, restrained typography, real reference photography and no projector cliché.
- Signature adjacent to name if authentic and permitted.
- Tonight cover concept has positive owner feedback; its layout must be recreated as a **clean standalone 2:3 production image** and evaluated at actual rail size.
- Director page: Watch Next and fixed Essential 10, ratings at right, one-tap modal and Add to shelf. These are application UI elements, **not part of baked-in portrait art**.

## Release gates
- [ ] #60 roster confirmed
- [ ] Verified authentic portrait and signature source/rights for each asset delivered
- [ ] Owner review of source gallery and individual output files
- [ ] WebP/SVG/PNG exports checked at mobile crops and brightness/contrast
- [ ] All assets with provenanced filenames committed via focused art PR
- [ ] #57 integration tests and final release approval
