# Backend Migration Control Plane

This document governs delivery for the live metadata/backend migration program.

## Working Branch

- Branch name: `backend-live-metadata-foundation`
- All sprint work for backend migration lands here first.

## Merge Policy

- Only squash merges into `backend-live-metadata-foundation`.
- PRs must be vertical slices (small, testable, rollback-safe).
- Do not mix unrelated UI work into migration PRs.

## Release Gating

- Required checks for migration PRs:
  - lint
  - tests relevant to touched paths
  - build
- If API contracts are changed, include contract test updates in same PR.
- If Firestore schema/rules are changed, include rollout notes in PR description.

## Rollback Policy

- Every sprint release point must have a known-good commit SHA.
- Do not delete the previous deploy target before validating the new one.
- Rollback trigger conditions:
  - persistent 5xx from API routes
  - add flow regression (cannot save items)
  - Firestore rules reject expected writes

## File Churn Guard (During Migration)

Avoid unrelated edits in these files while migration is active:

- `src/views/AddView.js`
- `src/app/useAppState.js`
- `src/services/firebase/*.js`

If a non-migration change is required in these files, isolate it in a dedicated PR.

## Backlog Label Set

Use these labels for migration tickets:

- `api`
- `frontend`
- `schema`
- `rules`
- `infra`
- `qa`
- `migration`
- `cutover`

## Sprint Commit Rule

- Commit at least once at the end of each completed sprint.
- Commit message format recommendation:
  - `Sprint N: <outcome>`
