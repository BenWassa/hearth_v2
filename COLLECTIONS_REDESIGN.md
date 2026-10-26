# Collections: Worlds on Tonight

Implemented from [Issue #6](https://github.com/BenWassa/hearth_v2/issues/6), its [approved classification decisions](https://github.com/BenWassa/hearth_v2/issues/6#issuecomment-6402151427), and the user's subsequent navigation correction. Reviewed 2026-10-26.

## Navigation

**Tonight → World → saga → film.** Every represented World appears directly in Tonight's Collections section as a compact two-column grid of text-only tiles (an odd last tile spans both columns) placed after the first suggestion rail so decision content comes first, each a deep muted textured fill (CSS only, one recipe, hue from the World's config tint). Further down, a finite, non-looping **Collections** row sits directly above The Classics (and still shows when Classics is absent): every eligible saga, including sagas in no World, as poster cards in recent-activity order with no counts, ending with a neutral **All collections** tile (only when more than three sagas exist) that opens the full index. There is no Browse-all link. There is no two-World cap, activity gate, five-saga threshold or singleton bypass. Even a World with one saga opens its World page. Empty, unrepresented Worlds are omitted.

World pages open with edge-to-edge artwork and the World title only (counts are screen-reader context, not visible), then one finite horizontal poster shelf per saga (owned films only; the saga with a real next action uses larger posters), then Other films, Shorts & specials and TV series shelves when supplied metadata supports them. World pages have no search, sort, refresh or chips: shelves are the navigation, and the shelf headings are just the saga name. A World with a single saga hides that duplicate heading and keeps a quiet 'Saga details' control. The featured shelf may carry a 'Next up: <film>' line from data already on the shelf. Sagas outside any World are found in the All collections index. Films without sequels are not invented sagas. Back from a World opened on Tonight returns directly to the same Tonight tile; The All collections index is reached only from the Tonight Collections row.

The full index is deliberately plain: a back control and the title, then every eligible saga (including ungrouped ones) as a row with a short progress line, in recent-activity order fixed for the visit. It has no search, sort, refresh, count or Worlds grid for now; the pure search and sort helpers remain in the domain code, unused by the UI. Opening film details leaves the saga mounted underneath, so closing the film restores focus and scroll to the same saga control. Escape dismisses only the top dialog. New controls are at least 44px high; No additional dock tab is introduced. The Tonight Collections row and the World-page poster shelves are the only horizontal rails here; each is finite and bounded (no looping, cloned cards, autoplay or infinite scroll).

## Four distinct decisions

1. **Membership:** preserve canonical TMDB collection metadata on a film.
2. **World affiliation:** a versioned editorial collection/movie-ID mapping or validated explicit World metadata assigns a primary brand group.
3. **Collection eligibility:** the curated recognized-franchise catalog alone determines first-class saga visibility. There is no household Show/Hide control.
4. **Activity relevance:** meaningful watch/add events order browsing within the stable visit. Relevance never removes a represented World from Tonight.

`src/config/collectionCatalog.js` and `src/domain/media/collectionEligibility.js` are the pure classification boundary. Provider size, ratings, corporate ownership and raw title matching never promote a card. Missing metadata and unknown collections default safely to individual shelf films.

Approved examples include Avengers, Harry Potter, Fantastic Beasts, Skywalker Star Wars, Star Trek reboot, Narnia, Knives Out, Dune (2021), Toy Story, James Bond, Fast & Furious, Dark Knight and Back to the Future. Fast & Furious, Dark Knight and Back to the Future can qualify with one owned feature. Paddington and Ghostbusters are hidden by default even when multiple features are owned, unless the household overrides. James Bond is an anthology: Explore films replaces an invented Next up order.

## Household preferences (dormant)

There is no UI for household Show/Hide overrides, and the app opens no Firestore listener or read for them, so Collections never waits on, or fails because of, preference loading. Sagas and Worlds render immediately from the editorial catalog. The earlier backend (`useCollectionPreferences`, `services/firebase/collectionPreferences`, the `collection_preferences` block in `firestore.rules`, the emulator script and their tests) is intentionally left in the repository, unused, pending a decision to delete it.

## Worlds and truthful counts

The catalog supports Wizarding World, Marvel, Star Wars, Pixar, Disney, DC, DreamWorks Animation and Studio Ghibli. Disney means traditional Disney films, not every Disney-owned brand. Avengers is one child saga of Marvel; Dark Knight is a child of DC. Existing Disney IDs remain stable. Standalone affiliations use verified movie IDs or validated optional World IDs, never company-name guessing.

Canonical provider/type identities deduplicate shelf records. Explicit shorts/specials/compilations and positive runtimes <=40 minutes are excluded from feature progress; runtime is a fallback heuristic and unknown runtime is not proof of a short. Features, watched features, shorts and TV have separate counts. World membership does not create sequel relationships.

Saga details distinguish owned features from provider listings. Provider shorts have a separate section and retain correct shelf ownership. Unknown provider format metadata is labeled as provider-listed films rather than a certified feature total. Missing provider data retains the household shelf; unknown totals never imply franchise completion or an owned next film. Opening another saga never briefly exposes the previous saga's provider parts.

## Activity, stability and providers

Movie unwatched→watched transitions transact against the current shared record and set `userState.markedWatchedAt`; undo clears it, and repeated same-status writes preserve it. `additionOrigin` distinguishes manual adds from imports. No historical watch dates are backfilled. Notes, refreshes, ratings, TV progress and general updatedAt do not create saga freshness.

Browser order uses meaningful last-event time with alphabetical/ID fallback. World relevance uses the most recent child/shelf activity, not a size-biased sum. Positions freeze while browsing; progress and removals update live, and re-entering incorporates newer ordering. The pure activity-ranking functions remain tested, but Tonight renders Worlds rather than a capped saga recommendation preview.

Tonight performs no provider-count fan-out for classification or World counts. Saga metadata is requested on demand. Backend collection-part hydration is capped at three, retains partial base metadata on individual failures, and never falls back from a missing movie ID to an unrelated TV show. The optional small-saga count helper also retains its three-request FIFO/cache, but only certifies a feature count when format metadata supports it.

## Artwork and validation

Saga rows use existing TMDB collection artwork, lazy loading and w300 thumbnail crops. Tonight World tiles are text-only; the supplied World artwork is used only at the top of a World page (natural 16:9, with a live heading and a text-only fallback if the image fails). No scraped Disney+ promotional art or imitation logos. TMDB imagery follows the app's existing attribution and terms.

Synthetic demo scenarios are available at `?demo=1&collectionsFixture=25` (also 0/1/50), with optional `dispersedWorlds=1`. Large/dispersed scenarios exercise unclassified metadata candidates rather than forcing them into an invented World. No household export or private watch history is used. See [validation, emulator checks and captures](docs/collections/VALIDATION.md) for final results and limitations.
