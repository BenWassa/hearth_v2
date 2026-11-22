# Issue #60 — Legendary Directors editorial ranking and ratings provenance

**Issue:** https://github.com/BenWassa/hearth_v2/issues/60  
**Parent:** [#57 Legendary Directors](https://github.com/BenWassa/hearth_v2/issues/57)  
**Status (2026-11-22):** Roster approved; Essential 10 for all 12 drafted, sourced and ranked by score (see `RANKING_BY_SCORES.md`), encoded in the app and cross-checked. Open: display licences for IMDb / Rotten Tomatoes before any public release; owner decision on the listed score challengers.  
**Date:** 2026-11-13

## Purpose
Produce a globally researched roster of approximately twelve filmmakers selected for excellence in directing; then a **fixed, versioned Essential 10** of great films per director. These ranks are editorial, informed by legitimate IMDb rating/vote count and Rotten Tomatoes Tomatometer/review count plus film-specific directing analysis. Do not equate the sources or invent ratings.

## Decisions already approved
- Essential 10 is static and shows five rows initially, expandable to all ten.
- The top three are permanently identifiable as signature films within the static ranking.
- **Watch Next** is separate: show up to three highest-ranked entries not marked watched in Hearth; missing watch history is unknown, not confirmed unseen. Never change static ranks for one household.
- Compact IMDb and Rotten Tomatoes scores appear on the right when source and display rights have been verified.
- No demographic inclusion/exclusion quotas in determining artistic merit; research comprehensively across world cinema.

## Research ledger contract
For every chosen film record director person ID, canonical film ID, alternate title/year, rank, film-specific rationale, IMDb ID/rating/vote count/retrieval date, Rotten Tomatoes film URL/critic score/review count/retrieval date, review methodology and provenance. Note unknown fields explicitly. Verify whether data and recognizable score/logo icons may be stored/distributed in this specific app.

## Review and tests
- [x] Research and propose a candidate shortlist plus alternatives for owner review
- [x] Validate 12 director identities and director credits
- [x] Present one full 10-film ranked example and review method for approval
- [x] Gather evidence and ranked selections for all approved directors
- [ ] Verify ratings rights, source stability, attribution and permitted SVG/icon usage
- [x] Deliver catalog and rationale to #57 with no fabricated film metadata
- [ ] Do not merge to main until owner/editorial and technical QA signoff

**Implementation:** [draft PR #58](https://github.com/BenWassa/hearth_v2/pull/58) currently has only 3 film starters and chronological credits; this issue authorizes research, **not** silently replacing app functionality.

## Owner-interest candidates (2026-11-22)
The owner likes Christopher Nolan and Quentin Tarantino and has heard of Francis Ford Coppola. They are documented as reserves with owner interest in `docs/collections/directors/DIRECTORS_ROSTER_STATUS.md`, with the steps needed if any are added (ranked list, API allowlist, screen copy, photo). No research has been done for them yet and the app stays at the approved 12 until the owner decides.
