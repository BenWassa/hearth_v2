# Firebase loading measurement

Baseline: origin/main 58c2506; branch perf/firebase-lazy-load. Builds used the six synthetic FIREBASE_* values supplied in the task. No .env or credentials were read. Sizes are bytes, using Node gzipSync independently per file (not transfer timing).

## Result

Initial JS (entry plus HTML modulepreloads): **679969 raw / 207581 gzip → 246920 raw / 78351 gzip**. Firebase in that set: **356055 raw / 107466 gzip → 0 / 0**. The earlier ~356 kB raw estimate is supported; gzip here is ~107.5 kB, consistent with the ~107 kB estimate. Vite’s printed gzip estimates differ slightly (~108.5 kB baseline); the tables consistently use Node gzipSync. These are render-blocking module dependencies before the change, not a browser measurement of first paint. CSS and firebase-config.js are additional resources.

Both routes now use React.lazy/Suspense with the same loading screen. The real route still loads Firebase immediately when selected; its requests may start before the browser paints, but the loading screen no longer waits for Firebase download/evaluation. No idle delay is imposed on auth restoration. Total Firebase bytes are essentially unchanged; this is deferred loading, not SDK removal.

App.jsx previously imported useAppState.js, which eagerly imported client.js, auth.js, spaces.js and watchlist.js. FirebaseApp.jsx now owns that unchanged state hook behind the route import. authClient.js retains the existing synchronous return, 500 ms delayed-config callback, getAuth, and config-validation behavior. client.js adds Firestore and publishes auth/db together. Auth persistence/sign-in/listeners and the shelf subscription effect remain unchanged. Existing template sign-out/anonymous-auth behavior is retained.

Vite 8 uses rolldownOptions.output.codeSplitting.groups (not manualChunks). Previously Firestore's higher-priority group absorbed common Firebase dependencies, so Auth imported Firestore. The shared group now explicitly matches app/component/logger/util/interop packages at higher priority. Auth and Firestore retain separate groups. No blanket modulepreload suppression is used.

## Initial JS resources

/firebase-config.js remains a synchronous classic script in both builds; its generated synthetic contents are identical. The module entry and every HTML modulepreload are listed below. The stylesheet is also synchronous and appears in the chunk tables.

Before:

- index-ikDzNS3L.js
- rolldown-runtime-DF2fYuay.js
- vendor-firebase-firestore-BGT_19_J.js
- vendor-firebase-B9kWYu3T.js
- vendor-firebase-auth-9UzTofWJ.js
- vendor-react-4g-36B_S.js
- vendor-lucide-DVVIXEFy.js
- constants-DHbmz1Rv.js

After:

- index-Ds59fyA3.js
- rolldown-runtime-DF2fYuay.js
- vendor-react-4g-36B_S.js
- vendor-lucide-DVVIXEFy.js
- constants-DHbmz1Rv.js

## Import graph verification

Browser QA of the earlier build found that the demo still fetched FirebaseApp and Firestore (241,933 bytes). Its static closure alone did not prove request isolation: both dynamic imports shared one lazy callback, and Vite combined their preload dependencies. The route condition now selects between two separate lazy callbacks, preserving the selected component and Suspense fallback.

Rebuilt with the six synthetic FIREBASE_* values above. Inspected the emitted entry `index-Cc7l-z1k.js` and resolved each import call's own `__vite__mapDeps` indices against its filename table. The template list contains neither FirebaseApp nor vendor-firebase-firestore; the real-app list contains FirebaseApp, Firestore, Auth and common Firebase. The shared filename table still contains both routes, but only the selected call's indices are preloaded. This is emitted-code verification; browser network timing and persisted sessions were not re-tested.

Parsed static imports recursively with es-module-lexer. The shell static closure contains no Firebase. The template static closure contains Auth/common Firebase and excludes FirebaseApp/Firestore. Template seed data remains outside the initial shell.

Shell static closure:

- index-Cc7l-z1k.js
- rolldown-runtime-DF2fYuay.js
- vendor-react-4g-36B_S.js
- vendor-lucide-DVVIXEFy.js
- constants-DHbmz1Rv.js

Template static closure:

- TemplateApp-iR8Q7kWW.js
- rolldown-runtime-DF2fYuay.js
- vendor-react-4g-36B_S.js
- constants-DHbmz1Rv.js
- vendor-lucide-DVVIXEFy.js
- index-Cc7l-z1k.js
- metadata-Cn2lvJRh.js
- requestPacer-Buzs1RNQ.js
- vendor-firebase-BLd9QWpj.js
- vendor-firebase-auth-CMtNxf_6.js
- client-CjJIsJ75.js

Template preload list (`__vite__mapDeps([19, 1, 20, 21, 3, 22, 5, 2, 6, 8])`):

- TemplateApp-iR8Q7kWW.js
- rolldown-runtime-DF2fYuay.js
- vendor-firebase-BLd9QWpj.js
- vendor-firebase-auth-CMtNxf_6.js
- vendor-react-4g-36B_S.js
- requestPacer-Buzs1RNQ.js
- constants-DHbmz1Rv.js
- vendor-lucide-DVVIXEFy.js
- metadata-Cn2lvJRh.js
- client-CjJIsJ75.js

Real-app preload list (`__vite__mapDeps([23, 1, 20, 24, 21, 3, 22, 5, 2, 17, 6, 8, 7])`):

