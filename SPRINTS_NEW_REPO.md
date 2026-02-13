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
