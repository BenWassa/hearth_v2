# Agent status board

One shared place for the agents working in this repo at the same time (Claude Code, Codex) to say what they own, what state it is in, and when they are done. Keep each entry short. Update your own section only. Times are local.

## Rules

1. Each workstream lists the files it owns. Do not edit, revert, stage or commit another workstream's files.
2. Files listed under "Shared files" are edited by more than one workstream. Re-read the file right before editing it, keep edits small, and stage only your own hunks when committing (`git add -p`, or apply a filtered patch with `git apply --cached`).
3. Commit only your own files. Never `git add -A` while another workstream shows IN PROGRESS.
4. When you finish, set your State to `DONE`, fill in "Finished", and list anything the other workstream needs to know (new exports, renamed files, tests you could not run).
5. Do not run `git checkout`, `git stash` or `git reset` on files outside your list.

## Workstream: Worlds (Claude Code)

- **State:** DONE for the Tonight Worlds brand rail (committed in 1c1593c). Only the dev sandbox below is left uncommitted.
- **Goal:** World pages redesign (done and committed in 87df05b), then Tonight Worlds as a single finite horizontal brand rail in fixed order (Pixar, Marvel, Star Wars, Wizarding World, Disney, DreamWorks, DC, Studio Ghibli), adaptive weekly picks retired, plus wordmark width updates and a dev-only layout sandbox.
- **Owns:**
  - `src/config/collectionWorlds.js` and `.test.js`
  - `src/views/components/tonight/WorldsRail.jsx` (renamed from `WorldsGrid.jsx`), `useTonightWorlds.js`, `CollectionsRail.jsx`
  - `src/components/cards/WorldCover.jsx` and `.test.jsx`
  - `src/views/CollectionsBrowseView.test.jsx`
  - `src/dev/` and `worlds-mock.html` (dev-only sandbox, never part of the production build)
  - `DESIGN.md`, `PRODUCT.md`, `COLLECTIONS_REDESIGN.md` (Worlds and Collections sections only)
  - `docs/collections/WORLD_PAGE_*.md`
- **Shared files I also touch (small edits):** `src/views/TonightView.jsx` (the Worlds import and placement only), `src/views/TonightView.test.jsx`.
- **Finished:** 2026-10-26, rail verified in a clean worktree (lint, prettier, 316 tests, production build, 320 to 1280 px browser check) and committed with only my hunks.
- **Still uncommitted and mine:** `src/dev/`, `worlds-mock.html` (layout sandbox, now obsolete because the chosen variant shipped; will be deleted or committed on the user's word).
- **Notes for others:** `WorldsGrid` was renamed to `WorldsRail`; if you import it, use the new path. Production behavior of the Collections row now depends on `useTonightWorlds`.

## Workstream: Classification and import (Codex, other session)

- **State:** DONE and committed in `632f84c`. Optional Gemini rollout remains gated on model configuration, rights review and the live editorial pilot.
- **Goal:** Implement issue #20: automatic viewing facets, optional server-only Gemini, safe resumable backfill, tag-free add/import, and unique Tonight assignment.
- **Owns:**
  - `api/_lib/mappers/mediaMapper.js`, `api/_lib/providerClient.js`, `api/_lib/classificationService.js`, `api/_lib/geminiClassifier.js`, `api/media/classify.js`, `api/__tests__/classification.test.js`
  - `server/app.js`
  - `src/app/useAppState.js`, `src/domain/import/importer.js`, `src/domain/media/schema.js`, `src/domain/media/classification.mjs`, `classification.test.js`, `tonightClassification.js`
  - `src/services/firebase/watchlist.js`, `src/services/mediaApi/classificationQueue.js`
  - `src/components/ItemDetailsModal.jsx` and `.test.jsx`, `src/importer.test.js`
  - `src/views/AddView.jsx`, `AddView.integration.test.jsx`, `ImportModal.jsx`, `ImportModal.test.jsx`
  - `src/views/components/tonight/TonightHeaderMenu.jsx` and `.test.jsx`
- **Shared files:** `src/views/TonightView.jsx` (classification allocation only). Kept the committed WorldsRail import and placement. No edits to TonightView.test.jsx.
- **Finished:** 2026-10-26. Implementation commit: `632f84c` (Automate shelf classification and guard data deletion). 353 unit tests + 33 API tests pass, lint zero warnings, production build, Add/details browser checks at 320/390/448 px, graphify updated.
- **Notes for others:** Additional owned files: classificationQueue.test.js, classificationFixtures.json, scripts/evaluateClassification.cjs, scripts/correctClassification.cjs, docs/open/issue-020-*, issue-007 integration note, public/tmdb-logo.svg, .env.api.example, apphosting.yaml (commented optional configuration), watchlist.test.js, template/useTemplateAppState.js and its worldMetadata regression. Local GEMINI_API_KEY presence verified in ignored .env.local; pilot loader now matches server env-file precedence. No model or enablement flags configured locally. User reports the Firebase key is added. No deployment, production backfill, push, or live Gemini inference call. See docs/open/issue-020-automatic-classification.md for scope and remaining external validation. Implementation and scope documents are committed; this status update follows that commit. Leave the other workstream’s dev sandbox and the untracked Studio Franchise Logo Grid.png untouched.

## Shared files (edited by more than one workstream)

| File | Worlds edits | Other edits |
|---|---|---|
| `src/views/TonightView.jsx` | Worlds rail import and placement (already committed in 1c1593c); the rest of this file's uncommitted diff is not mine | Classification allocator import and thematic assignment, committed in `632f84c` |
| `src/views/TonightView.test.jsx` | mock path for the Worlds rail (already committed in 1c1593c) | No classification-workstream changes |

## Commit log (append when you commit)

- 87df05b Worlds: redesign World pages, saga page, Tonight art tiles (Claude Code)
- 77de10d Build metadata refresh (Claude Code)
- 1c1593c Show every World in one finite brand rail on Tonight (Claude Code; staged with `git apply --cached`, other workstream's hunks left unstaged)

- 632f84c Classification and Settings: automatic facets, optional Gemini pipeline, safe backfill, tag-free Add/import, unique Tonight placement, Data deletion dropdown, tests and scope records (Codex).
