# THE DIRECTORS — Product, content and visual specification

**Workstream:** Hearth #57 · **Revision:** 2026-11-12 · **Status:** Review candidate, unmerged

## Executive decision

**Build one editorial collection titled “The Directors”, not a new home rail or a new World.** The user opens it once from Tonight's existing Collections shelf; its dedicated full-page directory contains individual filmmaker pages with a compact selection of starter films and a chronological filmography. The film collection is **authored by a real director**, never a TMDB franchise, mood category, popularity score or tracked challenge.

**Why it matters:** A familiar director is an intuitive way to choose a movie together. Each collection page produces a small actionable entry point rather than expecting the household to search or scroll through a ranking.

### Prior art and rationale

| Reference | Useful pattern | What Hearth rejects |
|---|---|---|
| [Criterion Channel: Director Collections](https://www.criterionchannel.com/discover/from-the-criterion-collection) | Director-specific, finite editorial catalogs | Claiming distribution rights or presenting all catalog titles as streamable |
| [MUBI: Browse Directors](https://mubi.com/en/directors) | A unified director directory and filmmaker identity pages | Endless/algorithmic discovery and filtering complexity |
| [TMDB person details](https://developer.themoviedb.org/reference/person-details) and [movie credits](https://developer.themoviedb.org/reference/person-movie-credits) | Provider-backed identity and author credits | Treating cast, producers and writers as directed credits |
| [TMDB FAQ](https://developer.themoviedb.org/docs/faq) | Non-commercial API terms and required credits | Assuming that TMDB owns every image or that attribution alone guarantees image rights |

### Proposed initial roster (12)

All rows are **editorial choices**, not ranked claims about absolute greatness. IDs live in `src/config/directorCatalog.json`. Starter IDs are provisional until checked against live credits; they are omitted automatically if not confirmed as directed.

| Filmmaker | TMDB person ID | Initial three starter films | Curatorial reason |
|---|---:|---|---|
| Christopher Nolan | 525 | Memento; Inception; Interstellar | Dense ideas, large-scale spectacle |
| Steven Spielberg | 488 | Jaws; Jurassic Park; E.T. the Extra-Terrestrial | Suspense, adventure, broad accessibility |
| Martin Scorsese | 1032 | Goodfellas; Taxi Driver; The Departed | Character-driven crime and moral tension |
| Hayao Miyazaki | 608 | Spirited Away; My Neighbor Totoro; Princess Mononoke | Animation and wonder |
| Spike Lee | 5281 | Do the Right Thing; Malcolm X; BlacKkKlansman | Social and cultural storytelling |
| Sofia Coppola | 1769 | Lost in Translation; The Virgin Suicides; Marie Antoinette | Intimate visual authorship |
| Quentin Tarantino | 138 | Reservoir Dogs; Pulp Fiction; Inglourious Basterds | Dialogue and genre inversion |
| Akira Kurosawa | 5026 | Seven Samurai; Rashomon; Yojimbo | Global film influence and historical range |
| Wes Anderson | 5655 | The Grand Budapest Hotel; The Royal Tenenbaums; Fantastic Mr. Fox | Visual precision, family portraits |
| Jane Campion | 10757 | The Piano; Bright Star; The Power of the Dog | Psychological drama and perspective |
| Bong Joon-ho | 21684 | Parasite; Memories of Murder; The Host | Social commentary and genre |
| Stanley Kubrick | 240 | 2001: A Space Odyssey; The Shining; A Clockwork Orange | Technical precision and thematic ambiguity |

**Bias/coverage note:** This first set intentionally mixes periods and several film traditions, but still favors established English-language cinema and contains only two women. A second editorial pass should consider **Agnès Varda, Alfred Hitchcock, David Lynch, Wong Kar-wai, Pedro Almodóvar, Greta Gerwig, Kathryn Bigelow, Satyajit Ray, Céline Sciamma, Chantal Akerman, Guillermo del Toro, Kelly Reichardt, Jordan Peele, Park Chan-wook and Francis Ford Coppola**. These are candidates, not preapproved members. An editorial roster should never simply copy popularity or IMDb rankings.

## Experience architecture

```text
Tonight
  └── Collections [existing horizontal rail]
        ├── The Directors [new 2:3 editorial tile; visible when shelf is empty]
        ├── Current franchise sagas [unchanged, including World exclusions]
        └── All collections [existing conditional link]
             └── Curated collections
                  └── The Directors

The Directors [full-page panel]
  ├── Brief hero: title + one sentence
  └── Finite 2-column directory [12]
        └── Director page [one selected person]
              ├── Name + one-line signature + optional portrait
              ├── Start here [up to three credited choices]
              └── Directed films [chronological 3-column poster grid]
                    └── Film details
                          ├── Already on shelf → existing Hearth details
                          ├── Unsaved → verify TMDB film detail → Add to shelf
                          └── Recently removed → restore using existing flow
```

### Phone-first visual contract

- Reference width **390px**; centered app shell `max-w-md`, near-black `#0c0a09`, stone-900 cards, amber-300 labels. System serif for name; system sans for UI. No custom fonts.
- 2:3 rail tile: **THE DIRECTORS** in large warm serif, small “CURATED” marker, no baked-in images, no phantom progress counters.
- Opening collection is one tap, never a promotional splash that requires an additional Enter.
- Directory cards 2 columns, ~160px tall, number/arrow above director name and a short human description.
- Director page puts Start here posters before filmography. The 3-wide film grid uses small but readable titles/years below; no titles baked into an unverified poster image.
- Director imagery is limited to official TMDB dynamic portraits (when present), not newly generated artwork or copied copyrighted stills.
- Each page honors safe areas, focus, reduced motion and native scroll. No autoplay, shuffle, algorithmic recommendation percentages, or watched-film completion count.
- For zero titles on shelf, keep the collection visible. For no TMDB response, show Retry instead of inventing credits.

### Data and operations

`GET /api/directors/:id` is allowlisted to the 12 names. It uses `/person/{id}?append_to_response=movie_credits`, sharing Hearth's authenticated TMDB request transport, rate limits and retry logic. Its server response contains only `filmographyLabel`, `films`, `startHere`, optional portrait and `missingStarterIds`. It does not fetch each movie's details eagerly.

The mapping filters `crew.job==='Director'` and `crew.department==='Directing'`, valid provider ID, announced release date no later than today, non-video/adult flags, and deduplicates by movie ID. Sort oldest to newest. **This is not an exhaustive feature filmography**: TMDB credit datasets can contain shorts, co-directed work, irregular entries and omissions. To publish “feature films only”, add a runtime-based, independently verified editorial whitelist; do not guess from TMDB genres.

A film Save must happen only after `GET /api/media/tmdb/:id?type=movie` and identity match. Never auto-add. Never silently restore a removed film. Saved status comes from live shelf state; no director-specific completion or write schema. Fail closed if API data doesn't match.

### Technical dependencies

#55 and draft PR #56 define the future shared editorial-pack interface, but it is not on `main`; do not import its unfinished registry on this branch. Once it lands, replace separate ad-hoc rail entries with one typed editorial registry, and let BE remain pinned as approved. No new rail.

### Acceptance and release gate

1. Visual/signoff: owner agrees 12 names, labels, starter choices, chapter depth and title.
2. Live TMDB person/starter identity audit; all IDs verified, not just mapped fail-closed.
3. Automated tests plus real browser/hardware QA on mobile 320/360/390/448, Pixel back/Escape, return focus and scroll.
4. Confirm the exact required TMDB attribution notice/logo appears in app credits. Verify image-use provenance independently.
5. QA saved/removed/retry/offline/zero-owned scenarios; confirm original shelf states survive every action.
6. No merge/deployment until approval. Runtime tests not executed in the current connector-only environment.

**Owner-facing choices:** name (“The Directors” or “Legendary Directors”); original 12 roster; tone and shape of typographic tile; 3 vs 4 starter films; explicitly approve or reject a future visual hero art phase.


---

## Owner-aligned design direction — 2026-11-13 (supersedes earlier concepts)

**Status:** Product/visual direction approved for continued design work; **not permission to merge or deploy**. This section takes precedence over the earlier prototype specifications above, which document the existing draft rather than the accepted target.

### Collection architecture and editorial content

- **One “Legendary Directors” collection** inside the existing Tonight → Collections rail; no new rail, bottom tab, or separate intermediate splash.
- Approximately **12 filmmaker profiles**, with the final roster still to be researched and approved strictly for achievement in directing. Evaluate directing craft, film quality, influence, range and consistency on their merits; research world cinema comprehensively. The first-draft roster is **provisional**.
- Each director receives a **static, curated Essential 10** ranked film list, based on researched IMDb and Rotten Tomatoes evidence plus documented editorial judgement. Ratings are not directly comparable; account for vote/review counts and evidence quality. The list and ordering do **not** change by household watch status. Permit fewer than ten only if the filmography does not support ten excellent candidates.
- The **top three** remain permanently identifiable as the signature films within the fixed Essential 10.
- The visible Essential 10 can initially show five rows with a **View all 10** affordance. Separate **Watch next** shows around three highest-ranked titles **not marked watched** in Hearth. A film absent from Hearth is *not recorded watched*, not conclusively unseen. If fewer than three unmarked-watched choices exist, show fewer rather than padding with watched titles by default. No numerical match ratings or personalized re-ranking of the static ten.
- No automatic additions to the shared shelf and no silent restoration of removed items.

### Individual director page — visual and interaction agreement

- **Mobile-first at actual 390px viewport**, warm Hearth shell (#0c0a09), quiet cream serif, restrained amber accents, portrait-led, photographic, no generic projector art, minimal explanatory subtitles. Strong photography and intentional framing; source and verify real portraits before publication.
- Director **autograph/signature may appear below/near the name** only if a genuine, rights-cleared source can be confirmed for that director. Research candidates; do not generate fake autographs or assume a Wikimedia file is automatically authentic/usable.
- **Watch next** is visually distinct from **Essential 10**: approximately three film choices above a fixed ranked list. Never show a film marked watched as a personalized *Watch next* suggestion.
- **Essential 10 rows:** thumbnail, stable editorial rank, film title and year, with **compact IMDb and Rotten Tomatoes scores at the far right**, preferably stacked with small recognizable icons. A potential Rotten Tomatoes SVG is a **design option**, not a license grant: verify actual permitted mark usage and legal score sources, attribution and snapshot date; never fabricate ratings or rely on unlicensed scraping. Show a graceful unavailable state where reliable scores cannot be sourced.
- **Tap the entire film row or a Watch next card** to open a **centred film-detail modal**, reusing Hearth's existing `ItemDetailsModal` patterns rather than introducing a second incompatible modal. On an unsaved film, load/verify canonical TMDB film identity before displaying **Add to shelf**; saved films open existing details and preserve watched status; recently removed films retain their safe restore flow. Modal supports close/Escape/back and focus restoration.
- Existing draft branch still implements a different profile/filmography UI. **Do not mistake the branch's current layout for approved production design**; a dedicated implementation pass is required following asset/rating provenance checks.

### Directory and Tonight entry point

- Directory: exploratory **depth/circular carousel** direction influenced by React Bits, but its gestures, accessibility, ability to jump to all twelve, motion reduction and usability are **not approved until hands-on mobile testing**. Do not infer approval merely from a static 3D render.
- **Next design asset:** the 2:3 **Tonight Legendary Directors cover**, matching actual Collections rail dimensions (approximately 112–144px wide). Preserve legibility at real size; differentiate from surrounding poster covers; avoid film-camera/projector clichés and fake signatures. Bring options for owner review before production.
- No source code changes or PR merge simply because this design note has been recorded.
