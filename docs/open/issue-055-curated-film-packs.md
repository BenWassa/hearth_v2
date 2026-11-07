# Issue #55 — Optional Curated Film Packs

**Issue:** https://github.com/BenWassa/hearth_v2/issues/55  
**Repository:** `BenWassa/hearth_v2`  
**Status:** Open — planning specification; no production implementation or release  
**Scoped:** 2026-11-07  
**Proposed priority:** P2; medium engineering effort plus separate editorial verification  
**First pack:** Black Comedy Excellence (`BenWassa/BE`)  
**Source of product decision:** Owner approved **optional curated film packs**, with BE as an initial opportunity.

## 0. Executive decision

Create one optional discovery surface that offers an authored, finite list of films and lets the household **selectively save verified titles into its existing shared library**.

**Invariant:** A pack is a *source of discovery*, not a second watchlist, a franchise World, an additional Tonight rail, a replacement for Add search, or a recommendation engine.

The concept is approved; the detailed UX and technical implementation in this record are **proposed specifications**. BE editorial copy, artwork and published pack content remain gated by identity, provenance and distribution review.

## 1. User problem and outcome

**Problem:** A household may want to explore a thoughtful, finite themed group of films rather than having to know the exact title to search. Hearth's Add screen supports individual title search and JSON/CSV import; its Worlds route organizes established franchises already represented on the household shelf. Neither presents self-contained external editorial movie lists for voluntary discovery and selection.

**Outcome:** From Add, open an editorial film pack, browse all titles, select any subset, import them as ordinary shared-library films with existing TMDB metadata/classification, and return later to see which entries are already owned. No account, subscription, new external provider or data silo is necessary.

Success is measured by reliably adding intended films, **not** page views, engagement or completion of all entries.

## 2. Product design and navigation

### Entry point
- Add view: place one low-emphasis **Curated film packs** section *below* existing search, not inside search results; the section shows a single BE card.
- For **one approved pack**, tapping the card goes directly to its detail page (no intermediary pack directory).
- When **two or more approved packs** exist, the section may open a finite directory of curated pack cards. Avoid a new bottom-nav destination.
- No Tonight rail, World or saga membership may be assigned due solely to pack membership. Do not add a Discover tab or recommendation feed.

### Pack detail
- Header: back control, **Black Comedy Excellence**, short editorial subtitle and attribution. Avoid claiming an objective “top 50” or critic consensus.
- Optional approved cover: rights-cleared, restrained, compatible with Hearth's warm dark tokens. Never rehost BE's unverified local poster or hero images.
- Finite grid/list of posters and title/year. Use small status labels, not rankings.
- Every film card may open a lightweight read-only preview with TMDB overview and (only when reviewed) concise sourced editorial context. No watched/rating/note controls before a film is owned.
- Initial selection **empty**. Tapping selectable items toggles selection; top-level **Select available** and **Clear selection** are explicit.
- One minimal filter, **All / Available**, is optional if 50 entries make visual scanning difficult. Do not add mood, genre, leaderboard, decade, or complex search in v1.
- Sticky, safe-area-aware footer: **Add N selected to Library**; disabled at N=0. A confirmation must state the count, especially after Select available. Stay on pack after save; show per-item result and allow another selection.
- Opening and closing pack/read-only preview must support Android back, browser back, Escape and focus restoration.

### Status policy (based on current shared space)
| State | Display | Can be included in Add selected? | Behavior |
|---|---|---|---|
| Provider ID verified; not in active or removed library | Available | Yes | Default add status `unwatched` |
| Exact provider identity in active library | In Library (or Watched) | No | Do not modify status, notes, vibes, classification, activity or progress |
| Recently removed; still inside restore window | Recently removed | Not by standard bulk add | Separate **Restore** action with explicit confirmation, using existing transaction; preserve all prior household state |
| Removed, but restore eligibility expired | Unavailable | No | Show existing removal/cleanup limitation; don't attempt silent overwrite/new ID |
| Missing/unverified TMDB ID, wrong film type or provider mismatch | Needs review | No | Editorial fix required; do not guess/save |
| Network or provider validation temporarily fails | Try again | No until verified | Explicit retry; other validated rows remain usable |

