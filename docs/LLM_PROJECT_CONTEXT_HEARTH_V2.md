# Hearth LLM Project Context

Use this as `LLM_CONTEXT.md` when handing Hearth to another LLM.

## 1) Project Snapshot
- Project name: Hearth
- One-line description: Shared watchlist app for couples, with calm decision support and a demo mode for portfolio/testing.
- Current status: `active`
- Primary owner: Benjamin Haddon
- Last updated (YYYY-MM-DD): 2026-02-18

## 2) Purpose and Scope
- Problem this project solves: Decision fatigue when couples choose what to watch together.
- Target users: Couples and small shared households.
- Core outcomes / success criteria:
  - Users can add titles quickly via TMDB-backed search.
  - The shared shelf remains reliable with complete, up-to-date metadata.
  - The Tonight flow makes choosing easy without algorithm-heavy UX.
  - Demo mode is accessible via URL and resets safely on refresh.
- In scope:
  - Shared space onboarding and collaborative watchlist.
  - TMDB-backed metadata, search, and media details.
  - TV show progress tracking at the episode level.
  - Demo mode (`?mode=demo`) for portfolio and feature exploration.
- Out of scope:
  - Streaming playback.
  - Social feed or community features.
  - Algorithmic recommendation ranking.

## 3) Links (Use Full URLs)
- Production app: https://hearthv2--hearthv2.us-east4.hosted.app/
- Portfolio demo URL: https://hearthv2--hearthv2.us-east4.hosted.app/?mode=demo
- Staging app: N/A (use App Hosting preview deploys/branches)
- Repository: https://github.com/BenWassa/hearth_v2
- Main branch: https://github.com/BenWassa/hearth_v2/tree/main
- Active working branch: https://github.com/BenWassa/hearth_v2/tree/main
- Docs:
  - https://github.com/BenWassa/hearth_v2/blob/main/README.md
  - https://github.com/BenWassa/hearth_v2/blob/main/docs/TECHNICAL_OVERVIEW.md
  - https://github.com/BenWassa/hearth_v2/blob/main/docs/DEPLOYMENT.md
- Design files: N/A
- Issue tracker / board: https://github.com/BenWassa/hearth_v2/issues

## 4) Tech Stack
### Frontend
- Framework: React 18 + Vite 5
- Language: JavaScript (ES modules, JSX — no TypeScript)
- Styling: Tailwind CSS v3 + component-level CSS
- UI utilities: `lucide-react` (icons), `clsx` + `tailwind-merge` (class composition)
- 3D / visual effects: Three.js (used for ambient background effects)
- State management: React hooks (`useAppState`, `useTemplateAppState`) + Firestore real-time subscriptions

### API Layer
- Style: REST (`/api/*`)
- Location: `api/` — handler files structured for Firebase App Hosting's file-based routing
- Runtime wiring: `server/app.js` mounts these handlers via Express for local dev and App Hosting runtime
- Key responsibilities: TMDB proxy, payload normalisation, rate limiting, metadata refresh
- See Section 9 for full endpoint list

### Backend / Runtime
- Runtime: Node.js 18+
- Server: Express (`server/index.js`, `server/app.js`) — used both locally and as the App Hosting runtime entrypoint
- Auth: Firebase Auth — Google sign-in for the main app, Anonymous auth for demo mode

### Data
- Primary database: Cloud Firestore
- Caching:
  - Service worker + browser cache for static assets
  - In-process rate limiting in the API layer
  - `localStorage` for select UI state
- Image storage: No self-hosted images — all posters, backdrops, and logos use absolute TMDB CDN URLs stored in metadata

### Tooling
- Package manager: npm
- Build tool: Vite 5
- Test frameworks: `node --test` (built-in Node test runner) for API tests; React Scripts / Jest for frontend tests
- Lint / format: ESLint + Prettier
- Git hooks: `simple-git-hooks` (lockfile check on pre-push)
- CI/CD: Firebase App Hosting automated deploy flow + manual release process

## 5) Architecture Overview
- High-level architecture:
  - Single repo containing a React frontend, a Node.js API layer, and Firestore for persistence.
  - The frontend calls `/api/*` for search, media details, and metadata refresh, then writes normalised watchlist payloads directly to Firestore.
  - The API layer proxies TMDB and normalises responses through a mapper pipeline before returning them to the client.
  - The app runs in two modes: the main app (Firebase-backed, real users) and demo mode (seeded, anonymous auth, resettable on refresh).
- Key folders and purpose:
  - `src/`: React app — UI components, hooks, domain logic, and Firebase/media service clients
  - `src/app/`: top-level orchestration hooks (`useAppState`, `useConfiguredAppState`)
  - `src/template/`: demo mode — seed data, seeded state flow, and pre-built media map
  - `src/domain/`: pure logic — schema, data adapters, status normalisation, and watchlist importer
  - `api/`: REST handler files and shared API utilities (`_lib/`)
  - `server/`: runtime entrypoint — mounts API handlers via Express and serves the built frontend
  - `scripts/`: versioning, Firebase config setup, and template media map generation
  - `docs/`: technical overview, deployment guide, roadmap, and ADRs
