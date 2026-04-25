# Collections — Significance Filtering & Sorting

## Context

The CollectionsRail is showing every movie with a `belongs_to_collection` field, producing noise: 2-film duologies, minor Pixar spinoffs (Cars), and many similar Disney franchises all get equal billing alongside major sagas. The goal is to surface only meaningful franchises (3+ films total) and sort them by significance so Star Wars, MCU, and Star Trek appear first — without any manual curation file.

Decisions:
- **Threshold**: TMDB collection must have ≥ 3 films total; user only needs 1 film to trigger it
- **Significance**: Use TMDB `popularity` score averaged across a collection's parts (already available in watchlist item data via search mapping; need to capture it in detail mapping)
- **Disney**: No grouping umbrella — sort by significance descending so important franchises lead

---

## What Changes

### 1. Capture `popularity` on movie items already in the watchlist

**File:** `src/domain/media/collections.js`

Each watchlist item already has a `rating` (vote_average). TMDB also returns `popularity` on movie detail responses, but it's currently dropped in `mapMovieDetails`. 

**Option A (preferred — no backend change):** In `buildCollectionRollups()`, compute a proxy significance score from the data already on each item:
- Use `item.rating` (vote_average) as the proxy for franchise popularity
- Average `item.rating` across all items in the collection
- This avoids touching the API mapper and works with existing stored data

**Option B (richer but requires backend change):** Add `popularity` to `mapMovieDetails` in `api/_lib/mappers/mediaMapper.js` (line 68 area), persist it to the watchlist item, and use it in the rollup. More accurate TMDB signal.

**Decision: Use Option A** — `rating` is already available, avoids a data migration, and is a good proxy. Can always switch to raw popularity later.

---

### 2. Filter: require TMDB collection totalCount ≥ 3

**File:** `src/domain/media/collections.js` — `buildCollectionRollups()`

Currently `totalCount` on the rollup comes from TMDB collection parts count (set when the modal lazy-fetches). At rollup-build time, we only know the user's owned count — TMDB total isn't available without a fetch.

**Revised approach:** Filter on **owned count ≥ 1 AND known TMDB total ≥ 3, falling back to collection name heuristics.**

Actually — the simpler and correct implementation:
- The rollup object already stores `totalCount` which comes from the collection's `parts` length when fetched
- At build time (before any modal open), we only have owned items

**Best approach:** Store TMDB `parts` count on the rollup when it's already available (if the collection has been fetched before), and filter collections with `totalCount < 3` **at the CollectionsRail level** after the first load — OR, more practically, fetch collection metadata eagerly for all user collections (small N, cacheable).

**Simplest correct approach (no eager fetch required):**

Add a `minSeriesSize` filter in `buildCollectionRollups()` using a curated "small collections" concept — but since we don't want curation, use the TMDB parts count that's returned when the collection endpoint is called.

**Revised plan:** In `buildCollectionRollups()`, add a second pass that checks if we have cached TMDB data for the collection, and if that data shows `parts.length < 3`, suppress the rollup. For collections without cached data, include them (optimistic) and suppress later.

Actually the cleanest path:

**In `TonightView.jsx`:** After building rollups, for each collection call the collection endpoint (or use a cached response) to get `parts.length`. Filter out rollups where `parts.length < 3`. This is a lazy/cached async filter.

**Even simpler — add a new field to rollup:** After `buildCollectionRollups()` runs in `collections.js`, add a `tmdbTotalCount` field that gets populated when `useCollectionDetails` data is available, and hide collection cards that have `tmdbTotalCount < 3` once fetched. Cards without data yet show optimistically.

**Final decision on approach:** 

The cleanest solution that requires no eager fetching is:
1. In `buildCollectionRollups()`, keep all collections with `items.length >= 1`  
2. Expose `tmdbTotalCount` on rollup (initially `null`)  
3. In `CollectionsRail`, each card fetches its TMDB count lazily via `useCollectionDetails` (already implemented from the prior plan)  
4. Cards where `tmdbTotalCount < 3` are filtered out (or hidden with a fade)