Changes to the current household watchlist should update availability while the pack view is open. Selection must be reconciled again before commits. Missing/temporarily unavailable artwork never counts as a reason to misidentify a film.

### Navigation and empty states
- `Tonight → Add → Pack → read-only film preview`; Android back returns one level at a time. Re-entry preserves the ordinary shared shelf state, not a separate pack watch history.
- **All pack films already saved:** still allow browsing; say “All available films from this pack are already in your Library” rather than enabling empty bulk action.
- **No data connection:** show bundled pack title/year list and already-in-library states when available, but disable additions requiring provider verification. No unverified fallback records.
- **Pack not approved/manifest corrupt:** hide entry behind feature gate; do not show a broken pack or unreviewed text.

## 3. Dataset and editorial contract

**BE source:** `https://github.com/BenWassa/BE/blob/main/data/master_top50.json`.

The 2026-11-05 BE audit `docs/audits/002-editorial-audit-report.md` establishes:
- 50 unique title/year records; ranks originate from three AI research reports, **not** independent critic consensus;
- no canonical TMDB/provider IDs in source list;
- 0/50 canonical entries include `why_it_matters`, director, cast or subgenre fields; source labels lack claim-level citation URLs;
- all 50 film posters and three hero images lack verifiable per-file licensing/provenance in that repository;
- 12 inclusion-boundary items merit individual review, and 2020s films are not represented in this particular historical 50.

**No unreviewed BE rank, cultural claim, poster file, Wikipedia article image, or third-party prose should be imported into Hearth as if verified.** The creator's BE content licence is CC BY-NC-ND 4.0; before placing any adapted/reproduced original expression in a distributed Hearth pack, document the rightsholder's authorization, scope and required attribution, especially if a derivative edition is created. Film titles, release years and the editor's own independently authored summaries can be reviewed separately. Private repository access does not confer users' runtime access or publication rights.

**Editorial pipeline:**
1. Pin the source BE **commit SHA** and a pack release version.
2. Reconcile with BE issue #5's stable editorial IDs and source ledger when approved. The initial pack may use fixed `be-film-0001…` IDs only once aligned to a canonical mapping.
3. Verify each included film against TMDB **movie** ID, release year, alternate titles, type and expected artwork. Require reviewer record for legitimate alternate-year/title cases; reject unresolved collisions and TV/movie confusion.
4. Keep source title and year as display candidates while using **TMDB provider ID as the write identity**. Never use fuzzy title/year matching to save a different film.
5. Approve original short introduction/description; include a plain attribution such as **Curated by Black Comedy Excellence** and credit/source/license details in a viewable information area.
6. For film-specific “why this matters” notes, require source URLs and an editorial sign-off before display; otherwise omit the section entirely.
7. Use existing allowed TMDB-hosted poster URLs and current TMDB attribution, with text fallback. Design only rights-cleared pack-cover treatments.
8. Run schema, identity, source and artwork checks before a manifest is registered as available.

### Proposed local manifest (example contract, not real IDs)

```json
{
  "schemaVersion": 1,
  "id": "black-comedy-excellence",
  "version": "1.0.0",
  "title": "Black Comedy Excellence",
  "summary": "A curated selection of Black-led comedy and comedy-adjacent films.",
  "editor": "BE",
  "source": {
    "repository": "BenWassa/BE",
    "commit": "<PINNED_SHA>",
    "license": "<APPROVED_RIGHTS_RECORD>"
  },
  "entries": [
    {
      "editorialId": "be-film-0001",
      "title": "Coming to America",
      "year": 1988,
      "type": "movie",
      "provider": "tmdb",
      "providerId": "<REVIEWED_NUMERIC_TMDB_MOVIE_ID>",
      "order": 1,
      "note": null,
      "citations": []
    }
  ]
}
```

The placeholder ID is **not a verified TMDB match**. This manifest cannot be enabled as-is. For runtime, `buildMediaId` currently persists the watchlist key as `tmdb:<numericId>`; the logical curated lookup additionally requires **media type = movie**. Keep the identity representations consistent with `canonicalMediaKey` and Firestore rules.

