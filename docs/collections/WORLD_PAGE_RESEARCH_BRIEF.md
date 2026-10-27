# Research brief: how streaming services design brand hub pages and franchise groupings

For an external researcher (human or agent). Returns a findings doc, not code.

## Why we need this

Hearth is a calm, shared movie watchlist for couples (mobile, 390px portrait, dark warm UI, used in a dim living room). Tonight shows six brand "Worlds" (Disney, Pixar, Marvel, DreamWorks, plus two adaptive from Star Wars, Wizarding World, DC, Studio Ghibli). Tapping a World opens a World page. We are redesigning that page and have not decided its structure.

Current World page, top to bottom:

1. Edge-to-edge 16:9 cover art, faded into near-black. The art already has the World name baked in (a big MARVEL wordmark, "PIXAR Animation Studios").
2. A live serif title with the World name, which repeats the art.
3. One horizontal poster shelf per saga (Avengers, Guardians of the Galaxy, Deadpool, ...). Each heading is a button with a `›` chevron that opens saga details.
4. Then Other films, Shorts & specials, TV series shelves when present.

Problems we see:

- Many sagas are short (1 to 3 films). By our estimate Marvel renders about 15 saga rows, 12 of them with 3 films or fewer. Disney would be 7 thin rows, Pixar 5 of 6, DC 3 of 3. A row of 1 to 3 posters looks sparse.
- The chevrons on every heading feel like noise.
- The title is redundant with the art, and nothing sits between the hero and the stack of rows to orient the user.

Our data is small and owned-only. A household owns a subset of films (their "shelf"). We show only owned films. A saga is a TMDB collection (for example Avengers, 4 films).

## Hard constraints (anything proposed must respect these)

- Finite, bounded content. No infinite scroll, no looping carousels, no autoplay, no auto-advance.
- No algorithmic recommendations, match percentages, "because you watched", ranked or explained picks.
- No gamification, counters that apply pressure, streaks, badges.
- Mobile first, 390px wide, 44px minimum touch targets.
- Artwork carries the drama. Interface chrome stays quiet.
- We can hand-curate data (editorial flags per saga). We cannot assume any live provider data beyond TMDB collection membership.
- Tonight already has a "Collections" poster rail and a World tile grid, so the World page should not duplicate those.

## What we already verified (Disney+, logged-out web pages, fetched 2026-10-26)

- Hub anatomy: hero carousel of featured titles, a featured mixed rail of about 10 tiles, evergreen rails (Pixar: Toy Story, Movies, Shorts, Originals; Marvel: MCU Infinity Saga, Multiverse Saga, Movie Timeline, Complete Timeline; Star Wars: Movies, Timeline Order, Series, Specials), curated theme rails (Marvel Monsters, Mutant Legacy, Oscar Winners), a Collections or Character Collections row of tiles that each open a sub-page, then long-tail rails (Documentaries, Shorts, Vintage).
- Rails are capped around 10 tiles. Marvel has about 14 rails.
- Small franchises get no rail of their own. Deadpool & Wolverine appears only inside Mutant Legacy and Fantastic Adventures. Guardians appears only inside Marvel Origin Stories. The Guardians sub-page has a hero plus one rail.
- Chronological order is its own rail, not a toggle.
- No film-count threshold was stated anywhere.

Sources: Disney+ web browse pages for Pixar, Marvel, Star Wars and Guardians, and the Disney+ app redesign article.

## What is NOT verified (please resolve)

1. What the Disney+ hub hero shows besides the title: description, Play, Watchlist, a featured title? (Logged-out pages only showed "Get Disney+".)
2. The Disney and DC hub structures, and Wizarding World on Max or Peacock.
3. Netflix, Apple TV, Max, Prime Video and Paramount+ brand or franchise page structure. Earlier searches returned nothing usable.
4. Mobile app layout, as opposed to the web layout.
5. How a sub-page for a collection or saga is built (hero, one rail, mixed with related material?) and how a user reaches it from a hub.
6. Any evidence of how services treat a franchise with 1 to 3 films versus 4 or more.

## Questions to answer

For each, give the pattern, which service(s) use it, a screenshot or link where possible, and your confidence.

1. **Hub page.** What is the top-to-bottom structure of a brand hub page on mobile for Disney+, Max, Apple TV, Prime, Netflix, Paramount+? What is in the hero?
2. **Small franchises.** When a franchise has 1 to 3 films, where does it appear? Merged into a themed or mixed rail, a tile that opens a page, or something else? Is there a visible saga label on mixed items?
3. **Big franchises.** What qualifies a franchise for its own rail or its own page? What do they show on that page?
4. **Saga entry point.** How does a user get from a poster or rail to "all the films in this saga"? Chevron on the heading, "See all", a collection tile, the title detail page, something else?
5. **Order.** Release order versus chronological or timeline order: how is it offered (separate rail, toggle, tab) and for which franchises only?
6. **Grids versus rails.** Do any services use a poster grid (not a horizontal rail) for brand or franchise pages? When?
7. **Hero.** What do heroes carry when the art already contains the brand name? Featured title, one line of copy, a primary action, or nothing?
8. **Non-streaming references.** Any good examples from Letterboxd lists, Plex or Jellyfin collections, Apple TV app franchise pages, or Criterion Channel for a finite, calm, poster-forward franchise page?

## Output format

A markdown doc of at most 1,200 words:

- A comparison table: service, hub anatomy, small-franchise treatment, saga entry point, hero content.
- The 3 to 5 patterns you would recommend for Hearth's constraints, with reasons, ranked.
- For each unverified item above: resolved, or still unknown and why.
- Links and screenshots for every claim. Mark anything inferred rather than observed.
- Do not recommend features outside the hard constraints. If the best pattern breaks one, say which constraint and how.

