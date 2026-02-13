# Hearth

Hearth is a calm, shared watchlist for couples that turns choosing what to watch into a small, pleasant ritual.

This is not a streaming platform.
This is not a recommendation engine.
This is a private, intentional space for shared choice.

The goal of Hearth is simple:
**make deciding what to watch together feel easy and good.**

---

## Core Idea

Modern streaming platforms optimize for attention, not satisfaction. Hearth does the opposite.

It presents a finite, human-curated library and offers gentle decision support when couples feel stuck.

Hearth favors:
- Calm over stimulation
- Intention over novelty
- Shared experience over optimization

---

## What It Does

- Shared space onboarding for a couple (private, invite-only by name)
- A finite shelf of saved movies and shows
- A "Tonight" tray that surfaces a few options
- Vibes (comfort, easy, gripping, visual, classic) and energy levels (light, balanced, focused)
- A gentle decision helper that picks from your shelf without explaining an algorithm
- JSON/CSV import with preview and fixes to move existing lists in quickly

---

## Project Structure (Current)

- `src/App.js` - UI shell and routing between views
- `src/views/` - View components (Onboarding, Tonight, Shelf, Add, Decision, Import)
- `src/components/` - UI primitives and cards
- `src/domain/` - Pure domain logic (no React/Firebase)
- `src/services/firebase/` - Firebase client + service wrappers
- `server/` - App Hosting runtime entrypoint and API/static wiring
- `src/app/` - App hooks bridging UI and services
- `src/utils/` + `src/config/` - Shared utilities and constants

---

## Contribution Guidance

This repository is product-led.

Before making changes, read `_archive/PRODUCT.md`.
All decisions should align with the product vision, emotional tone, and non-goals defined there.

If a feature increases engagement but does not reduce decision friction, it does not belong.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Configure Firebase

`npm run setup` generates `public/firebase-config.js` from Firebase env vars when present
(`FIREBASE_*` or `VITE_FIREBASE_*`). If env vars are missing, it falls back to
`public/firebase-config.example.js` in dev.

For Firebase App Hosting production builds, set these build env vars:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

### Run (Dev)

```bash
npm run dev
```

### Build (Prod)

```bash
npm run build
```

---

## Scripts (Common)

- `npm run dev` - start the dev server
- `npm run setup` - generate `public/firebase-config.js` from env vars (or dev example fallback)
- `npm run lint` - ESLint
- `npm run format` - Prettier
- `npm run test` - tests
- `npm run test:api` - backend API route tests (`api/__tests__`)
- `npm run build` - production build to `build/` (Firebase App Hosting)
- `npm run start:apphosting` - start unified frontend + API server for App Hosting runtime

---

## Versioning & Releases

- Version metadata is generated/validated by `scripts/versioning.js` during `prestart` and `prebuild`.
- Manual bump (when needed): `node scripts/versioning.js bump <patch|minor|major>`
- Generate current version artifacts: `node scripts/versioning.js generate`
- Validate committed version artifacts: `node scripts/versioning.js check`

Release orchestration is now intentionally manual:
1. Run checks: `npm run lint && npm run test:api && npm run build`
2. Bump version if needed: `node scripts/versioning.js bump minor`
3. Commit, tag, and push using your normal git flow.

For backend migration work, copy `.env.api.example` values into your local `.env.local` (or Firebase App Hosting secret settings) and set real provider credentials.

---

## Deployment

Primary runtime target is Firebase App Hosting (see `docs/DEPLOYMENT.md`).

Current runtime shape:
- Frontend static build output: `build/`
- API runtime entrypoint: `server/index.js`
- App Hosting config: `apphosting.yaml`
- Poster/backdrop hosting: absolute provider URLs (TMDB by default), not repo-served `/posters` or `/backdrops`

Legacy GitHub Pages runtime artifacts and helper scripts are archived under:
- `_archive/legacy-github-pages/`
- `_archive/legacy-scripts/`

---

## Poster Admin Tool

Hearth uses TMDB posters for visual appeal. The Poster Admin Tool provides a safe, visual way to manage poster updates.

Source lives in `tools/hearth-poster-tool/`.

### Quick Start

```bash
cd tools/hearth-poster-tool/
chmod +x start.sh
./start.sh
```

Then open `index.html` in your browser.

### Full Documentation

See `tools/hearth-poster-tool/README.md` for complete setup, usage, and API documentation.

### Features

- **Visual Overview**: View existing posters in a grid
- **Safe Preview**: Check for new posters without downloading
- **Explicit Confirmation**: Approve changes before saving
- **JSON Support**: Upload Hearth JSON exports
- **TMDB Integration**: Fetch posters from The Movie Database API
- **Caching**: Reuses existing posters to avoid re-downloads

The tool ensures poster management is predictable and safe, preventing accidental overwrites while providing clear visual feedback.

Note: posters/backdrops are no longer served from this repo. Persist absolute URLs in item metadata (TMDB URLs by default).

---

## Additional Docs

- `_archive/SETUP_FIREBASE.md` - Firebase configuration and secrets management
- `_archive/SETUP_IMPORT.md` - Data import schema and guidelines
- `_archive/PRODUCT.md` - Product vision and non-goals
- `_archive/` - legacy plans, sprint notes, and assessment docs
- `SPRINTS.md` - active backend migration sprint plan and task backlog
- `docs/BACKEND_MIGRATION_CONTROL_PLANE.md` - merge/release/rollback policy for migration work
- `docs/VNEXT_APP_HOSTING_ROADMAP.md` - Firebase App Hosting migration path and Gemini-later metadata plan
- `docs/VNEXT_KEEP_ARCHIVE_MATRIX.md` - keep/archive decisions for major vNext transition
- `docs/adrs/0001-repo-split-timing.md` - repo split timing decision for dynamic cutover