### Publication and update policy
- Bundle approved pack manifests with Hearth's frontend build; **do not query a private GitHub repo from client code**, nor expose user GitHub tokens.
- Use dynamic import so pack data is not loaded during Tonight's first paint; register only approved, feature-flagged packs.
- Version updates may add/remove editorial entries, but **must never add/delete/mutate a household's saved films**. On reopening, availability is recomputed from current provider IDs.
- Keep original source snapshots/identity reviews in versioned documentation; do not imply that manual film ownership is the same as editorial collection completion.
- For the initial pack, validate all 50 intended entries before general release; a smaller internal fixture (e.g. 10–12 verified items) is acceptable for development and testing, but is not a published “Top 50”.

## 4. Technical implementation architecture

### Main integration points
| Module | Intended work | Risks |
|---|---|---|
| `src/App.jsx` | Lazy-load `CuratedPackView`, add `curated-pack` view, route Back properly, pass household state | Navigation history and template-mode compatibility |
| `src/views/AddView.jsx` | Secondary BE entry below search | Avoid obscuring search, keyboard/touch usability |
| `src/views/CuratedPackView.jsx` (new) | Header, intro, status-aware cards, selection and progress | Accessible focus and 320–448px responsive layout |
| `src/config/curatedPacks.js` + `src/data/curatedPacks/*.json` (new) | Approved finite pack registry, lazy manifest, content validation | Must never ship unapproved copied assets/copy |
| `src/domain/curatedPacks/{schema,matching,selection}.js` (new) | Pure validation, identity normalization, status, dedupe and selection | Stable TMDB identity; avoid title similarity |
| `src/app/useAppState.js` or extracted `src/app/curatedPackImport.js` | Verified batch-add with progress, cancellation and per-row outcomes | Current bulk import's permissive unmatched-save behavior |
| `src/services/mediaApi/client.js` | Reuse `getMediaDetails` for verified IDs (optional abort integration) | 429/offline; repeated requests |
| `src/domain/media/schema.js`, `src/services/firebase/watchlist.js` | Reuse watchlist payload / transaction; minimal changes if needed | Restores, origin semantics, preserving existing records |
| `src/views/ImportModal.jsx` | **Do not retrofit v1 into general free-text import modal** | Existing importer accepts unmatched rows by design |
| `src/template/*` | Preview-only or ephemeral demo compatibility; no access errors | Template app state lacks Firebase and import handler |
| `docs/README.md` | Link issue tracking record once accepted | Repo documentation lifecycle |

### Verified write sequence
1. Take a **snapshot** of selected, available, identity-reviewed pack IDs (do not alter the selected set mid-write).
2. Preflight each against household items and restored-item policy. Enforce proper `provider='tmdb'`, numeric `providerId`, `type='movie'`; reject unresolved source identities.
3. Request `getMediaDetails({provider:'tmdb',providerId,type:'movie'})`; validate returned provider ID / type / reviewed title-year correspondence. A content mismatch is a **per-item blocked error**, not permission to use a fuzzy search substitute.
4. Derive a **v2** payload through `buildWatchlistPayload`, using TMDB-owned title/media fields, `status:'unwatched'`, empty user note, no invented vibe or energy. Let the existing background classification pipeline determine independent facets later.
5. Write through `addWatchlistItem`, whose Firestore transaction returns `added | exists | restored`. Default additionOrigin should be **`import`**, as only `manual` and `import` are currently preserved, and collection activity must not mistake curated additions for intentional hand adds. A future explicit origin demands coordinated storage + activity changes.
6. Treat `exists` as **skipped**, not `added`; never re-save the active household document to overwrite status, watchedAt, notes, progress or classification.
7. A `restored` transaction must occur **only** after an explicitly confirmed Restore action, not the general bulk-add button. Preserve the previous user state.
8. Pace selected lookups, handle server 429 Retry-After/backoff using existing client patterns, and keep batches bounded/sequential or at very low concurrency. Avoid 50 eager detail API calls during browsing; posters can use approved cached URLs/lazy loading.
9. Record per-ID outcomes `added, already_present, restored, blocked_identity, failed_network, failed_write, cancelled`. Aggregate counts must equal attempted selections; retain IDs for **retry failed only**.
10. If the user cancels or exits, stop starting new work; prior successful writes remain. Reopening pack reflects committed Firestore items; subsequent retries are idempotent. Do not promise all-or-nothing transactions or background delivery after the app closes.