---

# Findings (returned 2026-10-26 by external researcher)

Not independently verified by us. Confidence labels are the researcher's. Images referenced in the original (Disney+ brand page, Max DC hub, Plex collection details, Peacock Harry Potter) were not captured here; re-fetch from the sources if needed.

## Executive finding

Distinguish a World from a saga. A World is a branded browsing destination; a saga is a finite group of related films. The strongest reference is Disney+'s brand landing page, supported by Apple's collection navigation and owned-library systems such as Plex. Suggested World page: a branded hero, a small number of meaningful groupings, direct access to individual films.

Verified detail: Disney+'s official mobile brand-page screenshots show the Disney logo embedded in the hero artwork, followed immediately by an Originals shelf. No second live page title, description or Play button. These are historical promotional assets, not proof of the October 2026 interface.

## Service comparison

Confidence: High = official source or directly inspectable page; Medium = documented behaviour without a complete mobile view; Low = older screenshot or inference.

| Service | Hub anatomy | Small franchises and saga entry | Hero content | Confidence |
|---|---|---|---|---|
| Disney+ | Brand artwork, mixed/featured rails, thematic rails, collection tiles, long-tail shelves | Small sagas appear in mixed rails; collection tiles lead to sub-pages. No universal threshold observed | Brand logo within artwork on documented mobile hub; no duplicate title or CTA | High for historical layout; Medium for 2026 |
| Max / HBO Max | Categories, Brand Spotlight, DC/Harry Potter destinations | Franchise-level treatment not fully established | Older DC screenshot shows logo, artwork and category tabs | Medium for entry; Low for current layout |
| Apple TV app | Featured area, curated horizontal shelves, individual collection pages | Tapping a row title opens its contents; Star Wars has a dedicated collection URL | Featured-title art in main app; franchise hero unknown | High for navigation; Low for franchise anatomy |
| Prime Video | Navigation, featured hero, categorized rails including subscription destinations | Franchise grouping and entry unverified | Title artwork, subscription indicators, primary action | High for general UX; Low for franchise hubs |
| Netflix | Home and category filters, title shelves, title details | No consistent franchise-hub structure verified | Featured title on main browsing surfaces | High for mobile navigation; Low for saga treatment |
| Paramount+ | Featured carousel, brand destinations, genre shelves, A-Z browsing | Star Trek content shown in poster grids; saga entry unverified | Featured-title artwork | Medium for general layout; Low for franchise UX |
| Peacock | Dedicated Harry Potter web page: artwork, collection heading, eight film entries | Direct collection URL and individual film links | Logo, short copy, subscription CTA | High for public web; app unknown |

## Patterns observed

- **Small vs large franchises.** Disney+'s Marvel rails absorb smaller franchises into larger themes. Plex has the clearest explicit threshold: auto-create collections at 1, 2, 3 or 4 owned films. That is a product setting, not an industry rule.
- **Saga entry.** Apple documents tapping shelf headings to see all items. Plex lets collection posters open collection-detail pages and exposes related collections from film detail pages. These are alternatives to chevrons on every heading.
- **Ordering.** Disney+ keeps separate movie-timeline and complete-timeline groupings for Marvel; Star Wars separates chronology from release order. This is curated franchise knowledge, not derivable from TMDB collection membership.
- **Poster grids.** Plex supports poster grids and collection-detail pages. Letterboxd curated lists are another finite, poster-forward reference. More applicable to an owned library than to streaming promo homepages.

## Recommended patterns (researcher's ranking)

1. **Compact saga index, not a shelf per saga.** Two-column layout of named saga tiles; each opens the owned films in that saga. Removes 15 Marvel shelves, reduces heading chrome, keeps franchise identity. Do not duplicate Tonight's Collections rail.
2. **Direct, finite poster grids on saga pages.** Title plus owned posters in release order, then relevant owned extras. No promo carousel or second navigation screen.
3. **Rails only for substantial sagas.** Initial criterion of four or more owned films plus an editorial flag. A Hearth proposal, not an observed Disney+ rule.
4. **Static brand hero, no repeated title.** Keep the wordmark art and fade; navigation starts directly beneath. Add orientation text only if useful.
5. **Timeline order only where curated.** Default to release order; offer a labeled alternative only for hand-curated franchises (Star Wars, MCU).

Design decision to test: replace repeating saga shelves with a compact saga index and direct poster-grid saga pages. Keep Other films, Shorts & specials and TV series sections where owned material exists.

## Status of the six open items

| Gap | Status |
|---|---|
| Disney+ hero contents | Partially resolved: logo-only historically; current subscriber controls unknown |
| Disney, DC, Wizarding World hubs | Partially resolved: Disney mobile image, Max brand entry, Peacock Harry Potter confirmed; full current Max pages unknown |
| Netflix, Apple, Max, Prime, Paramount franchise pages | Partially resolved: general navigation verified; franchise layouts largely undocumented |
| Mobile vs web | Partially resolved: Disney promo imagery and Apple mobile docs only |
| Saga sub-pages and entry | Partially resolved: Plex and Peacock detail pages; Apple heading navigation |
| 1-3 vs 4+ threshold | Still unknown for streaming; Plex offers configurable 1 to 4 |

## Sources (as given by the researcher)

Disney+ press and web browse pages; Apple Support (AU); Amazon News; Netflix Help Center; Peacock Harry Potter collection page; Plex Support (collections); Marvel and Star Wars hub pages. Re-collect exact URLs before citing.