- FirebaseApp-CRUK3KeC.js
- rolldown-runtime-DF2fYuay.js
- vendor-firebase-BLd9QWpj.js
- vendor-firebase-firestore-B5VzRZmk.js
- vendor-firebase-auth-CMtNxf_6.js
- vendor-react-4g-36B_S.js
- requestPacer-Buzs1RNQ.js
- constants-DHbmz1Rv.js
- vendor-lucide-DVVIXEFy.js
- importer-Cy6ohQMS.js
- metadata-Cn2lvJRh.js
- client-CjJIsJ75.js
- showData-CtzykTe5.js

## Before: every emitted JS/CSS chunk

| Chunk | Raw bytes | Gzip bytes |
|---|---:|---:|
| AddView-DC1WDnY0.js | 13837 | 4354 |
| Button-CzHg6dZU.js | 917 | 511 |
| DecisionView-B6wfkbVZ.js | 4049 | 1499 |
| ImportModal-C-3lFINp.js | 18618 | 5879 |
| ItemDetailsModal-CMGQZvx4.js | 51912 | 15552 |
| MetadataAuditModal-BH72DuE_.js | 5502 | 1624 |
| SagaPage-BpjjcMGC.js | 12752 | 4220 |
| ShelfView-BP6Ly90c.js | 15707 | 4557 |
| SpaceSwitcherModal-DX7PvJlX.js | 4202 | 1690 |
| TemplateApp-BtI7xOz0.js | 1178750 | 333979 |
| TextArea-C6gaAxXO.js | 523 | 332 |
| WipeConfirmModal-BvU0Ys4I.js | 2660 | 1112 |
| constants-DHbmz1Rv.js | 1734 | 799 |
| index--XHNR3Ej.css | 56059 | 10392 |
| index-ikDzNS3L.js | 173296 | 50981 |
| rolldown-runtime-DF2fYuay.js | 558 | 356 |
| vendor-firebase-B9kWYu3T.js | 90 | 100 |
| vendor-firebase-auth-9UzTofWJ.js | 86247 | 25148 |
| vendor-firebase-firestore-BGT_19_J.js | 269718 | 82218 |
| vendor-lucide-DVVIXEFy.js | 8443 | 3189 |
| vendor-react-4g-36B_S.js | 139883 | 44790 |

## Earlier build: every emitted JS/CSS chunk (before preload correction)

| Chunk | Raw bytes | Gzip bytes |
|---|---:|---:|
| AddView-B2w6Gx9q.js | 13838 | 4353 |
| Button-zVuF6Mqu.js | 917 | 511 |
| DecisionView-BvX2xH9p.js | 4054 | 1499 |
| FirebaseApp-Cc6QCSOM.js | 51747 | 15662 |
| ImportModal-BKFwDWKf.js | 18651 | 5889 |
| ItemDetailsModal-Xlis6jJs.js | 51979 | 15578 |
| MetadataAuditModal-DbWQE8NW.js | 5502 | 1623 |
| SagaPage-DPn2Duhp.js | 12781 | 4233 |
| ShelfView-Bcpi-R1a.js | 15664 | 4550 |
| SpaceSwitcherModal-BSw0DzYO.js | 4202 | 1690 |
| TemplateApp-IvE97IEp.js | 1178812 | 334011 |
| TextArea-CyseFr18.js | 523 | 332 |
| WipeConfirmModal-CA52tKo9.js | 2660 | 1112 |
| client-CjJIsJ75.js | 3330 | 1405 |
| constants-DHbmz1Rv.js | 1734 | 799 |
| importer-Cy6ohQMS.js | 8284 | 2637 |
| index--XHNR3Ej.css | 56059 | 10392 |
| index-Ds59fyA3.js | 96302 | 29217 |
| metadata-Cn2lvJRh.js | 5497 | 1822 |
| requestPacer-Buzs1RNQ.js | 6402 | 2504 |
| rolldown-runtime-DF2fYuay.js | 558 | 356 |
| showData-CtzykTe5.js | 2772 | 1080 |
| vendor-firebase-BLd9QWpj.js | 27763 | 9212 |
| vendor-firebase-auth-CMtNxf_6.js | 86236 | 25155 |
| vendor-firebase-firestore-B5VzRZmk.js | 241933 | 73418 |
| vendor-lucide-DVVIXEFy.js | 8443 | 3189 |
| vendor-react-4g-36B_S.js | 139883 | 44790 |

## Validation

- npm run format:check: passed.
- npm run lint:ci: passed.
- npm run test: 376 unit/component tests (58 files) and 35 API tests passed.
- Added bootstrap tests for immediate config, delayed config, invalid config/offline, preserved auth object, and auth-only demo initialization without Firestore; a rendering test checks that onboarding remains hidden while auth/bootstrap are unresolved.
- Production build: passed with the requested synthetic config. Existing Browserslist and optimizeDeps deprecation notices remain.
- World-art capture attempted with the specified PLAYWRIGHT_MODULE and synthetic config; failed before browser launch because preview cannot bind 127.0.0.1:4173 (sandbox EPERM). No capture result is claimed.
- graphify update .: completed (AST-only). Initial GRAPH_REPORT.md/wiki were absent.
- Generated public/sw.js, public/version.json and src/version.js restored byte-for-byte from HEAD after builds. The requested git checkout was attempted but could not create the worktree index.lock outside the writable sandbox, so git show HEAD:<path> supplied the identical file contents. No commit made.
