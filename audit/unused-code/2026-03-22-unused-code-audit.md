# Unused Code Audit

Date: 2026-03-22
Scope: repo audit for deprecated, old, or apparently unused code/files. No cleanup applied in this pass.

## Method

- Mapped runtime entrypoints from `src/index.jsx`, `server/index.js`, App Hosting API handlers, and `package.json` scripts.
- Built a static reachability pass across `src/`, `server/`, `api/`, and `scripts/`.
- Cross-checked candidates with direct text search, docs references, lint, and unit-test output.
- Kept generated artifacts and test-only helpers separate from actual runtime dead-code candidates.

## High Confidence Removal Candidates

These files appear to be unreferenced by the current runtime and not named in docs as intentional keepers.

| Path | Why it looks stale | Recommended action |
| --- | --- | --- |
| `src/components/ItemDetailsModal/hooks/useItemData.js` | Hook is not imported anywhere; its merge logic is now inlined inside `src/components/ItemDetailsModal.jsx`. | Delete after a quick diff check confirms no logic drift. |
| `src/components/ItemDetailsModal/hooks/useModalEffects.js` | Hook is not imported anywhere; equivalent side-effect logic is now inlined inside `src/components/ItemDetailsModal.jsx`. | Delete after a quick diff check confirms no logic drift. |
| `src/lib/utils.js` | `cn()` helper is not imported anywhere. This looks like leftover `shadcn/ui` scaffolding. | Delete if no near-term plan to introduce shared class-composition helpers. |
| `src/views/components/tonight/EnergyPickModal.jsx` | No imports in runtime or tests. | Delete, or rewire if the feature is meant to return. |
| `src/views/components/tonight/VibePickModal.jsx` | No imports in runtime or tests. | Delete, or rewire if the feature is meant to return. |
| `src/views/components/tonight/PickForUsCard.jsx` | No imports in runtime or tests. | Delete, or rewire if the feature is meant to return. |

## Medium Confidence Candidates

These are likely stale, but they touch older behavior or workflow assumptions and should be checked before removal.

| Path | Why it looks stale | Recommended action |
| --- | --- | --- |
| `src/domain/watchlist.js` | Imported only by `src/tonightTray.test.js`; nothing in runtime uses `buildTonightTray()` or `isTonightTrayValidForPool()`. Looks like a superseded “Tonight tray” selection model. | Decide whether to delete both file and test together, or archive if the algorithm may return. |
| `components.json` | Leftover `shadcn/ui` config; repo still has the matching alias target `src/lib/utils.js`, but no actual component generator output pattern is active. | Keep only if `shadcn` generation is still part of the workflow; otherwise remove with `src/lib/utils.js`. |
| `cors` dependency | Installed but no source usage in `src/`, `server/`, `api/`, `scripts/`, or config files. | Remove from `package.json` unless upcoming server work needs it. |
| `yaml` dependency | Installed but no repo-local usage found. May be historical or previously planned config tooling. | Remove from `package.json` unless an external workflow still depends on it. |

## Not Dead, But Should Not Be Mistaken For Dead

These looked suspicious at first glance, but current code paths still use them.

- `src/template/seed-media-map.json` is active through `src/template/seedLibrary.js`.
- `src/media-map.json`, `src/backdrop-map.json`, and `src/poster-map.json` are active via media/poster helpers.
- `public/episode-index.json`, `public/episode-map.json`, and `public/episode-map/*` are active via `src/utils/episode-map.js`.
- `public/manifest.json`, `public/icons/*`, and `public/apple-touch-icon.png` are active via `index.html` and `public/sw.js`.
- `public/sw.js`, `public/version.json`, and `src/version.js` are tracked release/runtime artifacts, not unused files.

## Documentation Drift

The repo has several references to paths that no longer exist. This is not dead code, but it is maintenance debt and can mislead future cleanup work.

### README drift

- `README.md` says `src/App.js`; actual file is `src/App.jsx`.
- `README.md` references `_archive/PRODUCT.md`, `_archive/SETUP_FIREBASE.md`, and `_archive/SETUP_IMPORT.md`, but `_archive/` is gitignored and those files are absent in this checkout.
- `README.md` references `tools/hearth-poster-tool/`, but there is no `tools/` directory.
- `README.md` references `SPRINTS_NEW_REPO.md`, `docs/BACKEND_MIGRATION_CONTROL_PLANE.md`, `docs/VNEXT_APP_HOSTING_ROADMAP.md`, and `docs/VNEXT_KEEP_ARCHIVE_MATRIX.md`; none of those files exist in the current repo.

### Docs drift

- `docs/TECHNICAL_OVERVIEW.md` still references `src/App.js`.
- `docs/LLM_PROJECT_CONTEXT_HEARTH_V2.md` references `.js` paths for files that are now `.jsx`, including `TonightHeaderMenu`.

## Validation Notes

- `npm run lint` currently fails for an unrelated issue in `src/components/media/LazyMediaImage.jsx`: React wants `fetchPriority`, not `fetchpriority`.
- `npm run test:unit` currently fails in 3 areas:
  - `HeroCarousel.test.jsx`: missing `ResizeObserver` in test environment.
  - `SuggestionSection.test.jsx`: scroll rewind assertion failing.
  - `AddView.integration.test.jsx`: submit callback not called.

These failures do not invalidate the dead-code findings above, but they do mean the repo is not currently in a clean verification state.

## Recommended Cleanup Order

1. Remove the six high-confidence orphaned files.
2. Decide whether the old `src/domain/watchlist.js` algorithm still has product value; if not, remove it with its test.
3. Remove unused dependencies `cors` and possibly `yaml` if no external workflow needs them.
4. Fix README/docs path drift so future audits are cheaper and less error-prone.
5. After cleanup, rerun lint and unit tests to ensure no hidden references were missed.

## Static Reachability Summary

- JS/JSX/MJS/CJS files scanned: 111
- Reachable from current entrypoints: 85
- Unreachable: 26
- Of unreachable files:
  - 18 are test-only files or test setup
  - 8 are non-test candidates requiring review

## Conclusion

The repo does not look broadly bloated, but it does contain a small pocket of clearly orphaned UI/helpers plus some stale documentation and at least one old domain module that now appears test-only. The highest-value cleanup is small and safe if done in a focused pass.
