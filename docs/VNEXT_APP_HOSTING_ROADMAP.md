# Hearth vNext Roadmap (Firebase App Hosting)

## Objective
Move Hearth from static/offline-heavy metadata flow to a live backend on Firebase App Hosting where users can:
- Search titles live.
- Add titles with poster and backdrop in one flow.
- Save curated metadata in Firestore.

Vibe and energy automation is a later phase with explicit user confirmation.

## Current Branch Baseline
Working branch: `backend-live-metadata-foundation`

Already implemented on this branch:
- API surface for search/details/seasons/episodes under `api/`.
- Frontend live search + enrich add flow in `src/views/AddView.js`.
- v2 media schema adapters in `src/domain/media/`.
- Refresh/staleness and API hardening foundations.

## Target Runtime
- Host frontend + backend runtime on Firebase App Hosting.
- Keep Firebase Auth + Firestore as system of record.
- Keep third-party provider keys server-side only.

## Delivery Phases

### Phase 1: Runtime Cutover to Firebase App Hosting
- Adapt current `api/` handlers to App Hosting runtime wiring.
- Configure preview + production backends and secrets.
- Remove static base-path assumptions.
- Validate service worker behavior with live API routes.

Exit:
- `/api/health`, `/api/search`, `/api/media/*` stable in preview and production.

### Phase 2: Live Add Flow Completion
- Ensure result selection hydrates canonical metadata including poster/backdrop.
- Keep manual add fallback active.
- Enforce Firestore v2 writes for API-sourced items.

Exit:
- User can search and save a complete item (title + poster + backdrop + metadata) end-to-end.

### Phase 3: Metadata Quality and Ops
- Add staleness refresh policy and rate limits.
- Add smoke tests and operational runbook.
- Track latency, error rates, and refresh failures.

Exit:
- Operational dashboards and rollback path are tested.

### Phase 4 (Later): Gemini-Assisted Vibe/Energy Suggestions
- User still selects title manually.
- Gemini suggests `vibe` and `energy` only.
- User must explicitly accept or override suggestions before save.
- No unattended AI writes.

Suggested inference response contract:

```json
{
  "suggestedVibe": "comfort",
  "suggestedEnergy": "balanced",
  "confidence": 0.78,
  "reasoningSummary": "Low-conflict tone and moderate pacing.",
  "model": "gemini-...",
  "generatedAt": "2026-02-13T00:00:00Z"
}
```

## Guardrails
- AI suggestions are advisory, never authoritative.
- Store audit fields for accepted vs overridden suggestions.
- Enforce request budgets and retry ceilings for inference.
- Keep import/manual controls available during outages.

## Migration Note
`scripts/ingestTitles.js` and poster-workflow updates were pulled into this branch to preserve ingestion continuity while runtime migration proceeds.
