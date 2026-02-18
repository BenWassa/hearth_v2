# Release Notes

## 2026-02-18 - TV Progress Navigation + Status CTA Cleanup

### Changed
- Show details now initialize to the correct per-show entry target:
  - highest season with unwatched episodes
  - first unwatched episode in that season
- Removed show-level bottom action bar status toggle (`Mark Watched`/`Back to Shelf`) from the details modal.
- Movie details action bar status toggle remains unchanged.

### Data / Migration
- No Firestore schema migration required.
- `episodeProgress` remains the source of truth for show watch progress.
- Existing `handleUpdateItem` write flow remains unchanged.

### Validation
- Added regression tests for show entry targeting and show-vs-movie action bar rendering.
- Added manual QA checklist in `docs/TV_PROGRESS_QA_CHECKLIST.md`.
