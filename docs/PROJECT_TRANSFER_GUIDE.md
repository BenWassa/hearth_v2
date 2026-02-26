# Hearth vNext New Repo Transfer Guide

## Purpose
This bundle is the minimal clean starting point for a new Firebase App Hosting project.
It keeps the current vNext runtime and product logic, while excluding legacy GitHub Pages/archive clutter.

Source snapshot:
- Branch: see `.source-branch.txt`
- Commit: see `.source-commit.txt`

## What Is Included
Core runtime:
- `src/` React app and domain logic
- `api/` backend API routes and tests
- `server/` Node runtime entrypoint for Firebase App Hosting
- `public/` app shell/assets (without local `firebase-config.js`)
- `scripts/` active setup/versioning/git-hook scripts only

Core project config:
- `package.json`, `package-lock.json`
- `apphosting.yaml`, `firebase.json`
- `firestore.rules`, `firestore.indexes.json`
- `.env.api.example`
- lint/format/build configs (`.eslintrc.json`, `postcss.config.js`, `tailwind.config.js`, etc.)

Current vNext docs:
- `docs/DEPLOYMENT.md`
- `docs/BACKEND_MIGRATION_CONTROL_PLANE.md`
- `docs/VNEXT_APP_HOSTING_ROADMAP.md`
- `docs/VNEXT_KEEP_ARCHIVE_MATRIX.md`
- `docs/adrs/0001-repo-split-timing.md`

Optional legacy knowledge:
- `_optional_legacy_knowledge/tools/hearth-poster-tool/`
- `_optional_legacy_knowledge/run_fetch_posters.sh`

## What Is Excluded On Purpose
- `_archive/` and prior migration debris
- `build/`, `node_modules/`, local dev caches
- local secrets (`.env.local`)
- local generated Firebase client config (`public/firebase-config.js`)
- repo-served poster/backdrop binaries (media now resolves via absolute provider URLs)

## Immediate Setup In New Repo
1. Create a new GitHub repo and copy this bundle contents to repo root.
2. Create a new Firebase project.
3. Enable:
   - Firebase App Hosting
   - Firestore
   - Firebase Storage
4. Configure App Hosting runtime and environment secrets.
5. Copy `.env.api.example` values into local `.env.local` for local dev.
6. Create `public/firebase-config.js` from `public/firebase-config.example.js` with your new Firebase values.
7. Install and run:
   - `npm install`
   - `npm run setup`
   - `npm run dev`
8. Verify:
   - `npm run lint`
   - `npm run test:api`
   - `npm run build`

## Runtime/Data Direction (Authoritative)
- Posters/backdrops default to TMDB absolute URLs (no required Firebase Storage mirroring).
- Catalog metadata stores absolute image URLs.
- App uses API-backed title search/add workflows (not local file-copy workflows).
- Google Auth is required for all users.
- Spaces are multi-membership: a user can belong to multiple spaces.
- Watchlist state is per-space (shared by members), while catalog is singular.

Target Firestore shape:
- `artifacts/{appId}/media_catalog/{mediaId}`: global movie/show metadata
- `artifacts/{appId}/spaces/{spaceId}`: space metadata + membership
- `artifacts/{appId}/spaces/{spaceId}/watchlist_items/{mediaId}`: per-space selection/state

Suggested baseline metadata fields per title:
- `title`, `year`, `type`, `genres[]`
- `posterUrl`, `backdropUrl`
- `source` (`manual` | `ai_assisted`)
- `createdAt`, `updatedAt`

## AI-Assisted Metadata (Later Phase)
Planned path:
- Manual title selection stays primary
- Gemini generates candidate `vibe` and `energy`
- Human confirms before write
- Keep audit fields (`aiProvider`, `aiModel`, `aiPromptVersion`, `confidence`)

This keeps the ingestion trustworthy while reducing manual tagging work.
