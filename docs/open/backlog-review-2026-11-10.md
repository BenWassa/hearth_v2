# Backlog review — 2026-11-10

Reviewed the four open GitHub issues, two open PRs, current main (`854fc4b`), and the #55 planning branch. This is a local review record; no GitHub status, deployment or household data was changed.

## Priority and next actions

| Order | Work | Evidence and next action |
| --- | --- | --- |
| 1 | [#55 Curated collections](https://github.com/BenWassa/hearth_v2/issues/55), [draft #56](https://github.com/BenWassa/hearth_v2/pull/56) | Main new feature. Start with a disabled-by-default, read-only editorial-pack shell. Keep verified content and safe saves as separate milestones. |
| 2 | [PR #34 Firebase loading](https://github.com/BenWassa/hearth_v2/pull/34) | Open performance work reports initial gzip JS reduction from 207.6 to 78.4 kB. Those are PR-reported measurements, not independently reproduced here. Rebase/review against current main, then verify real login, persisted-session reload and join-by-link before merging. |
| 3 | [#22 Android back](https://github.com/BenWassa/hearth_v2/issues/22) | Implemented in #23 and shared by real/template state. Re-ran history suite: 23/23 pass. Remaining closure gate is actual Pixel gesture QA, including root exit and reload. No device test performed here. |
| 4 | [#21 Gemini evaluation](https://github.com/BenWassa/hearth_v2/issues/21) and [#20 classification](https://github.com/BenWassa/hearth_v2/issues/20) | Issue summaries lag merged work. #48 records the passing 50-title evaluation; #49 enables Gemini 3.8 Flash, low thinking, 20-second timeout, 20 calls/day. Reconcile checklists and record production smoke/quota/rights evidence before closure; do not repeat the old pilot merely because its checklist is stale. |

## #55 implementation slices

1. **Read-only shell:** distinct editorial-pack type and registry; text-first 2:3 tile pinned first in existing Tonight Collections; render when there are packs but no sagas; separate Curated collections group in All collections; dedicated page and chapter/index navigation. Gate unpublished content. Preserve Sagas and Worlds.
2. **Content ledger:** pin the BE source revision, inventory all 50 source entries, verify exact movie identities, track inclusion decisions, chapter placement, featured selection, claim citations and rights separately. No public release entries until vetted. Do not treat source rankings as consensus.
3. **Verified film previews:** fetch details on demand using verified identities, reuse permitted TMDB art and attribution, distinguish owned/unsaved/removed entries, and handle unavailable details. Avoid eagerly hydrating 50 titles.
4. **Voluntary saves:** strict verified-add boundary, accurate added/exists/restored outcomes, explicit restore confirmation, preserved watched/progress/notes state, retryable partial failures. Optional multi-select follows a working single-film path.

For the shell, verify empty-library reachability, all chapter links, browser Back, focus and Tonight scroll restoration, safe areas and 320/360/390/448px layouts. For saves, verify duplicate races, removed entries and retries. A standalone prototype cannot establish application navigation or persistence acceptance.

## Planning inconsistencies to resolve during #55 review

- The issue and blueprint defer generated images, while later blueprint sections link artwork prompts and a prototype with concept imagery. Follow the issue's text-first implementation scope until the owner explicitly selects assets. Do not import exploratory assets.
- The prototype HTML is described as available in a separate conversation and is not committed. Its screenshots and stated checks are insufficient to reproduce or approve the final UI.
- Editorial/Compact is a prototype comparison, not a production preference. Performer pages and separate curated rails remain future decisions.
- A read-only shell can be developed before identity verification, but showing unvetted films publicly or enabling saves must remain gated. Do not let a flag bypass the content ledger requirements.

## Review limits

No live Gemini calls, provider quota checks, production smoke tests, authenticated browser checks or Pixel tests were performed. The untracked `Warm Flame and Books Icon.png` was left untouched. Planning PR #56 remains unmerged; its documents were reviewed remotely rather than copied into main.
