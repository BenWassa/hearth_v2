# Template Mode

This folder contains the standalone-friendly demo mode for Hearth.

## What it does

- Seeds a starter library of 30 titles (`seedLibrary.js`)
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
