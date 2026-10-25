# Issue #3 — New episode release metadata update

- **Status:** Closed
- **GitHub issue:** https://github.com/BenWassa/hearth_v2/issues/3
- **Issue closed:** 2026-06-13
- **Record backfilled:** 2026-10-25
- **Historical record:** Minimal summary of an earlier closed issue; no new implementation audit was performed for this backfill.

## Original request

New television episodes should acquire updated descriptions and other metadata when episodes release. The issue proposed refreshing episode details either once per day or when the app is opened, without deciding on a strategy in the issue text.

## Status and verification

GitHub marks this issue **closed**. The original issue body did not record a particular implementation, test evidence, or closure rationale, so this file does **not** claim that a specific refresh strategy was shipped or verified. Consult the issue history and current implementation before relying on one.

## Pointers for future regression checks

- Show metadata mapping and episode release data.
- On-open and periodic refresh policies versus provider rate limits.
- Previously unknown episode descriptions becoming available after release.
- Cached metadata aging and safe refresh error handling.

Retain this record in `docs/closed/`; reopen/move to `docs/open/` only if the underlying GitHub issue is reopened.
