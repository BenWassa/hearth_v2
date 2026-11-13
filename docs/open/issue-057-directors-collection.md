> **CURRENT STATUS (2026-11-13): Technical foundation in draft PR #58, NOT the approved UX.** The owner later approved Legendary Directors with a static Essential 10, Watch Next, IMDb/RT in ranked rows, an in-centre details modal, individually sourced portraits and authentic signatures. See the [parent issue](https://github.com/BenWassa/hearth_v2/issues/57), [editorial issue #60](https://github.com/BenWassa/hearth_v2/issues/60), [art issue #61](https://github.com/BenWassa/hearth_v2/issues/61) and current [blueprint](../collections/directors/DIRECTORS_COLLECTION_BLUEPRINT.md). Earlier paragraphs below are a dated implementation ledger, not authorization to ship the older design. CI passed previously for the older implementation; full revalidation remains due. The BE editorial shell in draft PR #59 conflicts on Tonight/Collections shared files and needs coordination.\n\n# Issue #57 — The Directors collection

**Issue:** https://github.com/BenWassa/hearth_v2/issues/57  
**Branch:** `feat/directors-collection-57`  
**Status:** Implementation proposed for review; not merged or deployed  
**Date:** 2026-11-12  
**Companion blueprint:** [The Directors product/design/research specification](../collections/directors/DIRECTORS_COLLECTION_BLUEPRINT.md)

## Why this exists

Hearth's collection rail currently represents household-owned franchises. The open Black Comedy Excellence workstream (#55, draft PR #56) establishes **editorial packs** in that rail that appear even when the household owns none of their films. A director-led collection is a natural related use case: a finite collection that helps two people choose what to watch through familiar filmmakers.

It must not become a streaming-style director search engine, a ranking, an extra tab, an AI recommender or a watch-history completion tracker.

## Product decisions implemented on branch

- One title-forward **The Directors** tile in Tonight's existing Collections rail, visible with zero sagas; no separate Tonight rail.
- A second route through the **Curated collections** section of the existing All collections index.
- Dedicated full-screen, mobile-width directory → individual filmmaker profile → film details. Not a saga dialog.
- One authorial intro per filmmaker and a **Start here** selection of up to three canonically verified directed works.
- Chronological list of **released TMDB credited films** (not claimed to be exclusively full-length features). All credits require `crew.job === 'Director'`, `department === 'Directing'`, release date at/before current date and unique provider ID.
- A film already in the shared library opens ordinary Hearth detail. Unsaved films load their verified provider detail on demand and offer explicit single-film Save. Recently removed films cannot be silently restored through the hub.
- No backend download of every filmmaker or every film on load. Roster static; one person request when opening profile, one detailed film request only after tapping an unsaved film. 30-minute client cache, server-side surrogate cache header; reuses existing TMDB credentials and retry behavior.
- No new generated artwork; TMDB images are sourced at runtime; typography and Hearth stone/amber surfaces carry the new tile.

## Code change ledger

| Component | Change |
|---|---|
| `src/config/directorCatalog.json` | Versioned set of 12 person IDs, editorial descriptions, provisional starter IDs |
| `api/_lib/directorMapper.js` | Canonical authored credits filtering, mapping, chronology, dedup |
| `api/directors/[id].js` | Allowlisted API and rate limits |
| `api/_lib/providerClient.js` | Re-export reusable `tmdbGet` |
| `server/app.js` | Express route for local/App Hosting |
| `src/services/mediaApi/client.js` | Typed-by-convention client accessor |
| `src/views/DirectorsCollectionView.jsx` | Full-page directory, profile, film preview/add and navigation |
| `src/views/components/tonight/CollectionsRail.jsx` | Directors tile in existing rail, including empty saga rail |
| `src/views/CollectionsBrowseView.jsx` | Curated section in All collections |
| `src/views/TonightView.jsx`, `src/App.jsx` | Open/close state, focus return, watchlist/removed-item props |
| `api/__tests__/directors.test.js` | Role/identity/date/allowlist endpoint tests |
| `src/views/DirectorsCollectionView.test.jsx` | Lazy profile loading and save/restore protection |

## Compatibility and ownership

1. #55 / PR #56 is still planning only. The Directors hub intentionally uses a small distinct `directorCatalog`, not #55's not-yet-merged editorial-pack manifest or its import feature. **Integration task:** when #55 lands, move both to a shared editorial-collection registry, preserve BE's approved pinned position, and avoid duplicate rails.
2. Worlds and TMDB franchise collections keep their existing metadata and ranking. A film's presence here does not modify its World membership, classification, watch status, or whether it's eligible in a saga.
3. Source record remains stable even when a director's live TMDB credits expand. Featured IDs that no longer appear as credited films are omitted and flagged `missingStarterIds` rather than guessed.
4. Shared Firestore add flow currently resolves `added|exists|restored` internally, but the top-level `handleAddItem` callback does **not** return that outcome to this screen. The page therefore says **save requested** rather than claiming save succeeded until library state updates. This deserves a future explicit outcome contract.
5. Existing overlay history (Android/Pixel back navigation, issue #22) must be manually reviewed. In-page Back/Escape are wired, but system-back is not claimed complete.

## Validation

Automated tests committed but **not executed in this connector-only environment**; no local repository checkout / configured runtime credentials are available here.

### Pre-merge validation checklist

- [ ] CI: `npm ci && npm run lint:ci && npm run test:api && npm run test:unit`
- [ ] Build with configured project environment: `npm run build`
- [ ] Verify every person ID and every starter ID against real TMDB person credits; record intended edition, year and ownership attribution.
- [ ] 320, 360, 390, 448px phone sizes; large text; no horizontal page overflow; 44px targets; reduced-motion.
- [ ] Pixel hardware back, browser back, Escape, focus return, nested existing-film modal.
- [ ] Zero-owned library, no franchises, all films owned, partial provider outage, missing posters, movies with no release date, multiple Director credits.
- [ ] Saving missing film, existing saved, Recently removed, offline failure, two-household simultaneous saves. Ensure no false success and preserve existing states.
- [ ] TMDB required attribution logo and notice in app Credits/About and any changed surface; rights/provenance review.
- [ ] Align with issue #55 after its registry contract is merged; do not alter or auto-merge that workstream.

## Owner review gate

Review the 12-name initial set, title **The Directors** versus **Legendary Directors**, one-card rail placement and the typography-only cover, and whether Start here should be 3 or 4 films. Follow the [visual walkthrough](../collections/directors/DIRECTORS_COLLECTION_BLUEPRINT.md) and PR diff before any merge or release. No issue closure implied.
