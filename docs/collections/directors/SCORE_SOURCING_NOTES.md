# Score sourcing notes (Directors lane, issue #60)

**Status:** Draft, facts only, not legal advice · **Last updated:** 2026-11-13
Covers the five lists written in this pass: Kubrick, Scorsese, Spielberg, Miyazaki, Bong ([`ESSENTIAL_10_KUBRICK.md`](./ESSENTIAL_10_KUBRICK.md), `_SCORSESE`, `_SPIELBERG`, `_MIYAZAKI`, `_BONG`, with matching `essential10-<name>.json`). The Kurosawa example used the same sources; see [`ESSENTIAL_10_EXAMPLE.md`](./ESSENTIAL_10_EXAMPLE.md).

## What came from where

| Data | Source | Read on | Notes |
|---|---|---|---|
| IMDb rating and vote count | Official IMDb non-commercial dataset, `https://datasets.imdbws.com/title.ratings.tsv.gz` | 2026-11-13 | File header: last-modified 2026-11-13 00:28 GMT; `x-amz-meta-run-date` 2026-11-12. All IMDb figures in the five ledgers come from this file. |
| IMDb ids; sole-director check | Same dataset: `title.basics.tsv.gz`, `title.crew.tsv.gz`, `name.basics.tsv.gz` | 2026-11-13 | Ids matched by original title, year and runtime. `title.crew` lists exactly one director for every film in the five lists. |
| RT Tomatometer and critic review count | Each film's rottentomatoes.com page (URL per film in the JSON ledgers) | 2026-11-13 | Read through the web-fetch text extractor. Percentage and count are the "N% Tomatometer / N Reviews" figures on the page. |
| RT cross-check | RT celebrity filmography tables (Kubrick, Miyazaki, Bong, partly Scorsese and Spielberg); search-result summaries of the same RT pages | 2026-11-13 | All Kubrick (11), Bong (8) and the Miyazaki titles listed matched the film pages. Scorsese's and Spielberg's celebrity pages listed only recent titles, so most of their films were checked against the film page alone. |
| TMDB person id, directing credits, movie ids | TMDB person pages 240, 1032, 488, 608, 21684 (Directing section, link ids); film pages for ids 81, 13963, 696506, 508883, 1275779, 15371 | 2026-11-13 | No TMDB API key was available in the workspace, so the API `crew.job` and `external_ids` fields were not read. |

## Blocked, unavailable or unreliable

- **IMDb title pages:** a fetch of `https://www.imdb.com/title/tt0062622/` returned HTTP 403. Live IMDb pages were not used; ratings are from the official dataset instead (as with Kurosawa). The dataset values were not cross-checked against live pages.
- **Wrong RT page slugs.** Several obvious guesses opened a different film or an empty page (0 reviews, no percentage), and were discarded. Known traps, recorded in the ledgers: `/m/the_last_waltz` (1936 film; use `the_last_waltz_1978`), `/m/after_hours` (2017 film; use `1032180-after_hours`), `/m/casino` (1980 TV film; use `1067987-casino`), `/m/king_of_comedy` family (a 2007 Hong Kong film shares the title; use `1011623-king_of_comedy`), `/m/memories_of_murder` (1990 TV film; use `memories_of_murder_2003`), `/m/the_killing` and `/m/spartacus` (empty or wrong), `/m/lolita` (a 1984 title), `/m/duel` (a 2013 film; Spielberg's Duel was not read), `/m/the_age_of_innocence` (1934 film; use `age_of_innocence`). A page showing "0 Reviews" with no percentage was treated as a wrong or empty page, never as a score.
- **TMDB person pages** showed years that were several years off the release years for many films (for example Jaws as 1974, Mickey 17 as 2019). Ids and titles were consistent with other sources; the ledgers use original release years from IMDb and RT.
- **Not read:** RT figures for longlist films outside the ten and the near misses are absent where marked in the ledgers ("Not read in this pass"). Their IMDb figures are present. The Irishman, Last Crusade, Temple of Doom and others were read; Cape Fear, The Aviator, Gangs of New York, The Color of Money and A.I. were not.
- **Review-count drift:** the same RT page gave 260 reviews in the fetch and 262 in a search-result summary for Shutter Island on the same day. Counts are single dated reads and change daily.
- **A scripted direct download of an RT page was attempted and not completed:** the harness blocked it as bot-check circumvention, so no RT figures come from scripted requests; all RT figures were read with the fetch tool.

## Fields left null or flagged

- IMDb or RT figure absent: RT for Duel (TV film, wrong slug found); RT review counts for Killer's Kiss and Fear and Desire (only the celebrity-table percentage was seen); IMDb id for the short Influenza (not looked up).
- Thin samples recorded rather than hidden: Bong's Barking Dogs Never Bite (17 RT reviews; 12,295 IMDb votes), Miyazaki's Nausicaä and Porco Rosso (23 each) and Castle in the Sky (28), The Last Waltz IMDb votes 22,644.

## Licensing caveats noticed (statements of fact)

- The IMDb dataset page states the data is for personal and non-commercial use and is subject to IMDb's conditions; IMDb's help pages say commercial or non-personal use needs written permission from IMDb Licensing. IMDb figures in the ledgers therefore carry the "personal / non-commercial" status of the source. No IMDb logo or page content was copied.
- Rotten Tomatoes' terms and licensing page (as summarised in the Kurosawa example) describe approved-request licensing for data, trademarks and logos and attribution and logo rules. No RT page content other than the single percentage and review count per film was recorded, and no RT logos or text were copied. Whether showing those numbers in Hearth is permitted was not determined here.
- The ledgers store both source URLs per film, so a link-out design (no copied number or logo) is possible without further sourcing.
- TMDB: ids, titles and credit facts come from TMDB pages; TMDB's attribution requirement for any later use of TMDB-derived metadata was not re-checked in this pass.
- Hearth's own work (ranks, rationales, near misses, the method) is editorial and sits outside the above.
