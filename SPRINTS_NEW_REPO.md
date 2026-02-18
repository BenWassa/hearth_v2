# New Repo Sprint Plan (Firebase App Hosting vNext)

## S0 - Repo Bootstrap
Goal: Stand up a clean new repository with the transferred runtime.

Deliverables:
- New GitHub repo initialized
- Bundle files committed on `main`
- CI baseline (`npm run lint`, `npm run test:api`, `npm run build`)

Done when:
- Local dev server runs
- Build/test/lint pass in CI

## S1 - Firebase Foundation
Goal: Provision clean Firebase project and wire runtime.

Deliverables:
- App Hosting backend created
- Firestore and Storage enabled
- Secrets/environment configured
- First successful deploy to staging

Done when:
- App and API are live in staging with healthy checks

## S2 - Data Model + Security Rules
Goal: Lock in title schema and security posture.

Deliverables:
- Firestore collections and indexes defined
- Rules for read/write access and role boundaries
- Validation for required title fields

Done when:
- CRUD works in staging
- Unauthorized writes are blocked

## S3 - Search + Add Title Flow (Core Product)
Goal: Enable live title search and add to library.

Deliverables:
- API endpoints for provider search + details
- UI for search, select, and save title
- Error handling and loading states

Done when:
- New title can be found and saved end-to-end in staging

## S4 - Firebase Storage Media Pipeline
Goal: Move all poster/backdrop assets to Storage-backed flow.

Deliverables:
- Storage path conventions (`posters/`, `backdrops/`)
- Upload and URL persistence logic
- Fallback handling for missing media

Done when:
- Newly added titles resolve poster/backdrop from Storage URLs only

## S5 - Metadata UX (Vibe/Energy Manual)
Goal: Introduce robust manual metadata controls first.

Deliverables:
- Controlled vocab for `vibe` and `energy`
- Edit UI + validation + persistence
- Metadata shown in shelf/decision flows

Done when:
- Metadata can be created/edited reliably with no freeform chaos

## S6 - Ops + Observability
Goal: Make production operation safe and diagnosable.

Deliverables:
- Structured API logs with request IDs
- Error/event dashboards and alert thresholds
- Runbook for deploy/rollback/incident

Done when:
- Simulated failure path is detectable and actionable

## S7 - Gemini Metadata Assistant (Human-in-the-loop)
Goal: Add AI-assisted `vibe`/`energy` suggestions without auto-committing data.

Deliverables:
- Gemini integration endpoint for metadata suggestions
- Prompt/versioning strategy
- Review/accept UI before save
- Audit fields (`aiProvider`, `aiModel`, `confidence`, prompt version)

Done when:
- User can accept/reject AI suggestions per title and all actions are auditable

## S8 - Backfill + Migration Utilities
Goal: Upgrade existing catalog quality at scale.

Deliverables:
- Batch tools for missing `vibe`/`energy`
- Storage URL backfill checks
- Idempotent migration scripts

Done when:
- Legacy records meet new schema thresholds

## S9 - Hardening + Launch
Goal: Prepare for stable production usage.

Deliverables:
- Performance pass (search/add/decision flows)
- Security review and dependency cleanup
- Production launch checklist complete

Done when:
- Launch sign-off criteria met and production cutover complete

## Cross-Sprint Rules
- No local media binaries in repo
- Firebase Storage URLs are the media source of truth
- Any AI metadata write must require explicit user confirmation
- Every sprint ends with demo notes and pass/fail acceptance criteria

## Import + Search Workflow Hardening Sprints

## S10 - Import/Add Metadata Parity (Shows)
Goal: Make imported shows reach the same metadata quality as Add flow.

Deliverables:
- Shared metadata hydrator used by both `AddView` and import flow
- Show enrichment includes `showData.seasonCount` and `showData.seasons` (episodes included)
- Import payload shape stays schema-v2 compatible

Done when:
- Importing a TV show yields seasons/episodes in item details without requiring manual refresh
- Add and import produce equivalent `showData` for the same title/provider

## S11 - Search Match Safety + Dedupe Quality
Goal: Prevent incorrect metadata matches and bad duplicate skips.

Deliverables:
- Confidence threshold for `pickBestSearchResult` before provider binding
- Low-confidence imports remain unmatched instead of auto-linked
- Dedupe key upgraded from title-only to `title + type + year` (or provider identity when available)

Done when:
- Ambiguous search results do not silently bind wrong provider IDs
- Distinct titles sharing the same name can both be imported when type/year differ

