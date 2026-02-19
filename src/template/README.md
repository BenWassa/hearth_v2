# Template Mode

This folder contains the standalone-friendly demo mode for Hearth.

## What it does

- Seeds a starter library of 30 titles (`seedLibrary.js`)
- Runs entirely in local in-memory state (`useTemplateAppState.js`)
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

- `src/app/useConfiguredAppState.js` switches between normal/Firebase mode and template mode.
- For a dedicated template repo, keep `src/template/` + `src/app/useConfiguredAppState.js` and remove Firebase onboarding/services as desired.
