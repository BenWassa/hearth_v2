# Issue #55 — Curated film packs in Tonight Collections

**Issue:** https://github.com/BenWassa/hearth_v2/issues/55  
**PR:** https://github.com/BenWassa/hearth_v2/pull/56  
**Status:** Open, design/content/planning; no production implementation  
**Initial scope:** 2026-11-07; **direction revised:** 2026-11-10  
**First pack:** Black Comedy Excellence (BE), sourced from BenWassa/BE  
**Owner direction (2026-11-10):** **Not in Add.** A curated pack is a **tile in Tonight's existing Collections rail**, opens its **own full-page collection**, and may move into a standalone curated rail in a later product iteration if substantial content warrants it. Build out editorial content and design first; **do not generate a cover image now.**

## 0. Decision summary and non-goals

**Confirmed**
- Curated packs are first-class **editorial collections** within the existing Tonight **Collections rail**, not a new tab and not a new Add entry.
- Tapping a pack tile opens a full-screen, dedicated **CuratedPackPage**; a small modal, import wizard, or saga details sheet is insufficient.
- The first pack is **Black Comedy Excellence**. The page must have an editorial identity, useful presentation and film exploration, not just a bulk-import checklist.
- Display a pack regardless of how many pack movies are saved to the household library (**including zero**).
- Films remain ordinary Hearth watchlist titles when explicitly added; existing household data is authoritative.
- A future dedicated **Curated Collections** Tonight rail is **possible, not approved for v1**. Reassess only after multiple substantial packs or measured visual crowding; never introduce a rail solely because BE contains 50 films.
- Cover art direction, ImageGen asset generation and any licensing choice for new art are **deferred for explicit owner selection**. No image-generation task should start under this issue.

**Not included in v1:** Add screen pack placement; auto-adding all films; separate pack watch history; franchise World assignment; new bottom tab; AI recommendations; subscriptions; backend for pack catalog; gamification, progress/completion badges, scrolling feeds.

**Engineering inference:** existing Collections rail displays franchise sagas derived from shelf-owned records and intentionally omits sagas represented by Worlds. A curated pack must enter as a **distinct type**, without passing through TMDB saga eligibility or World affiliation.

## 1. Existing code facts, confirmed in repo

