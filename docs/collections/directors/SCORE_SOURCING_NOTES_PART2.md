# Score sourcing notes, part 2 (Directors lane, issue #60)

**Status:** Draft, facts only, not legal advice · **Last updated:** 2026-11-13
Covers the six lists in this pass: Hitchcock, Bergman, Fellini, Ray, Varda, Wong Kar-wai ([`ESSENTIAL_10_HITCHCOCK.md`](./ESSENTIAL_10_HITCHCOCK.md), `_BERGMAN`, `_FELLINI`, `_RAY`, `_VARDA`, `_WONG`, with matching `essential10-<name>.json`). The first batch is in [`SCORE_SOURCING_NOTES.md`](./SCORE_SOURCING_NOTES.md); the method and licensing caveats are in [`ESSENTIAL_10_EXAMPLE.md`](./ESSENTIAL_10_EXAMPLE.md).

## What came from where

| Data | Source | Read on | Notes |
|---|---|---|---|
| IMDb rating and vote count | Official IMDb non-commercial dataset, `https://datasets.imdbws.com/title.ratings.tsv.gz` | 2026-11-13 | Files were the same local copies downloaded that day for the first batch (the first batch's notes record the file header date of 2026-11-13 00:28 GMT). Every IMDb figure in the six ledgers was read programmatically from this file, not typed by hand. |
| IMDb ids; director check | Same dataset: `title.basics.tsv.gz`, `title.crew.tsv.gz`, `name.basics.tsv.gz` | 2026-11-13 | Director name ids: Hitchcock nm0000033, Bergman nm0000005, Fellini nm0000019, Ray nm0006249, Varda nm0889513, Wong nm0939182 (listed as "Wong Kar-Wai"). Film ids matched by original title, year and runtime and compared with the TMDB page runtime (all within 11 minutes; every Hitchcock film is within 1 minute; the largest gap is Juliet of the Spirits, TMDB 148 vs IMDb 137, and the next are Autumn Sonata 93 vs 99 and The Music Room 100 vs 95; each is a single entry, not a different film). `title.crew` lists a second director for Variety Lights (Lattuada), Faces Places (JR) and anthology films only. |
| RT Tomatometer and critic review count | Each film's rottentomatoes.com page (URL per film in the JSON ledgers), read with a command-line fetch of the page's embedded data (`criticsScore`: `scorePercent`, `reviewCount`) | 2026-11-13 | One request per page. Not a text-extraction summary: the figures are the page's own values. |
| RT cross-check | RT celebrity filmography tables for each director | 2026-11-13 | 27 of the 56 ranked films appear in those tables; 26 matched the film page exactly on percentage and count, and the one non-match (Ashes of Time, 1994) is null on both. The remaining 29 were checked against their film page only. |
| RT page addresses | The RT celebrity tables and web search results | 2026-11-13 | Used only to find the right page. Search-result summaries sometimes quoted different counts (for example The 39 Steps 56 reviews, As Tears Go By 13); the page read is the value recorded. |
| TMDB person id, Directing credits, movie ids, director credit | TMDB person pages 2636, 6648, 4415, 12160, 6817, 12453 (Directing section with link ids) and the TMDB page of every ranked film (the featured crew list shows Director) | 2026-11-13 | Every ranked film id appears in the person's Directing section; every film page shows the person as Director; Faces Places shows JR as a second Director. No TMDB API key was used, so `crew.job` and `external_ids` were not read from the API. |
| Sight and Sound 2022 positions | BFI, [The Greatest Films of All Time](https://www.bfi.org.uk/sight-and-sound/greatest-films-all-time) | 2026-11-13 | Read as page text in two halves. Positions used: Vertigo 2, In the Mood for Love 5, Cléo from 5 to 7 14, Persona 18, 8½ =31, Psycho =31, Pather Panchali 35, Rear Window =38, North by Northwest =45, La Dolce Vita =60, The Gleaners and I =67, Chungking Express =88, Vagabond =101, Wild Strawberries =108, Fanny and Alexander =129, Notorious =133, The Seventh Seal =136, Le Bonheur =152, Amarcord =157, Charulata =169, The Birds =185, Cries and Whispers =225, Happy Together =225. A film left blank was not seen in the portions read (ranks 49 to 50 and the tail were not visible); that is not proof it is absent. |
| Awards cited in rationales | Web searches (Wikipedia award lists, satyajitray.org, Cannes retrospective page, news pieces) | 2026-11-13 | Confirmed: Ray's Berlin Best Director awards (Mahanagar 1964, Charulata 1965), Distant Thunder Golden Bear 1973 and Aparajito Golden Lion 1957; Varda's Vagabond Golden Lion 1985, Faces Places Best Documentary nomination and honorary Oscar 2017; Bergman's three Foreign Language Oscars; Fellini's four, and the 1960 Palme d'Or for La Dolce Vita; Wong's Best Director at Cannes 1997 for Happy Together. One source dated Charulata's Silver Bear 1964; the ledger says 1965. |

## Blocked, unavailable or unreliable

- **IMDb title pages.** One plain request to `https://www.imdb.com/title/tt0054215/` returned an empty body (HTTP 202 with no content) rather than a readable page. No attempt was made to work around that. Ratings therefore come from the official dataset, the same fallback as the Kurosawa example and the first batch. The dataset values were not cross-checked against live pages.
- **TMDB API.** Not used (no key in the workspace). TMDB film pages carry no IMDb link, so IMDb ids are matched, not read from `external_ids`. Confirm through the API when implementing.
- **RT access.** RT's terms limit automated extraction (see the example's licensing section); the six lists needed about 130 film-page reads (including discarded slug guesses) plus 6 celebrity pages, one request each with a short pause. The first three probe requests (RT, IMDb and TMDB pages) used a generic browser-style user-agent string; every later request used a descriptive research user agent. No RT paid or licensed feed was used.
- **Wrong RT page slugs.** Many obvious guesses opened a different film or an empty page and were discarded. A page showing no percentage and 0 or 1 reviews was treated as wrong or empty, never as a score. Known traps, recorded in the ledgers' URLs:
  - Hitchcock: `/m/notorious` is a 1992 film (use `1015287-notorious`); `/m/rebecca` is the 2020 remake (use `1017293-rebecca`, not ranked); `/m/39_steps` is a 2008 remake (use `1000121-39_steps`); `/m/the_birds` was empty (use `1002448-birds`); `/m/shadow_of_a_doubt` was empty (use `1018688-shadow_of_a_doubt`); `/m/rear_window` worked but the celebrity table links `1017289-rear_window`, which is the address recorded.
  - Bergman: `/m/the_magician` and `/m/the_silence` opened unrelated films; `/m/summer_with_monika` and `/m/persona_1966` were empty. `/m/scenes_from_a_marriage` is the 2h 48m film cut, not the TV series.
  - Fellini: `/m/8-12` is 8½; `/m/the_swindle` and `/m/il_bidone` are the same page (Il Bidone).
  - Ray: `/m/the_big_city` is a different film (use `mahanagar`); `/m/the_goddess` is empty (use `devi`); `/m/the_world_of_apu` is empty (use `apur_sansar`); `/m/the_music_room` opens as "Jalsaghar".
  - Varda: `/m/cleo_from_5_to_7` was empty (use `cleo_de_5_a_7`, listed as 1961); `/m/le_bonheur` opens as "Happiness".
  - Wong: `/m/as_tears_go_by` is a different film (use `1135853-as_tears_go_by`); In the Mood for Love is `/m/in_the_mood_for_love_2001`, Fallen Angels is `/m/fallen_angels_hong_kong`; the 1994 Ashes of Time page has only 3 reviews and no Tomatometer, and the 2008 Redux page is a different cut.
- **Release years.** TMDB, IMDb and RT give different years for some films (La Pointe Courte 1955/1956; Daguerréotypes 1975, 1976, 1978; Cléo 1961 on RT; Days of Being Wild 1991 on RT; The Virgin Spring 1959 on RT). The ledgers use the original release year and keep the other values in notes or `tmdbYear`.
- **IMDb type trouble.** Varda by Agnès (2019) is filed on IMDb as a miniseries (tt9530198, 7.8 from 2,872 votes) with a separate "Causerie" entry (tt43684922, no rating in the dataset), so it was not ranked. Scenes from a Marriage has both a series entry (tt0070644, 8.5 from 17,954) and a film entry (tt6725014, 8.3 from 10,783); the film entry is used.
- **Not read.** RT pages for films outside the ten and the near misses were mostly not opened (the celebrity-table values for them are used in the near-miss notes where shown). RT pages for Bergman's Summer with Monika, The Silence and The Magician were not read.

## Thin or null scores in the ledgers

| Film | Field | Value | Reason |
|---|---|---|---|
| La Pointe Courte (1955) | RT | null | 4 reviews, no Tomatometer published |
| Ashes of Time (1994) | RT | null | 3 reviews, no Tomatometer published (Redux page, 78% from 78 reviews, is a different cut and recorded separately) |
| Distant Thunder (1973) | RT | 100% from 5 reviews | Shown but not a usable sample |
| Le Bonheur | RT | 88% from 8 reviews | Thin |
| Nayak, Devi, Daguerréotypes, The White Sheik, Smiles of a Summer Night | RT | 10 to 16 reviews | Under the 20-review floor |
| Most of Ray's list, Varda's Beaches/Daguerréotypes/La Pointe Courte | IMDb | under 10,000 votes | Under the vote floor |

No score was estimated, averaged or filled in. IMDb and RT are kept in separate fields and used only as evidence for an editorial rank.

## Open items for a human

- Spot-check a handful of RT and IMDb figures on the live pages in a normal browser; the IMDb numbers in particular were not checked against live title pages.
- Confirm IMDb ids through TMDB `external_ids` at implementation.
- Licensing for showing IMDb and RT numbers or logos in the app is unresolved (Decision 2 in the roster proposal).
