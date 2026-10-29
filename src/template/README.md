# Template Mode

This folder contains the standalone-friendly demo mode for Hearth.

## What it does

- Seeds 30 metadata-rich titles with synthetic household notes, viewing history, and episode progress (`seedLibrary.js` + `demoActivity.js`)
- Runs entirely in local in-memory state (`useTemplateAppState.js`)
- Authenticates demo visitors with Firebase anonymous auth when available
- Hydrates seed titles with API metadata (poster, backdrop, logo, overview, cast, runtime, and seasons)
- Uses existing app placeholders when metadata is still loading or unavailable
- Resets to seed data on page refresh
- Keeps the main UI flow (Tonight, Shelf, Add, Decision) for feature testing
- In local dev (`localhost`/`DEV`), template mode also exposes metadata audit/repair in the header menu for temporary pipeline work

## Run it

```bash
VITE_HEARTH_MODE=template npm run dev
```

### Manual One-Title Hydration (Debug)

Use these env vars to hydrate exactly one title by title/year:

```bash
VITE_HEARTH_MODE=template \
VITE_TEMPLATE_HYDRATE_LIMIT=1 \
VITE_TEMPLATE_HYDRATE_TITLE="The Dark Knight" \
VITE_TEMPLATE_HYDRATE_YEAR=2008 \
npm run dev
```

## Notes for repo split

- `src/app/useConfiguredAppState.js` only resolves the mode (`isTemplateMode`). It does not import template code.
- `src/index.jsx` renders `src/template/TemplateApp.jsx` through `React.lazy` when `isTemplateMode` is true, otherwise the normal `App`. `TemplateApp` calls `useTemplateAppState` and renders the shared `HearthAppView`. Template code and `seed-media-map.json` (~1.7 MB) therefore live in their own chunk that real users never download.
- For a dedicated template repo, keep `src/template/` + `src/app/useConfiguredAppState.js` and remove Firebase onboarding/services as desired.

## Demo data coverage

The default library includes 15 films and 15 shows across all five vibes and three energy levels. It starts with unwatched picks, seven shows in progress, completed films, and a fully watched show. Show progress uses the snapshot’s actual episode IDs, including mid-season and season-boundary stopping points. Personal notes give the household a reason to save each title. Activity spans multiple weeks, with two fictional household members and both manual and imported additions.

The scenario picker offers empty, six-title, movie-only, shows-in-progress, full-library, completed-favourites, film-collections, and busy-household states. The collections profile contains five film series; the busy profile combines those series with the original 30 titles. Completed shows have complete episode histories rather than only a status label.

Metadata is a checked-in provider snapshot, not a claim of current release information. Household activity is fictional and anchored to October 28, 2026 for reproducibility. Refreshing or loading a scenario returns fresh copies, so edits never change the baseline. Regenerating the media map preserves the curated activity layer.

## Classification when adding titles

Visitor additions use the same classification queue and effective vibe/energy readers as the connected app. The queue sends only TMDB identities to `POST /api/media/classify-demo`, authenticated with a verified anonymous Firebase token. Curated seed titles are excluded from live inference. Results and retry markers stay in memory and reset with the demo.

The demo route shares the server's public classification cache, transactional leases and daily Gemini budget, but never reads or writes household records or media catalog records. The connected endpoints retain their approved, non-anonymous user requirement. Gemini runs only when the existing server-only model, credential, enablement and metadata-sharing settings are configured; otherwise the rules baseline applies. Without anonymous auth or a running backend, local grouping still works from available evidence. Unknown attention demand remains unlabelled rather than being assigned an invented energy.