## S12 - Import Throughput + Resilience
Goal: Improve speed and reliability for larger imports.

Deliverables:
- Bounded-concurrency enrichment queue for search/details calls
- Per-item failure isolation retained (one failure does not fail full batch)
- UI messaging includes matched/unmatched/duplicate counts after batch completion

Done when:
- Import latency scales better than strict sequential mode on multi-item batches
- Results are deterministic and partial successes still commit cleanly

## S13 - Search Request Hygiene
Goal: Reduce avoidable backend load and stale client work.

Deliverables:
- Abortable live search requests in `useMediaSearch`
- Stable stale-result handling across quick query/type changes
- Optional shared helper for request cancellation/error normalization

Done when:
- Rapid typing does not leave unnecessary in-flight searches
- UI never displays out-of-order stale result sets

## S14 - Test Coverage Lock-In
Goal: Prevent regressions in import/search behavior.

Deliverables:
- Unit tests for confidence-threshold match behavior and fallback-to-unmatched path
- Unit tests for dedupe edge cases (same title, different year/type)
- Integration tests for imported-show season/episode hydration parity with Add flow
- Hook tests for search cancellation and stale response protection

Done when:
- New tests fail on old behavior and pass on intended behavior
- CI covers critical import/search workflow risks identified in review

## Execution Order
1. S10 (parity first so data model behavior is consistent)
2. S11 (safety before speed)
3. S12 (throughput once matching is reliable)
4. S13 (request hygiene)
5. S14 (lock behavior and prevent regressions)

## TV Progress Navigation + Status CTA Cleanup Sprints

## S15 - Show Entry Targeting (Latest Season + Next Unwatched Episode)
Goal: Ensure opening a show always lands on the correct season/episode target for that show, not stale state from a previous show.

Deliverables:
- Add a deterministic selector for initial show landing target using `seasons` + `episodeProgress`
- Reset modal season/episode focus per `item.id` change in `src/components/ItemDetailsModal.js`
- Default behavior:
  - If unwatched episodes exist, open the highest-numbered season that still has unwatched episodes
  - In that season, focus the lowest-numbered unwatched episode (the "next up" episode)
  - If all episodes are watched, open the highest-numbered season and its highest-numbered episode
- Remove fallback behavior that keeps a season number only because it existed in the previous show

Done when:
- Opening Tulsa King after watching S2E8 lands on Season 2 with Episode 9 marked next up
- Switching between two different shows never preserves prior show season state
- Fully watched shows open on the latest season/latest episode without errors

## S16 - Remove TV-Level "Mark Watched" Action
Goal: Remove unreliable show-wide status toggles and keep watch tracking episode-driven for TV shows.

Deliverables:
- Hide/remove TV "Mark Watched"/"Back to Shelf" action from `src/components/ItemDetailsModal/components/ActionBar.js`
- Keep movie status toggle unchanged
- Keep episode-level toggle behavior in show season tracker unchanged
- Confirm no show UI path still calls `onToggleStatus` as a primary watch-progress action

Done when:
- Show details modal does not display the bottom status toggle
- Movie details modal still displays the status toggle
- Show watch state transitions only via episode progress updates

## S17 - Regression Test Lock-In + Manual QA Matrix
Goal: Prevent reintroduction of stale season targeting and invalid TV status controls.

Deliverables:
- Add unit tests for landing-target selector logic (partial season watched, cross-show switch, fully watched show)
- Add component-level tests for show vs movie ActionBar rendering rules
- Add manual QA checklist for:
  - Partial progress show resume
  - Cross-show switching
  - Fully watched show open state
  - No TV "Mark Watched" action present

Done when:
- New tests fail against current behavior and pass after fixes
- QA checklist passes on desktop and mobile modal flows

## S18 - Release Hardening + Data Safety Checks
Goal: Ship safely without breaking existing user episode progress.

Deliverables:
- Verify no write-schema changes required (`episodeProgress` remains source of truth)
- Validate no regressions in `handleUpdateItem` auto-status sync in `src/app/useAppState.js`
- Add release notes for changed show behavior and removed TV status button

Done when:
- Existing watchlists load with no data migration
- Production smoke test passes for add/open/update flows on shows and movies

## Execution Order
1. S15 (fix incorrect show landing behavior first)
2. S16 (remove conflicting TV-level status action)
3. S17 (lock behavior with tests + QA)
4. S18 (ship readiness and smoke checks)
