# Agent status board

One shared place for the agents working in this repo at the same time (Claude Code, Codex) to say what they own, what state it is in, and when they are done. Keep each entry short. Update your own section only. Times are local.

## Rules

1. Each workstream lists the files it owns. Do not edit, revert, stage or commit another workstream's files.
2. Files listed under "Shared files" are edited by more than one workstream. Re-read the file right before editing it, keep edits small, and stage only your own hunks when committing (`git add -p`, or apply a filtered patch with `git apply --cached`).
3. Commit only your own files. Never `git add -A` while another workstream shows IN PROGRESS.
4. When you finish, set your State to `DONE`, fill in "Finished", and list anything the other workstream needs to know (new exports, renamed files, tests you could not run).
5. Do not run `git checkout`, `git stash` or `git reset` on files outside your list.

## Active workstreams

- **Android back navigation (#22, PR #23)** — branch `fix/android-back-navigation`. Owns `src/app/useViewHistory*`, history wiring in `src/app/useAppState.js`. State: IN PROGRESS (findings fix after review; manual Pixel QA pending with the owner).
- **Gemini pilot quality (#21, PR #24)** — branch `codex/issue-21-gemini-pilot-quality`. Owns the classification evaluator, Gemini classifier, fixtures and `docs/open/issue-021-*`. State: DRAFT, gated on human fixture approval and owner-approved live runs.
- **Tonight composition (#7)** — branch `feat/tonight-composition`. Owns `src/domain/media/tonightComposition*`, `tonightActivity*`, `tonightClassification*` and the `TonightView.jsx` rewire. State: IN PROGRESS.

## Completed (archived 2026-10-27)

- Worlds redesign, World pages, saga page and Worlds rail (Claude Code): 87df05b, 1c1593c, 3932db2, shipped in v3.16.0.
- Classification and import (Codex): 632f84c, shipped in v3.16.0 with Gemini disabled in production.
- Superseded art PRs #15-#18 and #9 closed 2026-10-27; unused art archived under `archive/art-worlds-*` tags.

## Shared files (edited by more than one workstream)

| File | Notes |
|---|---|
| `src/views/TonightView.jsx` | Tonight composition rewire (#7); re-read before editing |
| `docs/README.md` | issue index; add a row when you add a record |

## Notes

`Studio Franchise Logo Grid.png` in the repo root is the designer's source sheet; it is untracked and excluded locally, never commit it.
