# Issue #60 — Legendary Directors editorial ranking and ratings provenance

**Issue:** https://github.com/BenWassa/hearth_v2/issues/60  
**Parent:** [#57 Legendary Directors](https://github.com/BenWassa/hearth_v2/issues/57)  
**Status:** Open — research, content review and source/rights checks outstanding  
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
- [ ] Research and propose a candidate shortlist plus alternatives for owner review
- [ ] Validate 12 director identities and director credits
- [ ] Present one full 10-film ranked example and review method for approval
- [ ] Gather evidence and ranked selections for all approved directors
- [ ] Verify ratings rights, source stability, attribution and permitted SVG/icon usage
- [ ] Deliver catalog and rationale to #57 with no fabricated film metadata
- [ ] Do not merge to main until owner/editorial and technical QA signoff

**Implementation:** [draft PR #58](https://github.com/BenWassa/hearth_v2/pull/58) currently has only 3 film starters and chronological credits; this issue authorizes research, **not** silently replacing app functionality.