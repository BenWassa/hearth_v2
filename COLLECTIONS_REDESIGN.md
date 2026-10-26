# Collections: Worlds on Tonight

Implemented from [Issue #6](https://github.com/BenWassa/hearth_v2/issues/6), its [approved classification decisions](https://github.com/BenWassa/hearth_v2/issues/6#issuecomment-6402151427), and the user's subsequent navigation correction. Reviewed 2026-10-26.

## Navigation

**Tonight → World → saga → film.** Every represented World appears directly in Tonight's Collections section as a finite two-column set of artwork/typographic tiles. There is no two-World cap, activity gate, five-saga threshold or singleton bypass. Even a World with one saga opens its World page. Empty, unrepresented Worlds are omitted.

World pages list child sagas, then separate Other films, Shorts & specials and TV series sections when supplied metadata supports them. Films without sequels are not invented sagas. Back from a World opened on Tonight returns directly to the same Tonight tile; All collections provides an alternative searchable full index. Worlds entered through that overview return to its saved scroll and tile focus.

The full browser retains name search, Recently active/A–Z, all eligible sagas (including ungrouped ones), and Manage sagas. Search ignores case, diacritics and a trailing Collection suffix. World search includes its standalone films and other sections. Opening film details leaves the saga mounted underneath, so closing the film restores focus and scroll to the same saga control. Escape dismisses only the top dialog. New controls are at least 44px high; no horizontal Collections carousel or additional dock tab is introduced.

## Four distinct decisions

1. **Membership:** preserve canonical TMDB collection metadata on a film.
2. **World affiliation:** a versioned editorial collection/movie-ID mapping or validated explicit World metadata assigns a primary brand group.
3. **Collection eligibility:** a curated recognized-franchise default plus a persistent shared household Show/Hide override determines first-class saga visibility.
4. **Activity relevance:** meaningful watch/add events order browsing within the stable visit. Relevance never removes a represented World from Tonight.

`src/config/collectionCatalog.js` and `src/domain/media/collectionEligibility.js` are the pure classification boundary. Provider size, ratings, corporate ownership and raw title matching never promote a card. Missing metadata and unknown collections default safely to individual shelf films; Manage sagas can explicitly show a collection with a valid canonical ID and feature film.

Approved examples include Avengers, Harry Potter, Fantastic Beasts, Skywalker Star Wars, Star Trek reboot, Narnia, Knives Out, Dune (2021), Toy Story, James Bond, Fast & Furious, Dark Knight and Back to the Future. Fast & Furious, Dark Knight and Back to the Future can qualify with one owned feature. Paddington and Ghostbusters are hidden by default even when multiple features are owned, unless the household overrides. James Bond is an anthology: Explore films replaces an invented Next up order.

## Shared household preferences

`artifacts/{appId}/spaces/{spaceId}/collection_preferences/{provider:collectionId}` stores `{ visible: boolean, updatedAt: server timestamp }`. Absence is the editorial default; false is explicit Hide; resetting deletes the preference. Existing trusted space membership controls access. Keys, field names, types, size and timestamps are validated identically for create/update. Realtime snapshots share changes across members; stale household responses cannot cross spaces.

Manage sagas includes hidden metadata candidates so a user can reverse Hide. Loading does not flash editorial defaults before saved preferences arrive. Read/write errors are shown and failed writes never pretend success. Template preferences are isolated in session memory and never write to a connected household. Source rules and emulator tests are included; **rules must be deployed with a future reviewed release**, not during this implementation.

## Worlds and truthful counts

The catalog supports Wizarding World, Marvel, Star Wars, Pixar, Disney, DC, DreamWorks Animation and Studio Ghibli. Disney means traditional Disney films, not every Disney-owned brand. Avengers is one child saga of Marvel; Dark Knight is a child of DC. Existing Disney IDs remain stable. Standalone affiliations use verified movie IDs or validated optional World IDs, never company-name guessing.

Canonical provider/type identities deduplicate shelf records. Explicit shorts/specials/compilations and positive runtimes <=40 minutes are excluded from feature progress; runtime is a fallback heuristic and unknown runtime is not proof of a short. Features, watched features, shorts and TV have separate counts. World membership does not create sequel relationships.

Saga details distinguish owned features from provider listings. Provider shorts have a separate section and retain correct shelf ownership. Unknown provider format metadata is labeled as provider-listed films rather than a certified feature total. Missing provider data retains the household shelf; unknown totals never imply franchise completion or an owned next film. Opening another saga never briefly exposes the previous saga's provider parts.

## Activity, stability and providers

Movie unwatched→watched transitions transact against the current shared record and set `userState.markedWatchedAt`; undo clears it, and repeated same-status writes preserve it. `additionOrigin` distinguishes manual adds from imports. No historical watch dates are backfilled. Notes, refreshes, ratings, TV progress and general updatedAt do not create saga freshness.

Browser order uses meaningful last-event time with alphabetical/ID fallback. World relevance uses the most recent child/shelf activity, not a size-biased sum. Positions freeze while browsing; progress and removals update live, and explicit refresh/entry incorporates newer ordering. The pure activity-ranking functions remain tested, but Tonight renders Worlds rather than a capped saga recommendation preview.

Tonight performs no provider-count fan-out for classification or World counts. Saga metadata is requested on demand. Backend collection-part hydration is capped at three, retains partial base metadata on individual failures, and never falls back from a missing movie ID to an unrelated TV show. The optional small-saga count helper also retains its three-request FIFO/cache, but only certifies a feature count when format metadata supports it.

## Artwork and validation

Saga rows use existing TMDB collection artwork, lazy loading and w300 thumbnail crops. Original warm geometric/typographic World covers support optional supplied licensed covers and preserve their text fallback on image failure. No scraped Disney+ promotional art or imitation logos. TMDB imagery follows the app's existing attribution and terms.

Synthetic demo scenarios are available at `?demo=1&collectionsFixture=25` (also 0/1/50), with optional `dispersedWorlds=1`. Large/dispersed scenarios exercise unclassified metadata candidates rather than forcing them into an invented World. No household export or private watch history is used. See [validation, emulator checks and captures](docs/collections/VALIDATION.md) for final results and limitations.