- \`src/views/TonightView.jsx\` derives \`collections\` from shelf items through \`buildCollectionRollups\` → \`filterEligibleCollections\`. It mounts \`CollectionsRail\` directly above **The Classics** (or at end if that row is absent).
- \`src/views/components/tonight/CollectionsRail.jsx\` currently returns \`null\` when no eligible sagas exist; shows 2:3 poster-style cards for sagas, sorted by recent saga activity, excluding Worlds; conditionally adds a neutral **All collections** tile.
- \`src/views/CollectionsBrowseView.jsx\` opens **All collections** as a plain list of sagas, or a specific World with hero + saga shelves. It currently has no themed/editorial pack section.
- \`src/components/cards/CollectionCardLandscape.jsx\` is a **different** legacy-style landscape card with watched percentage; do not reuse its completion semantics for a pack.
- \`src/App.jsx\` has the app-level view switch; \`src/app/useViewHistory.js\` manages back history. Existing Tonight overlays preserve opener/scroll context with focus-restoration logic.
- \`src/app/useAppState.js\` currently performs bulk imported-item matching/saving; it may write unmatched items, so the existing permissive import pipeline is **not sufficient** to save editorial pack films safely.
- \`src/domain/media/schema.js\` and \`src/services/firebase/watchlist.js\` implement v2 media/household schema and transactional \`added|exists|restored\` behavior. \`additionOrigin\` currently only preserves \`manual\` or \`import\`.
- \`src/domain/media/classification.mjs\` and existing queue classify movies on the shared catalog; pack inclusion must not imply a new mood/vibe category.

## 2. Final intended information architecture

\`\`\`text
Tonight
├─ Worlds rail                          [unchanged]
├─ Mood / suggestion rails               [unchanged]
├─ Collections rail                      [existing position]
│  ├─ Black Comedy Excellence            [new curated-pack tile, pinned]
│  ├─ Eligible ungrouped saga tiles      [existing behavior]
│  └─ All collections                    [existing conditional index]
│
├─ Black Comedy Excellence               [FULL PAGE; one tap from rail]
│  ├─ Header, editorial identity
│  ├─ Why this collection / source
│  ├─ Start here                          [small featured set]
│  ├─ Explore by theme                    [finite authored chapters]
│  └─ All films                           [complete searchable? NO, finite index]
│      └─ Film details → Add to Library   [existing saved-film details when owned]
│
└─ All collections index
   ├─ Curated collections                 [new; BE, future packs]
   └─ Sagas                               [existing activity ordered list]
\`\`\`

**Collection rail ordering:**
- A single, identifiable **BE** curated card is pinned **first** in the existing Collections rail in the initial implementation, with saga ordering preserved after it. Editorial placement must not distort saga freshness scores.
- Show the rail when **at least one eligible saga OR one published editorial pack** exists, including an otherwise empty library. Prevent two redundant empty states from competing with BE in an empty Tonight experience.
- Keep the tile within the rail's established 2:3 size and scroll-snap rules; no autoplay, no cloned cards, no animated carousel, no new rail at this stage.
- The BE cover is **title-forward and type-distinct** while preserving the same card size, visual density and accessibility. Use a tasteful typographic placeholder in Hearth colors until owner approves an image-generation brief later.
- Add the BE item to the **All collections** index under a distinct \`Curated collections\` heading, ahead of sagas. Do not invent a saga for BE or group it under a World.
- Preserve the existing All collections tile visibility rules, with a sensible single-pack exception: don't force a redundant All collections tile if BE is the only item in the rail.

**Future rail promotion gate:** return for product review once several editorial packs are live *and* the mixed rail becomes hard to scan or a distinct curated row demonstrably reduces friction. Prefer deliberate explicit product decision, not a dynamic count-based auto-move. Do not duplicate a pack in two Tonight rails at once.

## 3. Full-page experience: proposed layout

### A. Header / hero
- Full-viewport-width page surface, respecting Hearth's phone-sized centered shell and safe-area insets. Full-page means dedicated scrollable view, **not** a small dialog containing a one-screen picker.
- Back arrow goes directly to the same Tonight Collections scroll position and restores focus to the BE tile.
- Header eyebrow: \`CURATED COLLECTION\`. Serif main heading: \`Black Comedy Excellence\`.
- Short subtitle: *A curated journey through Black-led comedy cinema.* This is **draft UI copy**, not an evidence-backed claim about any particular film.
- Credit: \`Curated by BE\`; a quiet \`About this collection\` detail reveals provenance/method and limitations.
- The approved hero may eventually use full-bleed artwork. **For now, specify only a text-first hero** with warm-stone layered backdrop and no photography or generated imagery. Do not use BE local posters or hero JPEGs.
- Avoid prominent film totals, \`50 best\`, progress percentages, completion/ownership counters or rankings above the fold.

### B. Start here
- A short **4–6-film starting selection**, editorially approved and *not* the source's AI ranking displayed as objective truth.
- Poster-forward horizontal shelf with native scroll, capped; tapping film opens film detail. If already on shelf, use existing details. If not, use a read-only provider preview with a clear \`Add to Library\` action.
- Draft candidates **for editorial review**: Coming to America (1988), Friday (1995), House Party (1990), Hollywood Shuffle (1987), Girls Trip (2017), Black Dynamite (2009). These titles exist in BE data; inclusion in Start here is a **new proposal**, not prior BE editorial approval.
- Featured titles also appear in All films; this is an intentional discovery shortcut, not duplicate membership among editorial chapters.

### C. Explore by theme
- 3–6 succinct editorial chapters, each with a human-readable headline, one-line introduction and no more than ~6 posters initially. Use \`View all\` to jump to that chapter's full subsection when needed, rather than six long redundant rails.
- **Provisional chapters, pending film-by-film mapping and editorial review**:
  1. \`Comedy Icons\` — performer-led favorites and standouts; provisional examples: Harlem Nights, The Nutty Professor, Dolemite Is My Name.
  2. \`Friends & Community\` — buddy, family and ensemble films; provisional examples: Friday, Barbershop, Girls Trip.
  3. \`Parody & Satire\` — genre play and social commentary; provisional examples: Hollywood Shuffle, Undercover Brother, Black Dynamite.
  4. \`Love & Relationships\` — romance-centered comedy and comedy-adjacent selections; provisional examples: Boomerang, Think Like a Man, Waiting to Exhale.
  5. \`Beyond Straight Comedy\` (optional) — genre-borderline works with **explicit inclusion explanation**, e.g. Do the Right Thing, Set It Off; require BE editorial decisions first.
- Do not imply all examples are uncontroversially comedies. Do not mechanically import \`tags\` as finished editorial rationale.
- Every published film receives **one primary chapter assignment** when chapters cover the full catalog; avoid duplication between primary chapter groups. Film-level secondary tags can exist internally.
- No chapters should exist merely to pad the interface. At initial release it may be better to foreground **3–4 mature chapters and All films** than 5 under-researched ones.

### D. All films
- Complete published BE pack in a finite, poster-forward **two- or three-column grid** according to legibility tests at 390px. If labels and save affordances cannot fit at three across, default to two.
- Stable editorial order declared in manifest, with film title/year; unreviewed current \`avg_rank\` is **never** displayed. No infinite scroll, autoplay, feeds, or recommendation percentages.
- Current space membership: saved films use a quiet check or \`In Library\` state; watched status is not a collection-completion badge. Unowned films can be opened and added individually.
- In v1, \`Choose films\` can enter an **optional secondary multi-select mode**, then \`Add selected to Library\`; this must not displace browsing or clutter every film by default. Default selection empty.
- If a user adds a film, the poster and film detail update to indicate saved state without navigating to Add. The collection remains open.

### E. Film detail
- Existing owned film: show Hearth's ordinary full film details, status, notes/progress as appropriate, and return to the same pack position.
- Not owned: show TMDB metadata and artwork with \`Add to Library\`, no invented status/rating and no private user data. Do **not** require first entering the Add view.
- Cultural/context notes: optional, concise, **sourced and approved**, with visible external citation. Omit until BE's evidence gate is satisfied.
- Unsupported provider ID/identity: unavailable for add; never substitute a fuzzy title match.

### F. Outcomes
- Newly added films flow into the existing **shared library** as unwatched and automatic classification runs independently; Worlds/sagas remain based on real franchise metadata, not BE membership.
- Already saved: do not overwrite watched state, notes, classification or progress.
- Recently removed: prompt explicitly before restoring with existing state preserved; exclude from standard bulk selection.
- Partial errors: show added/already-present/failed counts truthfully and **Retry failed**. Do not roll back successes or silently add unverified titles.
- Pack updates do not automatically add, delete, reorder or mutate household records.

## 4. Data and content policy

BE audit at \`BenWassa/BE/docs/audits/002-editorial-audit-report.md\` (2026-11-05) found:
- \`data/master_top50.json\` has **50 unique title/year entries**, but **no TMDB provider IDs**.
- \`why_it_matters\` and first-party credit/genre fields are absent from all 50 canonical records; film-level evidence URLs are missing.
- Rankings are derived from three **AI-generated research lists**, not independent audience or critic consensus.
- The 50 historical films stop at 2019, and 12 comedy-adjacent films have editorial inclusion questions.
- BE's local poster and hero files lack per-asset provenance/licensing proof. Do not import them.
- BE original editorial content has separate **CC BY-NC-ND 4.0** terms; obtain appropriate rights/permission for reused or adapted written expressions and credit source as required.

### Pack manifest contract

A **separate curated-pack registry** is necessary even though saga catalogs exist. Schema proposal:

\`\`\`json
{
  "schemaVersion": 1,
  "id": "black-comedy-excellence",
  "type": "editorial-pack",
  "version": "1.0.0",
  "title": "Black Comedy Excellence",
  "subtitle": "A curated journey through Black-led comedy cinema.",
  "source": {
    "repository": "BenWassa/BE",
    "commit": "<PINNED_BE_SHA>",
    "rightsApproval": "<APPROVAL_REFERENCE>"
  },
  "featuredEditorialIds": ["be-film-0001"],
  "chapters": [
    {
      "id": "comedy-icons",
      "title": "Comedy Icons",
      "editorialIds": []
    }
  ],
  "entries": [
    {
      "editorialId": "be-film-0001",
      "title": "Coming to America",
      "year": 1988,
      "type": "movie",
      "provider": "tmdb",
      "providerId": "<VERIFIED_NUMERIC_TMDB_MOVIE_ID>",
      "chapterId": null,
      "notes": [],
      "citations": []
    }
  ]
}
\`\`\`

These are **placeholders, not working provider IDs or approved content**. Pin original BE source and curated-pack versions separately. Stable TMDB movie identities are required before publishing any entry. A metadata refresh may update poster/overview but must not change the reviewed identity. Maintain separate edition/attribution/review logs under \`docs/collections/curated-packs/\`.

### Editorial delivery packet

Before UI release:
1. Source and candidate audit: freeze source BE commit, confirm catalog 50 and editorial inclusion policy with BE's outstanding issue #5.
2. Film identity ledger for every published entry: \`editorialId, title, sourceYear, tmdbMovieId, checkedTitle, checkedYear, reviewer, checkDate, exceptions, status\`.
3. Chapter map: each approved film assigned to one primary theme; annotate ambiguous borderline films, document chapter size and avoid duplication.
4. Curated featured subset and chapter intro copy: original writing with editorial rationale (not AI consensus copy).
5. Film notes: only when individual historical/context statements have traceable citation URLs and rights approval; otherwise leave notes blank.
6. Brand/content permission, correct credit for BE and rights-cleared use of TMDB posters, no borrowed BE cover files.
7. Accessibility/performance review; only after content approval request separate **owner design direction** for possible future generated BE cover.

## 5. Engineering touchpoints

| Area | Specification |
|---|---|
| \`src/views/components/tonight/CollectionsRail.jsx\` | Accept separately registered \`editorialPacks\`; render BE alongside saga cards, pinned first; do not return null when sagas=0 and packs>0; preserve existing saga sorting and Worlds exclusion |
| \`src/views/TonightView.jsx\` | Supply approved pack registry, pack navigation callback and current household items; retain Collections rail placement above Classics; no pack API calls for Tonight first paint |
| \`src/views/CollectionsBrowseView.jsx\` | All collections index gains \`Curated collections\` then \`Sagas\`; World pages unchanged |
| \`src/components/cards/CuratedPackCard.jsx\` (new) | 2:3 title-forward cover, fallback typography, distinct \`editorial-pack\` type, no saga progress UI, accessible title/button |
| \`src/views/CuratedPackPage.jsx\` (new) | Full-page editorial hero, featured shelf, chapter navigator, All films, owned/unowned details, optional multi-select |
| \`src/App.jsx\`, \`src/app/useViewHistory.js\` | New full-page view route, correct Android/browser back and Tonight scroll/focus restoration; or equivalent verified history-backed overlay behavior |
| \`src/config/curatedPacks.js\`, \`src/data/curatedPacks/*\` (new) | Approved versioned static manifest, dynamic import, feature flag; no private BE runtime fetch or secret |
| \`src/domain/curatedPacks/{schema,matching,chapters}.js\` (new) | Strict schema/identity/deduplication, chapter membership and shelf-status selectors; no saga/World pollution |
| \`src/app/useAppState.js\` / extracted pack add service | Validated single/bulk add that **never** writes unmatched titles, uses TMDB details + transactional Firestore add |
| \`src/services/mediaApi/client.js\`, \`src/domain/media/schema.js\`, \`src/services/firebase/watchlist.js\` | Reuse existing methods; preserve \`added/exists/restored\` accuracy and activity semantics |
| \`src/views/AddView.jsx\`, \`src/views/ImportModal.jsx\` | **No new entry, CTA, or pack flow**; leave existing behavior unchanged |
| \`src/template/*\` | Pack must show in demo/test fixtures with ephemeral state, or be explicitly disabled with no inert/failed CTA |

### Important implementation safeguards
- Current catalog provider ID is stored as \`tmdb:<numericId>\` for watchlist and \`tmdb:movie:<id>\` for classifier identity. Do not change persisted key solely for packs.
- Exact TMDB movie identity must be validated before add. No fuzzy title/year fallback; block mismatch/unverified IDs.
- Existing generic import path can save unmatched entries; a pack must use an isolated strict verifier.
- \`addWatchlistItem\` can return \`restored\` for removed items; only permit this after **explicit** Restore confirmation. Recheck in the transaction and account for races with the active household snapshot.
- \`additionOrigin='import'\` is supported and safer than inventing a third origin without a coordinated write/activity model migration.
- Only user-selected films added to the shared library. No separate pack records, automatic bulk save or personal progress sync.
- Sequential/bounded verification with provider 429 backoff; no 50 eager detail requests on opening Tonight or Pack.
- Interruption or space switch stops pending work; existing successes retained, no cross-space writes.

## 6. Acceptance and QA

### Navigation and UI
- [ ] BE appears **in the existing Tonight Collections rail** and never as an Add entry.
- [ ] BE visible with **0 owned films**, including an empty-library fixture, and doesn't suppress other Tonight elements.
- [ ] One tap from BE rail card opens **full-page** BE experience, not saga dialog or import wizard.
- [ ] All collections includes a separate **Curated collections** group; existing sagas remain visible; Worlds unchanged.
- [ ] 2:3 cover fallback remains attractive and legible **without generated art**.
- [ ] 320/360/390/448px, portrait/landscape and larger screens: accessible poster/card density, no overflow.
- [ ] Keyboard, screen reader, correct back/escape/focus, Pixel back stack, and restoring same Tonight scroll position.
- [ ] No new rail, bottom-nav button or Tonight autoplay introduced.

### Editorial
- [ ] Every published item maps unambiguously to a reviewed TMDB movie ID.
- [ ] Content packet includes a source commit, license/rights review, featured list, chapter assignment and attribution.
- [ ] Any \`why it matters\` claim is sourced/approved; otherwise excluded.
- [ ] No AI-derived ranking or unsupported \`best of\` claim; no copied BE poster/hero assets.
- [ ] Film count reflects approved published list, not necessarily the source's 50 if exceptions remain.

### Save and reliability
- [ ] Unowned movie opens a provider-backed detail with Add to Library; owned movie opens normal details.
- [ ] Multi-select is opt-in, starts empty; only selected films are added.
- [ ] Existing/watched films never overwritten; duplicate and concurrent household additions handled via \`exists\`.
- [ ] Recently removed items only explicitly restored; expired restore window respected.
- [ ] Offline/429/404/provider mismatch/Firebase error: truthful partial results and retry of failures only.
- [ ] App can be closed/space switched mid-batch without silent later writes.
- [ ] Added movies flow into Hearth's current background classification and normal shelf; no invented World or saga identity.
- [ ] Pack update or feature disable doesn't remove saved films.

### Verification
- [ ] Add Vitest pure-module, UI interaction, Firestore mock and navigation/regression tests.
- [ ] Extend collection rail/index/empty-library tests, including **zero-saga + one-pack** scenario.
- [ ] Existing saga, World, import and classification tests unchanged or passing with justified updates.
- [ ] Run \`npm run lint\`, \`npm run test:unit\`, \`npm run test:api\`, \`npm run build\` in implementation PR, report actual outcomes; no tests claimed passed during planning.

## 7. Phases and dependencies

**Phase 1 — Content & structure (next):** Freeze BE source; draft content architecture; test chapter assignments and hero structure with text-first design; prepare identity/provenance ledger; obtain editorial/legal approvals.

**Phase 2 — Product UI design:** Two or three wireframe variations at 390px and navigation walk-through; pick page hierarchy, shelf density, film-detail layout and textual identity. **No cover image generation yet.**

**Phase 3 — Infrastructure:** Versioned pack registry + strict identity mapping, pack rail card, full-page route, sourced film details, exact-match transaction add.

**Phase 4 — Quality and release:** Complete BE catalog review, test synthetic/approved fixtures, validate responsive/back/accessibility/performance, obtain owner sign-off, activate feature flag.

**Phase 5 — Optional scale:** Only after multiple mature packs, consider a separate Curated Collections Tonight rail. Evaluate actual rail crowding/navigation; never show identical packs twice on Tonight.

**Dependencies:** BE audit #2, canonical data #5 and rights review #12; Hearth classification #20/#21, Pixel navigation #22, recently removed #39. Respect Hearth \`PRODUCT.md\`, \`DESIGN.md\`, \`DESIGN.json\`, \`COLLECTIONS_REDESIGN.md\`.

**Rollback:** Disable curated pack in registry; keep movies users already chose to save. The existing saga/World Collection rails remain unaffected.

## 8. Related detailed content packet

See [BE content/design blueprint](../collections/curated-packs/BLACK_COMEDY_EXCELLENCE_BLUEPRINT.md). It contains working copy, chapter candidates, content review checklist and proposed UI hierarchy. All editorial descriptions and placements are drafts until reviewed; no artwork is generated in this phase.

## 9. Scoping status

- [x] Owner-approved correction: **Tonight Collections rail + full-page collection**, not Add.
- [x] Current repo's saga rail and All collections rendering reviewed.
- [x] Technical design for separate editorial pack type and zero-owned display.
- [x] Editorial framework and specific first-pass example films proposed.
- [x] Generated-cover decision explicitly postponed.
- [ ] Source attribution/rights and TMDB ID mapping not complete.
- [ ] No code implementation, runtime tests, UI artwork or release.
