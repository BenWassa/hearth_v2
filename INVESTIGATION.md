# Invincible Disappearance — Investigation & Fix Log

## Background

`Invincible` was not deleted. It remained in Firestore and duplicate detection correctly blocked re-adding it, but the UI had hidden-state bugs that made a persisted title disappear from both Shelf and Tonight.

---

## Fixes Applied

### `7efda91` — Keep watching titles visible on shelf

**File:** `src/views/ShelfView.jsx`

`libraryItems` previously filtered to `status === 'unwatched'` only. Shows moved to `watching` (via episode progress) were excluded from the Shelf's Library tab entirely.

**Fix:** Changed the filter to exclude only `status === 'watched'`, so both `unwatched` and `watching` items remain visible in Library.

---

### `ab11645` — Prevent hidden in-progress titles

**Files:** `src/views/ShelfView.jsx`, `src/views/TonightView.jsx`

Two separate paths:

**Shelf — items with no vibe/energy silently dropped from groups**

`buildGroupedItems` pushed items into a group keyed by `item.vibe` or `item.energy`. If either field was missing or unrecognised, `groups[undefined]` silently dropped the item. No group was rendered, so the title vanished from the UI even though it existed in Firestore.

Fix: added a `FALLBACK_VIBE_GROUP` / `FALLBACK_ENERGY_GROUP` (`'ungrouped'`) bucket. Items with no matching tag land there and render under an "Unsorted" header.

**Tonight — `watching` shows with sparse episode progress omitted from "Currently Watching"**

`currentlyWatchingShows` required `Object.values(episodeProgress).some(Boolean)` before it would include a show. A show where all progress values are `false` (or the object is empty) failed this check and was excluded. Adding an early-return `if (status === 'watching') return true` ensures any show explicitly marked `watching` always appears in the row.

---

## Remaining Issues

### 1. Race condition in `subscribeWatchlist` (High)

**File:** `src/services/firebase/watchlist.js:294–328`

Every Firestore `onSnapshot` fires an async `Promise.all` that fetches catalog docs for every item. If two snapshots arrive in quick succession, the second `Promise.all` can resolve before the first, and `onNext` is called with stale data. An item that exists in Firestore can be transiently absent from the rendered list. A single catalog `getDoc` failure also rejects the whole `Promise.all`, replacing the entire item list with an error state.

**Fix needed:** Track a generation counter inside the snapshot handler. Discard `Promise.all` resolutions that belong to a superseded snapshot. Alternatively, catch per-item catalog errors and fall back to the watchlist-only data rather than rejecting the whole batch.

---

### 2. Duplicate `isShowFullyWatched` implementations (High)

**Files:** `src/app/useAppState.js:78–97`, `src/views/TonightView.jsx:28–46`

Both define the same function independently. If one is updated and the other is not, a show can be considered complete in one place and in-progress in another — causing it to flip between "Currently Watching" and absent. `isEpisodeWatched` already lives in `src/components/ItemDetailsModal/utils/showProgress.js`; the shared completion check should live there too.

**Fix needed:** Extract a shared `isShowFullyWatched(item)` into `showProgress.js` and import it in both `useAppState.js` and `TonightView.jsx`.

---

### 3. `watching` shows absent from suggestion rows (Medium)

**File:** `src/views/TonightView.jsx:165–168`

All thematic suggestion rows (Easy & Comforting, Quick Bites, Deep Dives, etc.) source from `items.filter(i => i.status === 'unwatched')`. A show in `watching` state won't appear in any suggestion row, only in "Currently Watching." A title that landed in `watching` due to the sparse-progress bug would have been absent from both sections before `ab11645`.

**Fix needed:** Decide explicitly whether in-progress shows should appear in suggestion rows. If yes, change the `unwatched` filter to include `watching`. If no, document the intent so the rule is enforced deliberately.

---

### 4. Re-add merge does not clear `episodeProgress` (Medium)

**File:** `src/services/firebase/watchlist.js:337`

`addWatchlistItem` uses `batch.set(watchRef, payload, { merge: true })`. If duplicate detection fails (client-side `items` list is stale during a fast double-add), a re-add merges into the existing doc. The existing `episodeProgress` is not cleared. On the next episode-progress write, `handleUpdateItem` auto-computes `status: 'watching'` from the stale progress, immediately re-entering the in-progress state.

**Fix needed:** Either use `set` without `merge` for the watchlist doc on add (overwrite), or explicitly include `episodeProgress: {}` in the add payload to reset it.

---

### 5. No path to reset a `watching` show to `unwatched` (Low)

**File:** `src/app/useAppState.js:1365–1392`

`handleMarkWatched` toggles between `watched` and `unwatched`. From `watching`, toggling forward to `watched` is blocked for shows that aren't fully watched. There is no UI path to reset a partially-watched show back to `unwatched` without manually unchecking every episode. A show stuck in `watching` can only go to `watched` (blocked) or stay `watching`.

**Fix needed:** Allow toggling a `watching` show back to `unwatched` via a long-press, swipe action, or explicit reset option in the detail modal.