- Entry points:
  - Frontend: `src/index.js` → `src/App.js`
  - API / server: `server/index.js` (routes registered in `server/app.js`)
- Key modules:
  - `src/app/useAppState.js`: auth, space membership, watchlist CRUD, metadata repair, and decision flow
  - `src/app/useConfiguredAppState.js`: selects real vs demo app state based on URL params (`?mode=demo`, `?demo=1`)
  - `src/template/useTemplateAppState.js`: demo mode seeded state + anonymous auth integration
  - `src/domain/media/schema.js`: generates canonical v2 watchlist payloads
  - `src/services/firebase/watchlist.js`: Firestore reads/writes and catalog + watchlist merge logic
  - `api/_lib/providerClient.js`: TMDB HTTP client with auth, retry, and rate-limit error handling
  - `api/_lib/mappers/*.js`: response normalisation for search results, media details, seasons, and episodes

## 6) Local Development
- Prerequisites:
  - Node.js 18+
  - npm
  - Firebase and TMDB credentials for full online behaviour (see Section 7)
- Install:
  - `npm ci`
- Run:
  - `npm run dev` — starts Vite dev server on port `5174`; `/api` requests are proxied to the API server on port `8080`
  - Demo mode locally: `VITE_HEARTH_MODE=template npm run dev`
  - App Hosting-style local runtime (serves built frontend + API from one process): `npm run start:apphosting`
- Build:
  - `npm run build`
- Test:
  - API unit tests: `npm run test:api`
  - Frontend tests: `npm test`

## 7) Environment and Secrets
- Required env vars:
  - `FIREBASE_API_KEY`: Firebase web config, required for hosted build auth
  - `FIREBASE_AUTH_DOMAIN`: Firebase web config
  - `FIREBASE_PROJECT_ID`: Firebase web config
  - `FIREBASE_STORAGE_BUCKET`: Firebase web config
  - `FIREBASE_MESSAGING_SENDER_ID`: Firebase web config
  - `FIREBASE_APP_ID`: Firebase web config
  - `APP_ID`: Firestore artifacts namespace (default: `hearth-default`)
  - `MEDIA_PROVIDER_READ_TOKEN` or `MEDIA_PROVIDER_API_KEY`: TMDB credentials for backend API
  - `API_TIMEOUT_MS`: upstream request timeout (default `7000`)
  - `API_RATE_LIMIT_WINDOW_MS` + `API_RATE_LIMIT_MAX` or token-bucket vars: backend rate limiting
  - `PORT`: server port for apphosting runtime (default `8080`)
  - `FIREBASE_SERVICE_ACCOUNT_PATH` or `GOOGLE_APPLICATION_CREDENTIALS`: Firebase Admin credentials path
  - `VITE_HEARTH_MODE`: optional frontend mode override (`template`)
- Secret management approach:
  - Firebase App Hosting runtime env/secrets
  - Local `.env.local`/`.env.api` for dev
- Safe local defaults:
  - `scripts/setupFirebaseConfig.js` creates `public/firebase-config.js` from example in dev when env vars are missing

## 8) External Dependencies
- Third-party APIs/services:
  - TMDB:
    - Why used: media search, canonical metadata, posters/backdrops/logos, season/episode data
    - Constraints: rate limits can trigger 429 during bulk metadata operations
  - Firebase Auth + Firestore:
    - Why used: auth, shared space data, watchlist persistence
    - Constraints: security rules enforce member/trusted-user constraints; demo-mode anonymous access is restricted to demo scope
- Vendor SDKs with pinned versions:
  - `firebase@^10.7.1`
  - `firebase-admin@^13.6.1`
  - `react@^18.2.0`
  - `react-dom@^18.2.0`
  - `vite@^5.4.11`
  - `express@^4.18.2`

## 9) Data Contracts
- Main domain entities:
  - Space document: `artifacts/{appId}/spaces/{spaceId}`
  - Watchlist item: `artifacts/{appId}/spaces/{spaceId}/watchlist_items/{itemId}`
  - Media catalog item: `artifacts/{appId}/media_catalog/{mediaId}`
  - Core v2 payload blocks: `source`, `media`, `showData`, `userState`
- API endpoints/events used most:
  - `GET /api/health`
  - `GET /api/search?q={query}&type={movie|show|all}&page={n}`
  - `GET /api/media/{provider}/{id}?type={movie|show}`
  - `GET /api/media/{provider}/{id}/seasons`
  - `GET /api/media/{provider}/{id}/season/{seasonNumber}`
  - `POST /api/media/refresh`
- Validation rules:
  - Firestore rules validate auth/membership and restrict create/update patterns.
  - Watchlist status constrained to `unwatched | watching | watched`.
  - Catalog and watchlist shapes validated before writes.
