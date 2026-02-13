# Firebase App Hosting Deployment Runbook

## Scope
Runbook for Hearth runtime deployment on Firebase App Hosting with live `/api/*` backend routes.

## Preconditions
- Branch: `backend-live-metadata-foundation` (or approved release branch).
- CI green for lint, API tests, and build.
- Required secrets configured in Firebase App Hosting:
  - `MEDIA_PROVIDER_API_KEY` or `MEDIA_PROVIDER_READ_TOKEN`
  - `API_TIMEOUT_MS`
  - `API_RATE_LIMIT_WINDOW_MS`
  - `API_RATE_LIMIT_MAX`
  - `APP_ID`
- Firestore rules and indexes deployed for v2 schema compatibility.

## Pre-Deploy Checklist
1. Confirm base-path assumptions are removed (`/hearthMVP` should not be required).
2. Confirm service worker bypasses `/api/*` and `version.json` cache behavior is safe.
3. Smoke test endpoints locally or in preview:
   - `GET /api/health`
   - `GET /api/search?q=severance&type=show&page=1`
   - `GET /api/media/tmdb/95396?type=show`
4. Validate add flow in preview:
   - search -> select -> enrich -> save
   - manual fallback still saves

## Deploy Steps
1. Merge approved release commit to deploy branch.
2. Trigger Firebase App Hosting deploy for preview.
3. Run smoke checks against preview URL.
4. Promote to production.
5. Verify production smoke checks and primary user journey.

## Post-Deploy Validation
- App loads at root path (`/`).
- Search latency and error rate within expected bounds.
- Add flow writes v2 records successfully.
- Metadata refresh action works on existing provider-backed items.
- No stale UI caused by service worker cache.

## Rollback Plan
Trigger rollback if any of these occur:
- Persistent 5xx from API routes.
- Add flow cannot save items.
- Firestore rules reject expected writes.

Rollback steps:
1. Re-deploy last known good release in Firebase App Hosting.
2. Confirm `GET /api/health` and add flow behavior.
3. Keep current release disabled while root cause is investigated.
4. Document incident with request IDs and failing route details.

## Observability Minimum
Track at minimum:
- API availability
- p95 latency for `/api/search` and `/api/media/*`
- 4xx/5xx rates by route
- Rate limit rejections
- Metadata refresh failures

## Cutover Sign-Off
Production cutover is complete when:
- Pre-deploy and post-deploy checklists are fully green.
- Rollback path validated in a controlled test.
- On-call owner confirms monitoring and alert routing.
