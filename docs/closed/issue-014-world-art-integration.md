# Issue #14 — world art integration

- **Status:** Closed 2026-10-27 · delivered via PR #19 (v3.16.0): covers and designer banner cards on main; portrait heroes and wordmarks intentionally not used (source art archived under the archive/art-worlds-* tags)
- **Issue:** https://github.com/BenWassa/hearth_v2/issues/14
- **Date:** 2026-10-26
- **Parent:** https://github.com/BenWassa/hearth_v2/issues/10
- **UI implementation baseline:** https://github.com/BenWassa/hearth_v2/pull/8 (open), with https://github.com/BenWassa/hearth_v2/pull/9 (stacked)
- **Product/design:** [PRODUCT](../../PRODUCT.md), [DESIGN](../../DESIGN.md), [design tokens](../../DESIGN.json)

## Purpose

Integrate approved art into existing World UI. Landscape 16:9 Tonight cards, full-bleed World header, direct one-tap entry, no second mandatory Explore, content visible below.

## Approved decision

**Tonight = 16:9 landscape full-bleed World cards.** One tap opens the real World page with matching portrait-friendly full-bleed hero and browseable child sagas/films directly underneath. No portrait home cards and no second mandatory Explore action. Original evocative studio-card-signature artwork; filenames and safe zones as in [parent #10](https://github.com/BenWassa/hearth_v2/issues/10).

## Boundaries and dependencies

After PR #8 and stacked #9 are reconciled, own WorldCover, CollectionsRail, CollectionsBrowseView, collectionWorlds manifest, focused tests and `docs/collections/WORLD_ART_INTEGRATION.md`. No art generation or Firebase changes.

Asset lanes #11–#13 can run independently in parallel on separate branches from main. UI lane #14 must inspect and preserve #8/#9 and merge static packs only when verified. Do not self-merge or deploy. The full, up-to-date specification and acceptance criteria remain in [the GitHub issue](https://github.com/BenWassa/hearth_v2/issues/14).

## Acceptance and verification (pending)

- [ ] 16:9 cards at 320, 390, 448px and one-tap content
- [ ] Hero matches cover, content visible, original accessible labels
- [ ] Missing/slow assets, fallback, performance, reduced motion
- [ ] Screenshots and CI proof; focused PR after dependencies

## Implementation evidence

Pending: branch / PR link, generated asset sizes, provenance, screenshots, test/CI results, and human review. Do not record a success state before verified.

When verified and closed, move this issue record to `docs/closed/` and update `docs/README.md` per the repository issue-doc convention.