- Migration notes (if any):
  - Schema v2 is current; adapters preserve compatibility for older/flattened records.

## 10) Product and UX Notes
- Main user flows:
  - Onboarding/sign-in -> create/join space.
  - Add title via search, enrich metadata, save to shelf.
  - Tonight rails + decision helper.
  - Show details with episode progress and auto status transitions.
  - Demo route (`?mode=demo`) for portfolio-safe hands-on usage.
- Critical screens/components:
  - `src/views/TonightView.js`
  - `src/views/AddView.js`
  - `src/views/ShelfView.js`
  - `src/components/ItemDetailsModal.js`
  - `src/views/components/tonight/TonightHeaderMenu.js`
- Accessibility requirements:
  - Keyboard and pointer support for primary actions.
  - Preserve readable contrast and clear interaction states.
  - Avoid regressions in modal focus/navigation patterns.
- Performance requirements:
  - Keep startup responsive.
  - Avoid expensive metadata fan-out calls at boot in demo mode (use hardcoded seed map).
  - Respect API rate limits and retry/backoff behavior.

## 11) Quality and Testing
- Test strategy:
  - API handler unit tests in `api/__tests__/` — covers search, media, seasons, episode, rate limiting, and health endpoints.
  - Focused component and utility tests in `src/` (e.g. importer logic, Tonight tray).
  - Lint, format check, and production build are required gates before release.
- Current coverage gaps:
  - End-to-end user flow testing (sign-in → add → watch flow) is not yet in place.
  - Some UI behavior relies on manual QA.
- High-risk areas:
  - Auth mode split (anonymous demo vs Google regular).
  - Firestore rules changes.
  - Metadata hydration/repair and TMDB rate-limited paths.
  - Show episode progress normalization.
- How to verify a change manually:
  - Regular app: sign in with Google, create/join space, add/search/save item, open details, toggle status.
  - Demo mode: open `?mode=demo`, verify seeded content, edit/delete/add, refresh resets state.
  - API health: `GET /api/health` and one search/details call.

## 12) Current Priorities
- Active tasks:
  1. Keep portfolio demo mode stable at `?mode=demo` with anonymous access scoped correctly.
  2. Maintain metadata integrity for seeded/demo titles without startup API floods.
  3. Prepare clean repo split path for template/demo variant when needed.
- Known bugs:
  - Bulk metadata operations can still hit TMDB rate limits; pipeline now has retries/resume but remains network-dependent.
- Blockers:
  - None currently hard-blocking; external API limits are the main operational constraint.

## 13) Constraints for the LLM
- Do not change:
  - v2 data contract shape (`source`, `media`, `showData`, `userState`) unless explicitly requested.
  - Demo-mode URL contract (`?mode=demo` / `?demo=1`) without migration plan.
  - Firestore auth model intent: regular mode Google-only; anonymous restricted to demo scope.
- Preferred patterns/conventions:
  - Use existing domain/service layers (`src/domain`, `src/services`) rather than duplicating logic in views.
  - Keep API normalization in `api/_lib/mappers`.
  - Prefer minimal targeted edits over broad rewrites.
- Code style rules:
  - ESLint + Prettier enforced.
  - Keep JS modules consistent with existing style.
- Definition of done for PRs:
  - Relevant lint/tests/build pass.
  - Manual smoke path validated for touched user flow.
  - No schema/rules regressions for existing data.

## 14) Suggested Prompt for Another LLM
```text
You are helping on Hearth, a React + Firebase watchlist app.

Goals:
1) Preserve existing architecture and data contracts.
2) Make the smallest safe change that satisfies the task.
3) Run relevant checks and call out risks.

Project constraints:
- Keep watchlist schema v2 shape intact (source/media/showData/userState).
- Regular app mode is Google-auth; demo route (?mode=demo) uses restricted anonymous behavior.
- Add flow should save API-selected metadata (official title/year/runtime), not manual overrides.
- Avoid startup metadata fan-out in demo mode; use hardcoded seed map.

Required checks:
- Run ESLint for touched JS/JSX files.
- Run build if change affects runtime behavior.
- Summarize manual verification steps.

Task:
[Describe the specific task]
```

## 15) Optional: Portfolio Metadata
- Public tagline: "A calm shared watchlist for couples."
- Demo-ready features:
  - Seeded shelf with complete posters/backdrops/logos and show seasons/episodes
  - Add/search/save flow with official API metadata
  - Tonight rails + decision helper
  - Reset-on-refresh behavior for safe exploration
- Screenshot/GIF links:
  - https://hearthv2--hearthv2.us-east4.hosted.app/?mode=demo
- Resume bullet:
  - Built and shipped Hearth, a React/Firebase watchlist app with TMDB metadata pipeline, dual auth modes (Google + scoped anonymous demo), and production deployment on Firebase App Hosting.