But this causes layout shift. Better: **batch-fetch all collection totals** in `TonightView` using a single effect, then filter.

**Pragmatic final approach:**
- Add a small lookup: for all user-owned collections, call `/api/media/tmdb/collection/[id]` once (cached 1hr) in `TonightView`
- Store results in state: `collectionTotals: Map<collectionKey, partsCount>`
- In the `collections` memo, filter rollups where `collectionTotals.get(key) !== undefined && collectionTotals.get(key) < 3`
- While totals are loading, show all (no flash of missing content — only hides after data arrives)

---

## Revised Simpler Plan (Final)

After reflection, the correct architecture is:

### Step 1 — Add significance score to rollup

**File:** `src/domain/media/collections.js` — `buildCollectionRollups()`

After computing rollup items, add:
```js
const avgRating = items.reduce((sum, i) => sum + (i.rating || 0), 0) / items.length;
rollup.significanceScore = avgRating;
```

### Step 2 — Sort rollups by significance

**File:** `src/domain/media/collections.js` — end of `buildCollectionRollups()`

Before returning the rollup array, sort descending by `significanceScore`:
```js
rollups.sort((a, b) => b.significanceScore - a.significanceScore);
```

### Step 3 — Filter by TMDB total ≥ 3 using existing lazy-fetch

**File:** `src/views/components/tonight/CollectionsRail.jsx` and/or `src/views/TonightView.jsx`

The `useCollectionDetails` hook (from prior plan) fetches full TMDB data per collection when the modal opens. We need to fetch collection totals eagerly — but only the `parts.length`, not the full modal data.

**New lightweight hook:** `src/hooks/useCollectionSizes.js`
- Takes an array of `{ collectionKey, providerId }` objects
- Batches fetch of `/api/media/tmdb/collection/[id]` for each (these are cached 1hr server-side)
- Returns `Map<collectionKey, partsCount>`

**In `TonightView.jsx`:**
```js
const rawCollections = useMemo(() => buildCollectionRollups(items).filter(e => e.type === 'collection'), [items]);
const collectionSizes = useCollectionSizes(rawCollections); // Map<key, partsCount>
const collections = useMemo(() => 
  rawCollections.filter(c => {
    const size = collectionSizes.get(c.id);
    return size === undefined || size >= 3; // optimistic: show until we know it's small
  }),
  [rawCollections, collectionSizes]
);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/domain/media/collections.js` | Add `significanceScore` (avg rating) to each rollup; sort rollups descending by score |
| `src/views/TonightView.jsx` | Wire `useCollectionSizes`; filter `rawCollections` to only collections where `tmdbTotal >= 3` |

## New File

| File | Purpose |
|------|---------|
| `src/hooks/useCollectionSizes.js` | Batch-fetches TMDB collection sizes for a list of rollups; returns `Map<id, partsCount>`; dedupes and respects cache |

## Unchanged

- `src/components/CollectionDetailsModal.jsx` — no change
- `src/hooks/useCollectionDetails.js` — no change
- `api/_lib/providerClient.js` — no change
- `api/media/[provider]/collection/[id].js` — no change (reused as-is)

---

## Verification

1. Open Tonight view with a watchlist that includes Cars and a 2-film series (e.g. Paddington) — confirm those collection cards disappear once sizes load
2. Star Wars, MCU, Star Trek should appear first in the CollectionsRail (sorted by avg rating of owned films)
3. A smaller but high-quality trilogy (Before Sunrise, avg ~7.9) should rank above a mediocre 5-film franchise
4. Collections not yet fetched from TMDB show optimistically, then hide if they resolve to < 3 films — no flash of disappearing cards on first load (fade-out transition preferred)
5. Run `collections.test.js` — the new `significanceScore` field should be present on rollups; existing tests should still pass
6. Add a test case: collection with 2 TMDB parts → filtered out after `useCollectionSizes` resolves
