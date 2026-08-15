# Hearth Technical Overview

## 1. System Architecture

Hearth is a single repository with:

- Frontend: React + Vite (`src/`)
- API routes: Node handlers for App Hosting (`api/`)
- Runtime entrypoint: Express-style app hosting server (`server/index.js`)
- Persistence: Firebase Auth + Firestore

At runtime, the UI calls `/api/*` for search/details/refresh and stores normalized watchlist data in Firestore.

## 2. Frontend Structure

- `src/App.js`: top-level view switching and app shell
- `src/app/useAppState.js`: orchestration layer for auth, watchlist CRUD, metadata refresh/repair, decisions
- `src/views/`: product surfaces (`TonightView`, `ShelfView`, `AddView`, `DecisionView`, `ImportModal`)
- `src/components/`: reusable UI + modal/card components
- `src/domain/`: data/schema/adapters/import logic (pure logic)
- `src/services/`: Firebase and media API clients

## 3. Backend/API Structure

- `api/search.js`: TMDB search proxy + normalization
- `api/media/[provider]/[id].js`: media details endpoint
- `api/media/refresh.js`: metadata refresh + season/episode hydration
- `api/media/[provider]/[id]/seasons.js`: season summaries
- `api/media/[provider]/[id]/season/[seasonNumber].js`: episode list for season
- `api/_lib/providerClient.js`: TMDB request logic (auth, retry/error mapping, appended responses)
- `api/_lib/mappers/*.js`: payload normalization (search/media/season/episode)

## 4. Data Model (Watchlist v2)

Primary shape is schema v2 with split concerns:

- `source`: provider identity + freshness metadata
- `media`: canonical descriptive metadata (title, runtime, genres, cast, artwork, logo)
- `showData`: seasons + episode structure
- `userState`: status/vibe/energy/note/episodeProgress

Compatibility adapters flatten v2 into UI-friendly fields (e.g. `poster`, `backdrop`, `logo`, `episodeProgress`) in `src/domain/media/adapters.js`.

## 5. Tonight Surface

`TonightView` currently includes:

- Cinematic header with centered Hearth mark
- Hero carousel (auto-advance) using backdrop + bottom-left logo overlay + progress dots
- Horizontal rails:
  - Currently Watching
  - Movies (full unwatched list)
  - TV Shows (full unwatched list)
- Rail rewind behavior on Movies/TV Shows
- Loading skeleton placeholders for hero + rails

## 6. Progress Tracking

Show progress is keyed by episode identifiers and normalized fallback keys:

- explicit IDs (`id`, `episodeId`, `tmdb_id`, `tmdbId`)
- fallback key format (`s{season}e{episode}`)

Shared logic in `src/components/ItemDetailsModal/utils/showProgress.js` is used by both modal flow and card progress rendering to avoid key drift.

## 7. Metadata Audit + Repair

Audit (`useAppState` + `MetadataAuditModal`) reports gaps for:

- source
- poster
- backdrop
- logo
- runtime/year/genres/actors/director
- movie and show descriptions
- descriptions for aired or undated episodes (future episodes are excluded)
- show season metadata

Repair flow:

1. Select every title in the library, not only titles with known audit gaps.
2. Resolve provider identity via search when it is missing.
3. Refresh each title from `/api/media/refresh`, including titles that
   currently pass the gap audit, so newly available provider metadata is captured.
4. Persist normalized updates without mutating user episode progress intent.
5. Retry rate-limited and transient refresh failures with bounded backoff, then
   report transport failures separately from metadata the provider still lacks.

Repeatable full-library refresh:

1. Run the app in a development context and open **Dev tools → Audit metadata**.
2. Select **Refresh all metadata**. The operation is safe to repeat: it refreshes
   provider-owned catalog fields while preserving status, notes, vibe, energy,
   and episode progress.
3. Reopen the audit after completion to review any fields TMDB still does not
   provide. Transport failures can be retried by running the action again.

## 8. Logo/Clearlogo Pipeline

TMDB details calls include appended `images` and language filters.

`mediaMapper` extracts `logoUrl` from `images.logos`:

- prioritize English (`iso_639_1 === 'en'`)
- fallback to first valid logo
- null if unavailable

Logo is persisted into canonical `logo` field and consumed in Tonight hero.

## 9. Testing Strategy

- API route tests: `npm run test:api` (`api/__tests__/*.test.js`)
- Frontend/component tests: `npm run test:unit` (Vitest + jsdom)
- Key targeted areas:
  - media mapper and request params
  - show progress utilities
  - space identity and deterministic IDs (`src/services/firebase/spaces.test.js`)
  - tonight hero/rail behavior

## 10. Deployment Shape

Target: Firebase App Hosting

- `npm run build` outputs static assets to `build/`
- `server/index.js` hosts static app and API routes
- `apphosting.yaml` / `apphosting.production.yaml` define runtime config

## 11. Key Operational Notes

- Do not store binary poster/backdrop assets in repo for runtime; use absolute URLs.
- Keep watchlist writes going through schema/adapters to preserve v2 consistency.
- For metadata changes, validate both:
  - API normalization tests
  - UI regressions in Tonight and ItemDetails modal
