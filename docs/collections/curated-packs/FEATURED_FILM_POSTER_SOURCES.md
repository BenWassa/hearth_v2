# BE — Six featured-film poster source references

**Date:** 2026-11-10  
**Status:** Prototype-only, visual artwork sources verified by public web search; not production-rights review or final TMDB poster-path mapping.  
**Related:** [Issue #55](https://github.com/BenWassa/hearth_v2/issues/55)

The updated interactive prototype references third-party film-poster images at their source URLs. It **does not download, bundle or commit them** to Hearth. When an image cannot load, the original named poster placeholder remains visible. The production integration must request actual film poster paths from TMDB after checking exact film identity, respecting TMDB attribution and display requirements.

| Film | Year | TMDB movie ID (identity cross-check) | Poster source used for concept | Status |
|---|---:|---:|---|---|
| Coming to America | 1988 | 9602 | [Art of the Movies](https://artofthemovies.co.uk/products/coming-to-america-1988-struzan-ss-os-1) | Remote prototype reference only |
| Friday | 1995 | 10634 | [Film Art Gallery](https://filmartgallery.com/products/friday) | Remote prototype reference only |
| House Party | 1990 | 16094 | [FilmAffinity](https://www.filmaffinity.com/es/film489030.html) | Remote prototype reference only |
| Hollywood Shuffle | 1987 | 34101 | [Movie Posters](https://www.movieposters.com/products/hollywood-shuffle-mpw-128413) | Remote prototype reference only |
| Girls Trip | 2017 | 417870 | [Rotten Tomatoes](https://www.rottentomatoes.com/m/girls_trip) | Remote prototype reference only |
| Black Dynamite | 2009 | 24804 | [IMDb](https://www.imdb.com/title/tt1190536/mediaviewer/rm1755783424/) | Remote prototype reference only |

## What changed in the conversation prototype
- Poster art is referenced in all four instances of the same six-film selection (24 cards, no extra duplicated image data).
- The same image is referenced on simulated film details.
- Fallback art retains labels and contrast when an image fails.
- Source credits and limitations are available in the prototype's `Film poster sources and preview limitations` disclosure.
- The base CSS and UI state remain unchanged. No new artwork was generated.

## Testing
- Parsed standalone HTML: 24 film cards contain 24 corresponding external poster-image references.
- Script syntax: `node --check` passed.
- Static headless preview rendered at a desktop viewport containing a 390px phone with network images blocked. Fallbacks remained legible and the existing hero and chapter artwork persisted.
- **Not verified:** Actual remote poster loading in an end-user browser; GitHub-hosted app tests; TMDB poster API integration. These require a browser with external network access and a configured TMDB client.

## Next asset decisions
- Featured/three supporting `Comic Icons` portraits are not visually approved as named performers.
- The next chapter's three scene prompts are documented in [ASSET_GENERATION_PROMPTS.md](ASSET_GENERATION_PROMPTS.md), but none of their banners is approved.
- Don't generate every chapter banner before confirming chapter navigation and layout density at actual phone width.
