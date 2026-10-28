# Issue #10 — world art direction d2

- **Status:** Closed 2026-10-27 · delivered via PR #19 (v3.16.0): covers and designer banner cards on main; portrait heroes and wordmarks intentionally not used (source art archived under the archive/art-worlds-* tags)
- **Issue:** https://github.com/BenWassa/hearth_v2/issues/10
- **Date:** 2026-10-26
- **Parent:** https://github.com/BenWassa/hearth_v2/issues/10
- **UI implementation baseline:** https://github.com/BenWassa/hearth_v2/pull/8 (open), with https://github.com/BenWassa/hearth_v2/pull/9 (stacked)
- **Product/design:** [PRODUCT](../../PRODUCT.md), [DESIGN](../../DESIGN.md), [design tokens](../../DESIGN.json)

## Purpose

Approved production contract for Direction D2 World covers, portrait heroes, signature typography, file formats, QA, and parallel integration sequencing.

## Approved decision

**Tonight = 16:9 landscape full-bleed World cards.** One tap opens the real World page with matching portrait-friendly full-bleed hero and browseable child sagas/films directly underneath. No portrait home cards and no second mandatory Explore action. Original evocative studio-card-signature artwork; filenames and safe zones as in [parent #10](https://github.com/BenWassa/hearth_v2/issues/10).

## Boundaries and dependencies

No code ownership; coordinates lanes #11–#14 and PR #8/#9. Approved one-tap landscape-World UX supersedes older 2-saga/portrait mockups.

Asset lanes #11–#13 can run independently in parallel on separate branches from main. UI lane #14 must inspect and preserve #8/#9 and merge static packs only when verified. Do not self-merge or deploy. The full, up-to-date specification and acceptance criteria remain in [the GitHub issue](https://github.com/BenWassa/hearth_v2/issues/10).

## Acceptance and verification (pending)

- [ ] Art lanes provide eight complete validated asset packs
- [ ] All final approvals and source/provenance linked
- [ ] Integration #14 demonstrates 16:9 Tonight and no extra gate
- [ ] Optional motion held until static review

## Implementation evidence

Pending: branch / PR link, generated asset sizes, provenance, screenshots, test/CI results, and human review. Do not record a success state before verified.

When verified and closed, move this issue record to `docs/closed/` and update `docs/README.md` per the repository issue-doc convention.