### Known defects/constraints to avoid
- `handleImportItems` in `useAppState` currently calls `addWatchlistItem` **even after an unmatched search/detail response**, and increments `importedCount` after its call. This is acceptable legacy behavior for the general importer but **not** the curated-pack verification contract.
- Existing `buildImportDedupeKey` falls back to title/type/year when no provider ID exists. Curated packs must require verified provider identity instead of falling back.
- `addWatchlistItem` currently **automatically restores** recently removed items on re-add; the pack UI must preflight/route these items through the explicit Restore action.
- `buildWatchlistPayload` uses a `tmdb:<id>` persisted media ID, not the contextual `tmdb:movie:<id>` classifier key; do not change this key scheme just for packs.
- Existing `additionOrigin` persistence only recognizes `import` and `manual`; adding a new string silently becomes `manual` if left unmodified.
- Adding a pack route must use `useViewHistory` and not swallow Pixel's back gesture or cause Home exit.
- The household belongs to current `spaceId`; account switching during a batch should cancel further writes and never redirect writes into a different space.

## 5. Nonfunctional requirements
- **Security / privacy:** pack metadata is public static app content; no BE repository keys or user's library state sent to BE. Existing Firebase auth/rules define household access. No extra Firestore collection or vendor endpoint.
- **Rights / attribution:** separate code and editorial licences; BE licence and source link shown; each external claim traceable, artwork source approved.
- **Accessibility:** labels for film selection/status; minimum 44px touch targets, visible focus, predictable keyboard selection, live progress `aria-live` without excessive announcements, modal focus containment, support reduced motion.
- **Visual design:** use `DESIGN.md` / `DESIGN.json`, stone/amber palette, restrained editorial cover, no infinite scroll, no autoplay, phone-first.
- **Performance:** lazy JS/data chunks, lazy poster URLs, limited provider requests per selection; never hydrate 50 full media detail records on initial Add or Tonight display.
- **Offline:** static manifest remains readable when cached; adding requires verified metadata/network and reports failure clearly.
- **Roll back:** hide entry/registry flag and stop serving manifest; **never delete movies the user chose to add**.

## 6. Test matrix and acceptance criteria

### Pure-domain / fixture tests
- [ ] Pack schema rejects duplicate editorial IDs, duplicate provider IDs, invalid/placeholder provider IDs, unsupported type, unsupported manifest version and missing source approval.
- [ ] BE mapping file records one-to-one title/year → TMDB movie identity for every **published** item; legitimate title/year aliases are reviewer-explained.
- [ ] On-shelf identity matches only exact verified provider; title similarity does not cause false merges.
- [ ] Unselected items, stale selection and removed items never enter the default bulk import.
- [ ] Reviewed claims have valid source links or are absent; unapproved copyrighted art never enters static bundle.

### Integration / transactional tests
- [ ] Starting with an empty library, selecting 1/10/all missing films adds exactly selected films as unwatched.
- [ ] Mixed library: 10 available, 8 already saved, 4 watched, 2 removed, 1 invalid — selection/status/save counts remain truthful.
- [ ] Multiple items with repeated IDs are not written twice.
- [ ] If another household member adds a selected film before our transaction, return `exists`; preserve their existing status/notes/progress.
- [ ] If a film was removed within 24 hours, bulk add does **not** restore silently; confirmed Restore preserves prior state.
- [ ] If restore has expired, show a specific failure and do not bypass the original ID.
- [ ] Provider 404, 429/backoff, type mismatch, ambiguous release date, offline or Firestore failure blocks **only affected item**; success remains saved; retry failures only succeeds later.
- [ ] User navigates back, switches space, logs out or cancels mid-batch: stop subsequent writes, prevent cross-space persistence.
- [ ] Repeating completed import is idempotent; UI result counts honor `added | exists | restored`.
- [ ] Existing general `ImportModal` and manual Add tests continue to pass.
- [ ] Automatic classification is nonblocking; no `vibe`/`energy` guess inserted by the pack; Worlds/sagas remain unchanged.
- [ ] A pack manifest revision never changes household saved titles or flags.
- [ ] Template/demo mode is explicitly disabled or runs an ephemeral in-memory simulation; no broken click paths.

