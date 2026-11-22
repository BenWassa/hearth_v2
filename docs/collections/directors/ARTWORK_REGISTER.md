# Legendary Directors — artwork production register

**Status (2026-11-22):** Roster final (12 directors, owner-approved under #60). **The owner makes all Directors art (portraits, signatures, Tonight cover) themselves**; no third-party sourcing. The app already has optional slots for every asset below and falls back to text until a file exists. No image is committed.

## Asset convention
- 2:3 Tonight rail tile: `public/assets/collections/legendary-directors/cover.webp`
- Portrait: `public/assets/collections/legendary-directors/directors/<slug>/portrait.webp`
- Signature (only after authenticity/rights validation): `public/assets/collections/legendary-directors/directors/<slug>/signature.svg` or `.png`
- Add a separate `hero.webp` only when a distinct 16:9 crop is justified; never upscale a small portrait.
- Preserve external source URL, source creator/owner and permissions, license, original size, crop treatment and review date **for each delivered asset** in `ART_PROVENANCE.md` (not yet created).
- Validate portrait legibility at 320/360/390/448px and cover at 112–144px wide. The signature is ornamental: if unavailable, show the person's name with normal type, no fabricated handwriting.

## Portrait/signature register

| Director | Slug | Portrait | Signature | Provenance |
| --- | --- | --- | --- | --- |
| Akira Kurosawa | akira-kurosawa | Not delivered | Not delivered | Pending |
| Alfred Hitchcock | alfred-hitchcock | Not delivered | Not delivered | Pending |
| Stanley Kubrick | stanley-kubrick | Not delivered | Not delivered | Pending |
| Ingmar Bergman | ingmar-bergman | Not delivered | Not delivered | Pending |
| Federico Fellini | federico-fellini | Not delivered | Not delivered | Pending |
| Satyajit Ray | satyajit-ray | Not delivered | Not delivered | Pending |
| Agnès Varda | agnes-varda | Not delivered | Not delivered | Pending |
| Martin Scorsese | martin-scorsese | Not delivered | Not delivered | Pending |
| Steven Spielberg | steven-spielberg | Not delivered | Not delivered | Pending |
| Hayao Miyazaki | hayao-miyazaki | Not delivered | Not delivered | Pending |
| Wong Kar-wai | wong-kar-wai | Not delivered | Not delivered | Pending |
| Bong Joon-ho | bong-joon-ho | Not delivered | Not delivered | Pending |

## Owner-approved concept, not yet files
- Portrait-driven directory and individual page, restrained typography, real reference photography and no projector cliché.
- Signature adjacent to name if authentic and permitted.
- Tonight cover concept has positive owner feedback; its layout must be recreated as a **clean standalone 2:3 production image** and evaluated at actual rail size.
- Director page: Watch Next and fixed Essential 10, ratings at right, one-tap modal and Add to shelf. These are application UI elements, **not part of baked-in portrait art**.

## Release gates
- [x] #60 roster confirmed (2026-11-13)
- [ ] Verified authentic portrait and signature source/rights for each asset delivered
- [ ] Owner review of source gallery and individual output files
- [ ] WebP/SVG/PNG exports checked at mobile crops and brightness/contrast
- [ ] All assets with provenanced filenames committed via focused art PR
- [ ] #57 integration tests and final release approval
