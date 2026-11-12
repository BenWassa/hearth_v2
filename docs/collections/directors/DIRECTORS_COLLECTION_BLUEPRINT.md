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