### Manual QA
- [ ] View widths 320, 360, 390, 448px (plus tablet/desktop); no clipped controls, safe-area obstruction or horizontal overflow.
- [ ] Android Pixel swipe-back + browser back: film preview → pack → Add → Tonight; no accidental app exit from nested screen.
- [ ] Keyboard, focus return, screen-reader names, high contrast and reduced-motion validated.
- [ ] Approved text credit/source info and TMDB attribution visible in an appropriate location.
- [ ] App loading and first-paint metrics unaffected in Tonight mode.
- [ ] `npm run lint`, `npm run test:unit`, `npm run test:api`, `npm run build` all run and actual results recorded in implementation PR.

## 7. Work plan, dependencies and approval gates

**Phase A — Data and editorial** (must precede content publishing):
1. Freeze and review BE source commit/50 entries; resolve BE issue #5 canonical ID/provenance decisions and flagged inclusion boundary.
2. Create auditable film-by-film TMDB identity match and reviewer exceptions (start with 10–12 as internal fixture, validate all published films).
3. Clear artwork/copy licensing and attribution in coordination with BE issue #12. No locally downloaded BE posters.

**Phase B — Domain and technical**:
4. Add versioned pack registry, strict manifest schema, identity/status selectors and build-time check.
5. Implement verified batch-add service isolated from permissive generic importer with per-item results, partial retry and controlled Restore.
6. Reuse Firestore identity/transactions and background classification; no new persistent pack record.

**Phase C — Product UI and validation**:
7. Add minimal card to Add, pack detail/film preview and mobile selection/progress UX; native Back and accessibility.
8. Implement automated test matrix, demo fixture, manual 320–448/Pixel QA and perf checks.
9. Gated preview/review, owner acceptance; only then enable shipped pack and document version/rollback.

**Recommended delivery sequence:** A is an editorial release gate, B and C can be prototyped against a small wholly synthetic pack first. Do not claim production readiness from synthetic tests.

### Dependencies
- **BE** #2 audit, #5 canonical editorial schema and #12 artwork/rights.
- **Hearth** #20/#21 automatic classification, #22 Android back navigation, #39 recently removed; inspect current behavior before editing shared modules.
- Existing `src/domain/import/importer.js`, `src/app/useAppState.js` and Firestore tests must pass unchanged unless reviewed changes are necessary.

### Out of scope (v1)
User-authored/shareable packs; remote pack marketplace; deep links/QR pack exchange; generative pack authoring; provider-specific streaming availability; progress/completion badge; independent watched history; pack-level ratings; automatic scheduling/recommendation; recurring notifications; automatic pack updates of the shared library.

## 8. Decisions to confirm at implementation review

1. **Selection density:** a two-column poster grid vs a one-column list at 390px. Favor a compact two-column grid *if* selection and status remain legible in usability testing.
2. **Film preview:** lightweight read-only sheet with TMDB synopsis; show cultural notes only after citation and rights review.
3. **Initial launch count:** full 50 after all identities approved; if editorial review is delayed, consider a clearly labelled smaller curated edition rather than calling it the Top 50.
4. **Source presentation:** show **Curated by BE** and a clear “About this collection” attribution/licence route. Do not expose internal AI-rank numbers.
5. **Pack directory:** defer until a second pack is approved; keep Add direct-entry in v1.

## 9. Outcome of this scoping task

- [x] Read existing Hearth product and current Add/import/Firestore/collection code paths.
- [x] Reviewed BE source catalog, editorial audit, licences and known data gaps.
- [x] Identified safe identity, state and navigation boundaries.
- [x] Scoped UX, data contract, code touchpoints, phased delivery, risks and test gates.
- [ ] No pack implementation, TMDB ID mapping or rights review completed.
- [ ] No test suite or app runtime executed for this planning-only document.
- [ ] No merge, deployment or production feature activation.

**Rollback of planning:** Close issue or decline draft PR; no production behavior has changed.
