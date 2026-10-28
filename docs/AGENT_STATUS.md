# Agent status board

One shared place for the agents working in this repo at the same time (Claude Code, Codex) to say what they own, what state it is in, and when they are done. Keep each entry short. Update your own section only. Times are local.

## Rules

1. Each workstream lists the files it owns. Do not edit, revert, stage or commit another workstream's files.
2. Files listed under "Shared files" are edited by more than one workstream. Re-read the file right before editing it, keep edits small, and stage only your own hunks when committing (`git add -p`, or apply a filtered patch with `git apply --cached`).
3. Commit only your own files. Never `git add -A` while another workstream shows IN PROGRESS.
4. When you finish, set your State to `DONE`, fill in "Finished", and list anything the other workstream needs to know (new exports, renamed files, tests you could not run).
5. Do not run `git checkout`, `git stash` or `git reset` on files outside your list.

## Active workstreams (2026-10-28)

- **Gemini pilot quality (#21, draft PR #24)** — branch `codex/issue-21-gemini-pilot-quality`. Owns the classification evaluator, Gemini classifier, fixtures and `docs/open/issue-021-*`. State: DRAFT; needs owner fixture review and owner-approved live runs. #20 is implemented but rollout/closure remains gated on #21.
- **Firebase lazy load (draft PR #34)** — branch `perf/firebase-lazy-load`. Owns Firebase lazy-loading work. State: DRAFT, open.
- **Android back navigation (#22)** — implementation merged in PR #23. State: AWAITING OWNER QA; issue stays open until the owner's manual Pixel check. Record: `docs/open/issue-022-android-back-navigation.md`.

## Completed (archived 2026-10-28)

- Android back navigation implementation — PR #23 merged; manual Pixel QA remains active under #22.
- PR #25 merged.
- Tonight rows — PR #26 merged, delivering #7. Both #7 records moved to `docs/closed/`; mood-row cap of 5/6 awaits owner confirmation.
- Quiet console — PR #27 merged.
- Shelf auto grouping — PR #28 merged.
- Batch backfill — PR #29 merged.
- Issue #20 hardening — PR #31 merged; #20 remains open and gated on #21.
- Remove three — PR #32 merged.
- Add duplicate feedback — PR #33 merged.
- Worlds redesign, World pages, saga page and Worlds rail (Claude Code): 87df05b, 1c1593c, 3932db2, shipped in v3.16.0.
- Classification and import (Codex): 632f84c, shipped in v3.16.0 with Gemini disabled in production.
- Superseded art PRs #15-#18 and #9 closed 2026-10-27; unused art archived under `archive/art-worlds-*` tags.

## Shared files (edited by more than one workstream)

| File             | Notes                                        |
| ---------------- | -------------------------------------------- |
| `docs/README.md` | issue index; add a row when you add a record |

## Notes

`Studio Franchise Logo Grid.png` in the repo root is the designer's source sheet; it is untracked and excluded locally, never commit it.
