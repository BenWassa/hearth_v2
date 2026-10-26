# Collections validation

The feature branch is isolated from the pre-existing UI/performance edits in the shared workspace.

- `npm test`: 28 suites, 139 unit tests; 25 API tests, all passing.
- `npm run lint:ci`: passes with zero warnings.
- `npm run build`: passes. Existing large-bundle warning remains on the base application; this feature adds no dependency.
- `graphify update .`: completes with AST extraction and no LLM calls. Generated graph output is ignored by Git.
- Native-browser review: 320×844, 390×844, 448×844. Document and Collections widths equal viewport widths. Browser search, clear, World entry, direct singleton entry, saga entry and Escape/focus return exercised. New browse controls measure at least 44px high.
- Actual TMDB collection/search APIs used to verify the taxonomy and freeze fixture metadata. Full saga provider loading and shelf-only failure fallback both reviewed.

Automated scenarios cover 0/1/3/5/25/50/75 sagas, recent Avengers watches, clustered Harry Potter additions, completed and dormant sagas, imports, undo, repeated shared status writes, notes/metadata, future and missing dates, missing Worlds, concentrated/dispersed Worlds, search/A–Z, live order preservation, nested dialog return and 50 queued provider calls with failures (maximum active: three).

The Firestore transaction behavior is unit-tested against controlled SDK mocks. No production household records were modified; no destructive migration is needed. Multi-device contention has not been exercised against a live database.

## Screenshots

All captures use the isolated feature branch and synthetic 25-saga household.

| Surface | 320px | 390px | 448px |
| --- | --- | --- | --- |
| Tonight | [capture](screenshots/tonight-320.jpg) | [capture](screenshots/tonight-390.jpg) | [capture](screenshots/tonight-448.jpg) |
| Overview | [capture](screenshots/overview-320.jpg) | [capture](screenshots/overview-390.jpg) | [capture](screenshots/overview-448.jpg) |
| World | [capture](screenshots/world-320.jpg) | [capture](screenshots/world-390.jpg) | [capture](screenshots/world-448.jpg) |
| Saga | [capture](screenshots/saga-320.jpg) | [capture](screenshots/saga-390.jpg) | [capture](screenshots/saga-448.jpg) |

![Tonight at 390px](screenshots/tonight-390.jpg)
![Collections at 390px](screenshots/overview-390.jpg)
![Marvel at 390px](screenshots/world-390.jpg)
![Avengers at 390px](screenshots/saga-390.jpg)
