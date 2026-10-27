# Issue #12 — world art animation

- **Status:** Closed 2026-10-27 · delivered via PR #19 (v3.16.0): covers and designer banner cards on main; portrait heroes and wordmarks intentionally not used (source art archived under the archive/art-worlds-* tags)
- **Issue:** https://github.com/BenWassa/hearth_v2/issues/12
- **Date:** 2026-10-26
- **Parent:** https://github.com/BenWassa/hearth_v2/issues/10
- **UI implementation baseline:** https://github.com/BenWassa/hearth_v2/pull/8 (open), with https://github.com/BenWassa/hearth_v2/pull/9 (stacked)
- **Product/design:** [PRODUCT](../../PRODUCT.md), [DESIGN](../../DESIGN.md), [design tokens](../../DESIGN.json)

## Purpose

Pixar, Disney, DreamWorks Animation: recognizable but original minimalist studio-title-card imagery.

## Approved decision

**Tonight = 16:9 landscape full-bleed World cards.** One tap opens the real World page with matching portrait-friendly full-bleed hero and browseable child sagas/films directly underneath. No portrait home cards and no second mandatory Explore action. Original evocative studio-card-signature artwork; filenames and safe zones as in [parent #10](https://github.com/BenWassa/hearth_v2/issues/10).

## Boundaries and dependencies

Own `public/assets/worlds/pixar/**`, `public/assets/worlds/disney-animation/**`, `public/assets/worlds/dreamworks/**`, and `docs/collections/art/animation.md`. No React or shared design files.

Asset lanes #11–#13 can run independently in parallel on separate branches from main. UI lane #14 must inspect and preserve #8/#9 and merge static packs only when verified. Do not self-merge or deploy. The full, up-to-date specification and acceptance criteria remain in [the GitHub issue](https://github.com/BenWassa/hearth_v2/issues/12).

## Acceptance and verification (pending)

- [ ] 3 paired cover/hero/wordmark packs
- [ ] Animation-studio clarity without copying exact official mascot marks
- [ ] 390px legibility/crop preview, provenance, file stats
- [ ] Focused PR, no merges

## Implementation evidence

Pending: branch / PR link, generated asset sizes, provenance, screenshots, test/CI results, and human review. Do not record a success state before verified.

When verified and closed, move this issue record to `docs/closed/` and update `docs/README.md` per the repository issue-doc convention.
