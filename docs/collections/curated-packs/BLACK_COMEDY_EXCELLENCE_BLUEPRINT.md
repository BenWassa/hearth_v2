# Black Comedy Excellence — Curated Collections content & design blueprint

**Linked issue:** https://github.com/BenWassa/hearth_v2/issues/55  
**Status:** Working editorial and UX proposal only; **NOT approved film content, artwork, production UI or an implemented pack**  
**Date:** 2026-11-10  
**Source:** \`BenWassa/BE/data/master_top50.json\`, to be pinned to a reviewed commit before release  
**Rendering:** Tonight **Collections rail** → dedicated full-page **Black Comedy Excellence**. No Add placement.

## 1. Positioning

BE should feel like an **editorial collection worth browsing**, not a bulk-import tool. It is a substantial authored set of Black-led and comedy-adjacent films. The full page must make individual titles accessible, help a couple navigate a finite set, and let them save particular films if they want.

**Distinction:**
- **Worlds** = curated franchise/studio navigation built from household-owned content.
- **Sagas** = series/franchise grouping with household/watch state.
- **Curated collections** = editorially assembled thematic content, **independent of ownership**; a pack can have zero items saved.
- **Tonight mood rails** = immediate choices from household-owned content.

No separate pack database, progress %, completion pressure, ranking hierarchy, feed, external account, or opt-in "subscribe to pack" status.

## 2. Initial microcopy (DRAFT, to review)

| Location | Proposed wording | Notes |
|---|---|---|
| Tonight card | **Black Comedy Excellence** | Large title, no explicit rank/number |
| Page eyebrow | **CURATED COLLECTION** | Keep in Hearth's text-label size |
| Page title | **Black Comedy Excellence** | Serif; single H1 |
| Subtitle | **A curated journey through Black-led comedy cinema.** | Identity statement, not claim of definitive list |
| Introduction | **Explore a selection of Black-led comedies and comedy-adjacent stories—from familiar favorites to films worth revisiting. Choose what interests you and add it to your shared Library.** | Original draft copy; avoid unsupported historical claims |
| Credit | **Curated by Black Comedy Excellence** | Include full BE source/rights details in About |
| First shelf | **Start here** | 4–6 human-selected films |
| Chapter section | **Explore by theme** | Compact entry points, not huge duplication |
| Full index | **All films** | Film count only when editorial list finalized |
| Unowned film | **Add to Library** | Existing Hearth add semantics |
| Owned film | **In Library** / **Watched** | Only real household state |
| Select mode | **Choose films** → **Add selected** | Secondary action only |
| Source info | **About this collection** | Attribution, methodology and content caveats |

**Do not use:** \`Best of all time\`, \`Top 50 of all time\`, \`Official canon\`, \`3-source consensus\`, \`Must watch\`, model rankings or made-up historical claims. The BE list was assembled from three AI research outputs and has unresolved editorial boundary and provenance questions.

## 3. First-page content architecture

### 3.1 Hero
- Full-width editorial section with the collection name, one short description and source credit.
- Text-first and graceful with **no art**. The owner may later choose an image-gen cover; **do not create cover assets or placeholder illustrations now**. Flat warm-neutral CSS surfaces are acceptable.
- Keep headline visible above first scroll on a 390px phone. Avoid giant ornamental splash that requires an extra tap or pushes films too far below.
- Optional small \`About this collection\` link reveals source/credit/rights notes without opening an external website by accident.

### 3.2 Start here: 6 draft entry points
These titles are present in the BE source file; their *selection as featured films* is unapproved and represents a deliberately diverse preview, not a \`top six\`.

| Film | Year | Purpose of featuring (working editorial intention) |
|---|---:|---|
| Coming to America | 1988 | Recognizable performer-led entry point |
| Friday | 1995 | Friendship / ensemble entry point |
| House Party | 1990 | Youth / ensemble entry point |
| Hollywood Shuffle | 1987 | Satire entry point |
| Girls Trip | 2017 | Newer ensemble entry point within source's historical range |
| Black Dynamite | 2009 | Parody entry point |

Film-specific synopses and artwork must come from verified provider data; do not invent claims about cultural importance or historical influence.

### 3.3 Explore by theme (candidate chapter structure)

The existing 50-source corpus has very diverse comic forms. Use a *small number of authored themes*, not automatically generated genre labels. A preliminary **six-chapter assignment is below** so editorial reviewers can spot inconsistent inclusions. The page may foreground only **3–4** chapters and provide access to all six from a compact section navigator or All films.

Every film has **one provisional primary chapter**, so chapter lists are MECE for browsing; a film may have secondary metadata tags for search/internal editor use. This proposal requires a curator to check the chapters against the source and BE inclusion decisions, especially borderline entries.

| Proposed chapter | Working definition | Count in draft |
|---|---|---:|
| **Roots & Early Voices** | Early-period films, historical/contextual range, some comedy-adjacent | 10 |
| **Comic Icons & Star Turns** | Performer-led showcases and prominent comic personas | 10 |
| **Friends, Family & Community** | Friendships, family or ensemble dynamics | 9 |
| **Spoofs & Satire** | Parody, spoof, satirical or genre-referential films | 8 |
| **Love & Relationships** | Rom-com and relationship-led, including adjacent drama | 8 |
| **Action & Buddy Comedy** | Action comedy and buddy-cop combinations | 5 |

#### Provisional complete 50-film assignment (source index, not published ranking)

**Roots & Early Voices (10)**  
04 Cooley High (1975); 11 Hollywood Shuffle (1987); 21 School Daze (1988); 23 Car Wash (1976); 24 Stir Crazy (1980); 27 Uptown Saturday Night (1974); 28 Breakin' 2: Electric Boogaloo (1984); 41 Let's Do It Again (1975); 43 Do the Right Thing (1989); 45 Dolemite (1975).

**Comic Icons & Star Turns (10)**  
01 Coming to America (1988); 06 Harlem Nights (1989); 07 Life (1999); 10 The Nutty Professor (1996); 14 Soul Plane (2004); 17 B.A.P.S. (1997); 22 The Original Kings of Comedy (2000); 25 Big Momma's House (2000); 29 Dolemite Is My Name (2019); 39 How High (2001).

**Friends, Family & Community (9)**  
02 Friday (1995); 03 House Party (1990); 05 Barbershop (2002); 13 Girls Trip (2017); 18 The Wood (1999); 26 Next Friday (2000); 32 Set It Off (1996); 35 Dope (2015); 42 Welcome Home Roscoe Jenkins (2008).

**Spoofs & Satire (8)**  
12 White Chicks (2004); 15 Undercover Brother (2002); 19 Sorry to Bother You (2018); 20 I'm Gonna Git You Sucka (1988); 30 Don't Be a Menace to South Central While Drinking Your Juice in the Hood (1996); 33 Pootie Tang (2001); 47 Dear White People (2014); 48 Black Dynamite (2009).

**Love & Relationships (8)**  
08 Boomerang (1992); 16 Think Like a Man (2012); 37 A Thin Line Between Love and Hate (1996); 38 Booty Call (1997); 40 Diary of a Mad Black Woman (2005); 46 The Best Man (1999); 49 Waiting to Exhale (1995); 50 Poetic Justice (1993).

**Action & Buddy Comedy (5)**  
09 Bad Boys (1995); 31 Blue Streak (1999); 34 Ride Along (2014); 36 National Security (2003); 44 Rush Hour (1998).

**Draft arithmetic:** 10 + 10 + 9 + 8 + 8 + 5 = 50. Numbers are source positions, **not evidence-backed ranks**. No film intentionally assigned to more than one primary chapter. Film placement is a working taxonomy, **not verified film history, inclusion approval or final curated editorial structure**. Note that \`Roots & Early Voices\` includes several non-comedy-adjacent film candidates flagged by BE's audit; those could be removed after editorial review without inventing a comedy label.

### 3.4 All films
- Single finite grid of every **approved** published entry; source's 50 is the working target and may change through editorial review. Never label a smaller revised collection “Top 50”.
- Select details via a film card; no direct streaming playback, auto-generated reviews or algorithmic sort.
- Provide title, year, poster, and small owned / available state. No ranking and no progress percentage.
- Optional quick chapter anchor list above All films; default should not be 50 unbroken dense rows if navigation becomes burdensome.
- Once film is saved, update card using live household identity only.

### 3.5 Film detail
- Owned film → current Hearth full detail, watched/notes/progress controls.
- Not owned → provider-backed read-only detail; **Add to Library** using Hearth's current add transaction; stay in BE page afterwards.
- If background classification runs later, that does not change BE membership or editorial chapter.
- Film-specific cultural note only if independently reviewed, source URLs linked, rights and attribution cleared. Until then, use provider synopsis and concise source credit for the collection.

## 4. Visual direction: constraints, not final artwork

**On Tonight Collections rail**
- Keep established poster-shaped **2:3** tile sizing. BE first in stable display order, followed by existing eligible non-World saga cards.
- The first tile needs a deliberately designed **title-led** identity but can launch without a generated visual: warm-dark solid/tonal background, readable stacked serif text, optional discreet \`CURATED\` small descriptor.
- Do not repurpose saga progress bars or watched percentages on this tile. Do not falsely display a film-count as \`owned\`.

**On full page**
- Borrow existing World page's full-width feeling and existing Hearth serif hierarchy, but make BE more **editorial than brand-promotional**.
- Hero is shallow enough to reveal the first films without scrolling excessively; text remains legible.
- Main content is poster-forward; no glassmorphism panels, heavy labels, overdecorated buttons, automatic animations or endless shelves.
- Layout options for later wireframe review:
  - **A: Film programme** — compact text hero, Start here shelf, 3–4 theme entry blocks, All films.
  - **B: Editorial index** — text hero, featured six, compact anchor navigation, all chapters as grids.
  - **C: Immersive collection** — reserve large full-bleed art for **later owner-approved asset**, with concise chapter shelves. **Do not produce art now.**
- Current suggested baseline: **A**, because it reveals films quickly and fits Hearth's low-friction purpose. This is a design recommendation, not a locked visual decision.
- Ensure the All collections index lists BE under \`Curated collections\`, separate from \`Sagas\`. If there are no saga rollups, the BE card is still accessible from Tonight.
- Accessibility: minimum 44px controls, 320/360/390/448px checks, safe-area padding, readable truncation of \`Black Comedy Excellence\`, focus return to Tonight's original tile, correct Android back.

## 5. Content and art workflow

### Do now (content development and structure)
1. Freeze BE source commit + 50-title list.
2. Validate inclusion exceptions and genre-adjacent items (BE audit highlighted 12).
3. Review **six primary chapter assignments** above; decide to combine/split and choose 3–4 chapters to foreground.
4. Approve/replace the 6 \`Start here\` films.
5. Write 1–2 original sentences for each displayed chapter, with citations where claims require them.
6. Produce film identity mapping \`beEditorialId → verified TMDB movie ID\`, reviewer/date/exception log; verify all published entries.
7. Prepare a typographic-first layout brief and 390px interaction wireframes **without generating imagery**.
8. Test saved/unsaved/removed conditions, genre boundaries and empty-library navigation.

### Do later (explicit separate design decision)
- Explore cover art concepts, then select one visual direction.
- Only then create/or commission image-gen assets for rail card and full-page hero; decide whether both use one consistent artwork treatment or separate crops.
- Review art rights, contrast, 2:3 card crop, narrow-screen hero and fallback.
- Do not treat words like \`eventually\` or \`perhaps\` as authorization to generate assets or create separate rails now.

## 6. Editorial review log required before content ships

For each film:
- Editorial source ID, original title/year, committed BE source revision.
- Verified TMDB movie ID (positive numeric) with title/type/release verification.
- Inclusion decision \`approved | review_needed | excluded\`; borderline comedy rationale and reviewer.
- Primary chapter, any optional secondary tags, featured flag.
- Any authored notes have distinct source claims and direct citations.
- Poster source/rights policy, fallback treatment, credit/licence obligations.
- Proof that title is not silently merged with a remake, TV show or similar-named film.

The BE audit does not establish rights for 50 local posters, source claims or revised prose. BE's original code and creative content have different licence terms. Keep each rights record independent. Do not copy BE local images into Hearth.

## 7. Future option: separate Curated Collections rail

Do not implement now. Reassess only when **several credible curated packs**, consistent card/hero assets and meaningful navigation demand justify separation. Possible criteria for a product review: 3+ published packs, the combined rail displaces saga visibility, or user testing demonstrates faster discovery using a dedicated rail. These are **review triggers, not automatic code thresholds**. If promoted, move the pack cards out of the mixed rail; do not duplicate them on Tonight.

## 8. Current status

- [x] Full 50 BE source titles inventoried for a **provisional** six-group editorial map.
- [x] Draft hero, introduction, starting selection, chapter candidates and layout A/B/C documented.
- [x] Tonight rail and full-page architecture confirmed as owner direction.
- [x] Image generation explicitly deferred.
- [ ] No content or chapter classification approved for distribution; no complete TMDB ID mapping or rights approval.
- [ ] No implemented page, images, code changes, runtime validation or release.
