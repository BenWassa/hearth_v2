# Hearth v2 Firebase Setup Checklist

This checklist is tailored to this repository's current architecture.

## Project Reference
- Project name: `hearthv2`
- Project ID: `hearthv2`
- Project number: `1064503366600`

## Audit Status (as of February 13, 2026)

Completed in repo/local validation:
- [x] Core config files present: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `apphosting.yaml`, `apphosting.production.yaml`
- [x] Client config pattern present and configured: `public/firebase-config.js` + `window.__firebase_config`
- [x] `.firebaserc` default project alias set (`hearthv2`)
- [x] Auth integration wired (`src/views/OnboardingView.js`, `src/services/firebase/auth.js`, `src/app/useAppState.js`)
- [x] Space-scoped Firestore rule model implemented (`artifacts/{appId}/spaces/{spaceId}`)
- [x] Local verification commands passed:
  - [x] `npm run lint:ci`
  - [x] `npm run test:api`
  - [x] `npm run build`

Still required (manual/remote steps):
- [ ] Confirm Firebase Console project settings (Auth Google provider, Firestore, App Hosting)
- [ ] Confirm authorized domains for all environments
- [ ] Deploy Firestore rules/indexes to target project
- [ ] Configure App Hosting runtime env/secrets in Firebase Console (especially `MEDIA_PROVIDER_API_KEY` or `MEDIA_PROVIDER_READ_TOKEN`)
- [ ] Trigger App Hosting deployment and run production smoke tests
- [ ] Verify end-to-end auth + space creation/join + watchlist writes against deployed backend

Notes:
- `npm run build` updated version artifacts: `public/version.json`, `src/version.js`.
- Firebase Storage/CORS setup remains not required for current code because Storage APIs are not used.

## 1. Firebase Project Setup
- [ ] Create or select your Firebase project in Firebase Console.
- [ ] Enable Authentication and Google provider.
- [ ] Enable Firestore Database.
- [ ] Enable Firebase App Hosting.
- [ ] Add authorized domains for local/dev/prod auth flows.

Current repo references:
- Firebase project alias: `.firebaserc` (`default: hearthv2`)
- Firebase config file: `firebase.json`

## 2. Client Firebase Config (Required for Frontend)
This repo does not use `VITE_FIREBASE_*` variables for client initialization.
It loads config from `public/firebase-config.js` via `window.__firebase_config`.

- [ ] Create `public/firebase-config.js` from `public/firebase-config.example.js`.
- [ ] Fill:
  - [ ] `apiKey`
  - [ ] `authDomain`
  - [ ] `projectId`
  - [ ] `storageBucket`
  - [ ] `messagingSenderId`
  - [ ] `appId`
- [ ] Set `window.__app_id` to your app scope (example: `hearth-default`).
- [ ] Ensure `public/firebase-config.js` stays uncommitted (already in `.gitignore`).

Command:
```bash
npm run setup
```

## 3. Firestore Rules and Indexes
- [ ] Confirm `firestore.rules` matches expected space-based model:
  - `artifacts/{appId}/spaces/{spaceId}`
  - `artifacts/{appId}/spaces/{spaceId}/watchlist_items/{itemId}`
  - `artifacts/{appId}/media_catalog/{mediaId}`
- [ ] Deploy rules and indexes:

```bash
firebase deploy --project <PROJECT_ID> --only firestore:rules,firestore:indexes
```

## 4. App Hosting Config and Runtime
- [x] Confirm `apphosting.yaml` exists and references:
  - `buildCommand: npm run build`
  - `runCommand: npm run start:apphosting`
- [x] Environment-specific config available at `apphosting.production.yaml`.
- [x] Confirm runtime entrypoint exists: `server/index.js`

## 5. App Hosting Environment and Secrets
Set these in Firebase App Hosting (runtime/build environment as needed):

- [ ] `MEDIA_PROVIDER_API_KEY` or `MEDIA_PROVIDER_READ_TOKEN`
- [ ] `API_TIMEOUT_MS`
- [ ] `API_RATE_LIMIT_WINDOW_MS`
- [ ] `API_RATE_LIMIT_MAX`
- [ ] `APP_ID`

Recommended production source of truth:
- `apphosting.production.yaml`
- Keep `APP_ID` aligned with `window.__app_id` in `public/firebase-config.js` (currently `hearth-default`)

Optional local backend config template:
- `.env.api.example`

## 6. Firebase Admin (Server)
- [ ] Provide service account credentials for backend/admin access:
  - `FIREBASE_SERVICE_ACCOUNT_PATH=./<service-account-file>.json`
  - or `GOOGLE_APPLICATION_CREDENTIALS`
- [ ] Keep service account JSON untracked (covered by `.gitignore` patterns).

## 7. Frontend Auth Integration Check
- [ ] Google sign-in button appears in onboarding (`src/views/OnboardingView.js`).
- [ ] Auth flow succeeds (`src/services/firebase/auth.js`).
- [ ] Auth state drives app bootstrapping (`src/app/useAppState.js`).

## 8. Data Model Sanity Check
This repo is space-scoped (not pair-scoped):
- [ ] Space document created at `artifacts/{appId}/spaces/{spaceId}`
- [ ] `members` includes signed-in user uid
- [ ] Watchlist writes succeed at `.../watchlist_items/{itemId}`
- [ ] Catalog writes succeed at `artifacts/{appId}/media_catalog/{mediaId}`

## 9. Build and Local Verification
- [ ] Install dependencies:

```bash
npm install
```

- [ ] Start frontend dev:

```bash
npm run dev
```

- [ ] Start App Hosting-compatible runtime locally:

```bash
npm run start:apphosting
```

- [ ] Build succeeds:

```bash
npm run build
```

## 10. Deploy and Smoke Tests
- [ ] Deploy Firestore rules/indexes (Section 3).
- [ ] Trigger Firebase App Hosting deploy.
- [ ] Verify:
  - [ ] Auth sign-in works
  - [ ] Space creation/join works
  - [ ] Shelf/watchlist reads and writes work
  - [ ] API health endpoint responds: `GET /api/health`
  - [ ] Media search endpoint responds: `GET /api/search?q=test&type=movie&page=1`

## Not Required Right Now (for this repo state)
- `storage.rules` deployment: currently not used by app code.
- Storage bucket CORS setup: currently not required because uploads via Firebase Storage are not implemented in current code.
- `scripts/sync-apphosting-secrets.sh`: not present in this repo.
