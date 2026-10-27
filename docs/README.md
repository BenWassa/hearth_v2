# Issue documentation

Hearth keeps a **Markdown planning/decision record for every GitHub issue**, grouped by current GitHub status.

- [Open issue records](open/) — active problems, product analysis, design decisions, scenarios, checklists.
- [Closed issue records](closed/) — verified work and historical closed issue summaries.

The canonical task status is the **GitHub issue**. These files are durable research, design, implementation, and verification records that can be reviewed in the repository alongside code. Treat docs as synchronized manually when issues change state.

## Naming and lifecycle

- Create the GitHub issue first to get a stable number.
- Create **one** file at `docs/open/issue-NNN-concise-slug.md` (zero-padded number, e.g. `issue-007-tonight-mece-rows.md`), and link the issue and document to each other.
- Include issue URL, status, date, scope, relevant code paths, problem, options/decisions, risks, tests, and acceptance/verification notes. Do not assert work is finished before it is verified.
- Update the document as work proceeds; keep GitHub acceptance checklists aligned.
- After verifying and closing the GitHub issue, **move** (do not duplicate) the file to `docs/closed/` and update its status/date. Update any links to the old path in GitHub or other documentation. Reverse the move if reopened.
- When backfilling old issues, preserve what was actually recorded. Distinguish original issue facts from new suggestions and note missing verification evidence.
- A proposal document does **not** mean the application implementation has changed.

## Current records (2026-10-27)

| GitHub issue | Status | Record |
| --- | --- | --- |
| [#20 Automatic classification](https://github.com/BenWassa/hearth_v2/issues/20) | Open | [TMDB-first zero-friction Add + optional Gemini](open/issue-020-automatic-classification.md) |
| [#14 World asset integration](https://github.com/BenWassa/hearth_v2/issues/14) | Closed | [Landscape Tonight + direct one-tap hero](closed/issue-014-world-art-integration.md) |
| [#13 Galaxy / magic World art](https://github.com/BenWassa/hearth_v2/issues/13) | Closed | [Star Wars / Wizarding World / Ghibli pack](closed/issue-013-world-art-galaxy-magic.md) |
| [#12 Animation World art](https://github.com/BenWassa/hearth_v2/issues/12) | Closed | [Pixar / Disney / DreamWorks pack](closed/issue-012-world-art-animation.md) |
| [#11 Superhero World art](https://github.com/BenWassa/hearth_v2/issues/11) | Closed | [Marvel / DC pack](closed/issue-011-world-art-superhero.md) |
| [#10 World visual production contract](https://github.com/BenWassa/hearth_v2/issues/10) | Closed | [Approved D2 contract and lane coordination](closed/issue-010-world-art-direction-d2.md) |
| [#7 Tonight: MECE rows](https://github.com/BenWassa/hearth_v2/issues/7) | Open | [Tonight taxonomy and scenario tests](open/issue-007-tonight-mece-rows.md) |
| [#6 Collections browser](https://github.com/BenWassa/hearth_v2/issues/6) | Closed | [Scalable saga navigation](closed/issue-006-collections-browser.md) |
| [#3 Episode metadata refresh](https://github.com/BenWassa/hearth_v2/issues/3) | Closed | [Historical episode metadata issue](closed/issue-003-episode-release-metadata.md) |

This index is curated, not automatically generated. Future issues should receive records using the same structure.
