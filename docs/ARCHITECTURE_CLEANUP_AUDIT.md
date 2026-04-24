# Architecture Cleanup Audit

Date: 2026-04-24
Branch: `architecture-cleanup-audit`

## Executive summary

The app is not broken because it was AI-assisted, but it does show the normal symptoms of fast iterative development:

- A few files own too many responsibilities.
- Some duplicate logic exists between live/Firebase mode and template/demo mode.
- A few old UI helpers were left behind after later UI changes.
- Tests existed, but the baseline had drifted and was failing before this cleanup branch.

The next cleanup work should be incremental. Avoid a broad folder rewrite until the state layer and data contracts are clearer, because most risk sits in data shape compatibility, Firebase writes, import normalization, and TV episode progress.

## Completed in this branch

- Added `.gitignore` rules for local agent/workflow artifacts on `main`.
- Created `architecture-cleanup-audit` for follow-up cleanup work.
- Restored the test baseline.
- Fixed `src/domain/watchlist.js` so `pickAndRemove` calls the RNG once per pick.
- Removed unimported files:
  - `src/views/components/tonight/EnergyPickModal.jsx`
  - `src/views/components/tonight/VibePickModal.jsx`
  - `src/views/components/tonight/PickForUsCard.jsx`
  - `src/components/ItemDetailsModal/hooks/useItemData.js`
  - `src/components/ItemDetailsModal/hooks/useModalEffects.js`
  - `src/lib/utils.js`

## Verified findings

### 1. State layer is the main cleanup target

`src/app/useAppState.js` is roughly 2,000 lines and owns Firebase setup, auth, spaces, import, export, metadata repair, item updates, bulk deletion, view persistence, and decision flow.

This is the highest-value refactor, but also the riskiest. Split it by behavior, not by arbitrary file size:

- `useFirebaseSession`: Firebase init, auth, user, bootstrapping.
- `useSpaces`: create/join/switch/load spaces.
- `useWatchlistItems`: item load, add, update, delete, mark watched.
- `useMetadataRepair`: audit, refresh, repair missing metadata.
- `useDecisionFlow`: random pick state and context.
- Keep `useAppState` as the compatibility facade until the app is stable.

### 2. Template mode duplicates live-mode concepts

`src/template/useTemplateAppState.js` repeats metadata gap detection, primary credit extraction, item updates, and state actions from `useAppState`.

Do not delete template mode if it is useful for demos. Instead, extract pure shared helpers first:

- metadata gap detection
- media credit selection
- item update mapping
- show watch progress helpers

Then both live mode and template mode can use the same tested functions.

### 3. Large view files should be split after state helpers stabilize

These are large enough to make future UI changes harder:

- `src/views/ImportModal.jsx`
- `src/components/ItemDetailsModal.jsx`
- `src/views/ShelfView.jsx`
- `src/views/TonightView.jsx`

Priority order:

1. `ItemDetailsModal`: extract episode hydration and season-progress state into hooks.
2. `ImportModal`: separate parsing/review/row-edit UI from import workflow state.
3. `ShelfView`: extract grouping/sorting and bulk-selection behavior.
4. `TonightView`: keep as the composition screen, but move rail/hero data selection into helpers.

### 4. The graph's `toString()` question is probably noise

The graph identified `toString()` as a connector. That is not an architecture concept; it is a generic utility pattern that appears in many modules. Treat that suggested question as low signal.

Better questions to pursue:

- Where do media item shapes change between API, Firebase, template mode, and UI?
- Which helpers are duplicated between `useAppState` and `useTemplateAppState`?
- Which view files own state that should live in hooks?
- Which Firebase write paths still support legacy and v2 shapes, and can they be documented with tests?

## Recommended cleanup sequence

### Phase 1: Hygiene and baseline

- Keep tests green.
- Remove unimported files only after `rg` confirms no references.
- Add or update tests around any helper extracted from large files.
- Keep commits small and named by behavior.

### Phase 2: Shared domain helpers

Extract duplicated pure functions into `src/domain/media/` or `src/domain/watchlist/`:

- metadata gap detection
- primary credit selection
- show-progress calculations
- item update normalization
- import dedupe/identity helpers where useful

This phase is low risk because pure functions are easy to test.

### Phase 3: State hook split

Split `useAppState` behind the existing return contract. The UI should not change during this phase.

The goal is not a perfect architecture. The goal is to reduce the number of reasons one file changes.

### Phase 4: View decomposition

After state is cleaner, split the large UI files into focused components/hooks. This should be done one screen at a time with visual/manual checks.

### Phase 5: Data contract documentation

Create a short `docs/DATA_SHAPES.md` covering:

- canonical media item shape
- Firebase watchlist item shape
- template item shape
- import payload shape
- legacy fields still supported

This will make future AI-assisted changes safer because the expected data model is explicit.

## What not to do yet

- Do not rename every folder at once.
- Do not remove legacy payload support without tests and a migration decision.
- Do not merge template mode and live mode in one large change.
- Do not trust graph-inferred relationships unless the source code confirms them.
