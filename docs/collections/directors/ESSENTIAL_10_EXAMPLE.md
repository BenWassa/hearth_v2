# Essential 10 worked example: Akira Kurosawa

**Issue:** [#60](https://github.com/BenWassa/hearth_v2/issues/60) · **Status:** Draft for owner review (first review gate) · **Version:** 0.1.0-draft · **Researched:** 2026-11-13
**Machine-readable ledger:** [`essential10-example.json`](./essential10-example.json) · **Roster:** [`ROSTER_PROPOSAL.md`](./ROSTER_PROPOSAL.md)

This is the one complete example the owner asked to see before the other eleven lists are written. Nothing here is wired into the app.

**Director identity:** Akira Kurosawa, TMDB person [5026](https://www.themoviedb.org/person/5026). The 32 TMDB "Director" credits run 1943-1993. Every film below was opened on its TMDB page and lists Kurosawa as the only director (no co-directors).

## The ten

Scores are a dated snapshot (2026-11-13), shown as two separate columns and never combined. IMDb = rating /10 and vote count. RT = critics Tomatometer and critic review count.

| # | Film | Year | TMDB id | IMDb id | IMDb /10 (votes) | RT critics (reviews) |
|---|---|---|---:|---|---|---|
| 1 | **Seven Samurai** | 1954 | 346 | tt0047478 | 8.6 (407,861) | 100% (104) |
| 2 | **Rashomon** | 1950 | 548 | tt0042876 | 8.1 (199,721) | 98% (61) |
| 3 | **Ikiru** | 1952 | 3782 | tt0044741 | 8.3 (104,712) | 98% (55) |
| 4 | Ran | 1985 | 11645 | tt0089881 | 8.2 (155,985) | 96% (90) |
| 5 | Yojimbo | 1961 | 11878 | tt0055630 | 8.2 (145,466) | 96% (49) |
| 6 | High and Low | 1963 | 12493 | tt0057565 | 8.4 (74,501) | 97% (70) |
| 7 | Throne of Blood | 1957 | 3777 | tt0050613 | 8.0 (61,310) | 95% (44) |
| 8 | The Hidden Fortress | 1958 | 1059 | tt0051808 | 8.0 (46,646) | 96% (53) |
| 9 | Stray Dog | 1949 | 30368 | tt0041699 | 7.8 (21,384) | 100% (23) |
| 10 | Red Beard | 1965 | 3780 | tt0058888 | 8.3 (23,951) | 73% (15) |

Bold = the permanently identified signature top three.

### Rationale, one sentence each

1. **Seven Samurai** - Synthesis of epic scale, ensemble characterisation and kinetic multi-camera action editing that set the template for the modern ensemble adventure; first on both evidence lines.
2. **Rashomon** - Four irreconcilable testimonies of one crime made narrative subjectivity a formal subject and introduced Japanese cinema to the world (Golden Lion, Venice 1951); ranked above higher-scoring audience favourites because its directing innovation is the more consequential.
3. **Ikiru** - The most humane film in the canon: a dying clerk's search for meaning, structured around a bold shift into his wake, carried by Takashi Shimura.
4. **Ran** - King Lear transposed to warring-states Japan, with colour-coded armies and a battle scored without diegetic sound; a late-career summation of his scale and tragic vision.
5. **Yojimbo** - Wry, widescreen-composed genre dismantling that fused samurai and western tropes and became the source for A Fistful of Dollars.
6. **High and Low** - Kidnap drama staged almost entirely in one apartment that then breaks into a procedural through Yokohama, turning a thriller into a study of class and conscience.
7. **Throne of Blood** - Macbeth recast through Noh theatre, fog and stylised movement, ending in one of cinema's most celebrated death scenes.
8. **The Hidden Fortress** - First widescreen adventure: a brisk, funny chase told partly through two bickering peasants, and an acknowledged influence on Star Wars.
9. **Stray Dog** - Early police procedural in sweltering post-war Tokyo; the young-detective / older-mentor pairing of Toshiro Mifune and Takashi Shimura shaped later crime cinema.
10. **Red Beard** - Three-hour humanist capstone to the Mifune partnership set in a rural clinic; the closest call in the ten (see below).

**Near misses** (considered, not included): Kagemusha (1980, TMDB 11953; Palme d'Or shared, but overlaps Ran), Sanjuro (1962, 11712; sequel restating Yojimbo), Dersu Uzala (1975, 9764; Oscar winner but outside the core body of work, thin critic sample), Drunken Angel (1948, 25858; surpassed by Stray Dog), The Bad Sleep Well (1960, 31589).

## Ranking method

The method is meant to be repeated for each director, and is research-led editorial judgement with the scores as evidence, not as inputs to a formula.

1. **Eligibility.** A feature film where TMDB crew lists the person with job Director (sole or credited co-director). Shorts, TV episodes, anthology segments and unreleased projects are excluded. Alternate titles and regional cuts are recorded (for example US re-edits with different titles).
2. **Longlist and evidence panel.** For every eligible film with at least 10,000 IMDb votes, record: IMDb rating and votes; RT critic score and review count; and a short note on direction (craft, formal innovation, influence on later films, major awards or critical-poll standing that can be cited).
3. **Read each source on its own terms.** IMDb is a large, self-selected audience average on a /10 scale; the Tomatometer is the share of critics giving a positive review, so it is a percentage of reviews and not an average grade. They are never averaged, summed or converted. Each is used only as an ordinal within the director's own filmography, and only where the sample is adequate (suggested floors: 10,000 IMDb votes, 20 RT reviews; below the floor a score is shown but carries little weight).
4. **Tier by directing achievement.** Tier 1 (signature) needs strong standing on both sources and a clear case on innovation or influence. Tier 2 is a clear masterwork or genre-defining film. Tier 3 fills the remaining places with the strongest remaining case. No padding: if fewer than ten films clear Tier 3, the list is shorter.
5. **Order within a tier by editorial judgement,** written down as the one-sentence rationale. When IMDb and RT disagree with each other or with the editorial order, the judgement is explained rather than hidden (examples below).
6. **Top three** are the Tier 1 films, in rank order, and are flagged `signature: true` in the ledger.
7. **Freeze and version.** Ranks are fixed per version. Scores are refreshed on a stated cadence for display only and never change the order; changing a rank requires a new editorial version with a reason.
8. **Review by a second reader** before encoding (for example a Codex review of the ledger against the cited pages), and a human spot-check of any score marked in the ledger's `unverified` list.

### Where the evidence and the order disagree (all deliberate)

- **Rashomon is #2 although its IMDb rating (8.1) is only the 8th-highest** in this longlist. Reason: the innovation and influence case outweighs audience preference; Tomatometer and review count (98%, 61) support it.
- **High and Low has the second-highest IMDb rating (8.4)** but sits at #6. Reason: the first five have a stronger claim on innovation, influence or scale; the gap is small and High and Low is the one most likely to be moved up by an owner who prefers crime drama.
- **Red Beard at #10** has IMDb 8.3 (tied for third-highest in the filmography) but an RT of 73% from only 15 reviews. Reason: kept for directing ambition and audience standing; flagged as the closest call. Stray Dog is the opposite case (IMDb 7.8, RT 100% from 23 reviews) and is #9.

## Sources and verification, with read dates

| Data | Source | Read on | Status |
|---|---|---|---|
| Person id, director credits | [TMDB person 5026](https://www.themoviedb.org/person/5026) and each film's TMDB page | 2026-11-13 | Verified: sole Director credit on all ten; titles/years match |
| IMDb rating and votes | Official [IMDb non-commercial dataset](https://data.imdb.com/non-commercial-datasets) (`title.ratings.tsv.gz`, refreshed daily) | 2026-11-13 | Read from the file; IMDb title pages themselves returned HTTP 403, so they were not cross-checked |
| IMDb ids | Matched in the IMDb dataset by original title + year + runtime | 2026-11-13 | See caveat below |
| RT Tomatometer and critic review count | Each film's rottentomatoes.com page (URLs in the ledger) | 2026-11-13 | Read through a text-extraction fetcher; percentages cross-checked against the RT Kurosawa celebrity filmography table where listed |

**Known uncertainties**

- TMDB film pages carry no IMDb link, so IMDb ids were matched by title, year and runtime. Runtimes agree to within 2 minutes except The Hidden Fortress (TMDB 139 min vs IMDb 126 min, a shorter cut). The matches are believed correct; confirm via the TMDB API `external_ids` field when implementing.
- RT pages show **US release years** for some films (Seven Samurai 1956, Ikiru 1956, The Hidden Fortress 1962, Stray Dog 1963). The ledger uses the original release year.
- RT's `/m/stray_dog` is a different 2015 film. Use `/m/1020312-stray_dog`.
- Red Beard and Dersu Uzala both showed 73% from 15 reviews on the same fetcher. The 73% matches the celebrity table; the counts need a by-hand check.
- Review counts and vote counts move daily; these are snapshots.

## Licensing caveats for showing IMDb / Rotten Tomatoes in the app

This is a research summary, not legal advice. Please treat it as a flag for the owner to resolve before any score or logo ships.

**IMDb**
- The free dataset is offered "for personal and non-commercial use" and is "subject to our terms and conditions" ([IMDb](https://data.imdb.com/non-commercial-datasets)). IMDb's help pages say the data must not be altered, republished or resold to build a database of movie information, and that non-personal or commercial use needs written permission from IMDb Licensing; crawlers and robots need express consent ([IMDb help](https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX)). IMDb's licensed API and bulk data are paid products.
- Consequence: keeping these numbers in this research ledger is a personal, non-commercial use. Shipping them inside the app to other users (even as a snapshot in a JSON file) is republishing, and displaying the IMDb name or logo implies endorsement or affiliation. Treat in-app IMDb scores and logos as **not cleared**.

**Rotten Tomatoes**
- The [Terms of Use](https://www.rottentomatoes.com/policies/terms-of-use) bar automated extraction and limit use to personal, non-commercial purposes (as summarised from search results; read the page before relying on it). The [licensing page](https://www.rottentomatoes.com/help_desk/licensing) says RT data via APIs or feeds, and use of trademarks and logos, need an approved request through its Business Proposal Form.
- If licensed, conditions include: brand attribution wherever RT content is displayed, the registered-trademark symbol, a link back to the film's RT page, and logo rules (Fresh or Hot logo only at 60% and above, Rotten or Stale at 59% and below, placed left of the score, not altered). Certified Fresh and Verified Hot marks have their own rules.
- Consequence: treat in-app RT scores and logos as **not cleared** until a licence is granted.

**What this means for the design.** Fixed ranks, rationales and the research method are Hearth's own editorial work and carry no third-party restriction. The compact IMDb and RT columns from the approved design therefore need either (a) licences, (b) a link-out to each source's film page without a copied number or logo, or (c) a different permitted source such as TMDB's own community score with TMDB attribution. This is Decision 2 in the roster proposal's decision list.
