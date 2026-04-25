# Collections — Full Series Discovery

## Context

The current CollectionsRail only surfaces a collection if the user has 2+ movies from it already. That means someone who adds *A New Hope* won't see a Star Wars collection card, and even if they open the collection modal they only see their own items — no way to discover the rest of the saga.

The goal is to make collections a discovery surface: lower the rail threshold to 1, fetch the full TMDB series on modal open, show unowned films greyed-out with an add-button, and group big franchises by TMDB sub-collections where they exist (Star Wars Original Trilogy, etc.).

---

## What Changes

### 1. Lower collection rail threshold: 2 → 1

**File:** `src/domain/media/collections.js` — `buildCollectionRollups()` line 57

```js
// Before
if (groupItems.length < 2) return;

// After
if (groupItems.length < 1) return;   // i.e. remove the guard entirely (length is always ≥1)
```

Actually: remove the `< 2` guard so any single movie that has a `belongs_to_collection` produces a rollup.

The rollup object also needs a `totalCount` that reflects the full TMDB series, not just owned items — that comes from the fetch below.

---

### 2. Fetch full TMDB collection on modal open (lazy)

**New hook:** `src/hooks/useCollectionDetails.js`

```js
// Fetches /api/media/tmdb/collection/[id] when triggered
// Returns { data, loading, error }
// data = { parts: [...], subCollections: [...] }
```

Wire it into `CollectionDetailsModal`: call the hook with `collection.collection.providerId` when `isOpen` becomes true. Show a loading skeleton in the body until resolved.

**Existing endpoint** `api/media/[provider]/collection/[id].js` already handles this — no backend changes needed.

---

### 3. Enrich CollectionDetailsModal with full series + unowned films

**File:** `src/components/CollectionDetailsModal.jsx`

Current: renders `collection.items` (only owned watchlist items).  
New: merges owned items with the TMDB parts list.

```
ownedIds = Set of tmdb IDs from collection.items
fullParts = data.parts from TMDB fetch

displayItems = fullParts.map(part => {
  owned = ownedIds.has(part.id)
  return { ...part, owned, watchlistItem: owned ? match : null }
})
```

Rendering:
- **Owned items**: same as today (watched badge, queue number, clickable to detail modal)
- **Unowned items**: greyed-out poster (opacity-40 or similar), no queue number, library icon (`Library` from lucide) + small `+` badge in top-right corner
- Tapping an unowned item → calls `onOpenItem` with the mapped media object (same as opening a search result), which triggers the existing item detail modal/add flow

Progress bar: stays based on owned + watched count vs owned total (not the full series length — that would make it feel impossible).

---

### 4. Sub-collection grouping via TMDB (Star Wars, Star Trek, etc.)

**Backend — `api/_lib/providerClient.js` `getCollection()`:**

TMDB's `/collection/{id}` response includes `parts`, each of which may itself have a `belongs_to_collection` pointing to a *sub-collection* (e.g. "Star Wars Original Trilogy Collection"). Enhance `getCollection` to:
1. Detect if any parts have a different `belongs_to_collection` than the parent
2. If sub-collections exist, group `parts` by sub-collection, fetch sub-collection names, return `subCollections: [{ id, name, parts: [...] }]`
3. If no sub-collections detected, return `subCollections: []` and `parts` flat as today

This is fully deterministic — no curation file needed. TMDB's own data drives it.

**Frontend — CollectionDetailsModal:**

If `data.subCollections.length > 0`, render rows per sub-collection instead of the flat grid:

```
[Sub-collection header: "Original Trilogy"]
[poster grid]

[Sub-collection header: "Prequel Trilogy"]  
[poster grid]
```

Each sub-collection header uses the same `text-[10px] font-bold uppercase tracking-[0.22em]` style already in the modal.

If no sub-collections (most franchises), flat grid as today.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/domain/media/collections.js` | Remove `< 2` guard; single-item collections now produce rollups |
| `src/components/CollectionDetailsModal.jsx` | Accept `onAddItem` prop; merge TMDB parts with owned items; render unowned greyed-out with add icon; render sub-collection rows when present |
| `api/_lib/providerClient.js` | Enhance `getCollection()` to detect and group TMDB sub-collections |

## New File

| File | Purpose |
|------|---------|
| `src/hooks/useCollectionDetails.js` | Lazy-fetch `/api/media/tmdb/collection/[id]` on trigger; returns `{ data, loading, error }` |

## Integration Points (no change needed)

- `api/media/[provider]/collection/[id].js` — existing endpoint, used as-is
- `src/views/TonightView.jsx` — passes `onOpenItem` down; needs `onAddItem` prop threaded to `CollectionDetailsModal`
- `src/views/components/tonight/CollectionsRail.jsx` — no change needed

---

## Verification

1. Add a single MCU film → confirm a collection card appears in CollectionsRail
2. Open that collection → loading state appears briefly, then full series renders
3. Unowned films are visibly greyed-out with library+plus icon in top-right
4. Tapping an unowned film opens the item detail modal with Add to Watchlist option
5. For a Star Wars or Star Trek item: open collection, confirm sub-collection headers appear (Original Trilogy, etc.)
6. For a simple collection (e.g. Before Sunrise trilogy): flat grid, no headers
7. Progress bar reflects owned+watched / owned total — not penalised by unowned films
8. Run `collections.test.js` — existing tests should still pass after threshold change
