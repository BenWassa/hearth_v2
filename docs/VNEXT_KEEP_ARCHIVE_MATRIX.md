# Hearth vNext Keep/Archive Matrix

## Decision Summary
Use `backend-live-metadata-foundation` as the vNext working base.

- Keep and evolve: runtime code, API surface, schema/rules, migration docs.
- Preserve as legacy knowledge: poster tool and static-media workflows.
- Archive later: static deployment artifacts and legacy planning folders.

## Keep for vNext
- `src/`
- `api/`
- `firestore.rules`
- `firestore.indexes.json`
- `docs/BACKEND_MIGRATION_CONTROL_PLANE.md`
- `SPRINTS.md`

## Keep as Legacy Knowledge (Archive Later)
- `tools/hearth-poster-tool/`
  - Reason: old TMDB-assisted poster/backdrop workflow remains useful reference during transition.
  - Planned future location: `_archive/vnext-legacy/hearth-poster-tool/`

## Archive/De-Prioritize for New Runtime
- `docs/` build artifacts used for static hosting output (`docs/static/`, copied media assets).
- `commissions/`
- `dev_exports/`
- Older historical planning files already under `_archive/`.

## Transitional Rules
- Do not delete old tooling until Firebase App Hosting add flow fully replaces it.
- Keep old and new ingestion paths in parallel until production parity is confirmed.
- Move legacy folders only after cutover checklist passes and rollback window closes.

## Immediate Actions Applied
- Created `_archive/vnext-legacy/` as the designated archive target for old approach assets.
- Documented Firebase App Hosting target and Gemini-later metadata plan in `docs/VNEXT_APP_HOSTING_ROADMAP.md`.
