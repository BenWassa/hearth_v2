# Demo State Playbook

## Purpose
This is a practical write-up of how Hearth v2 demo mode was built, plus a reusable blueprint and prompt for cloning the same approach into other products.

## Concrete: Hearth v2 implementation

### Architecture map
- Mode switch: `src/app/useConfiguredAppState.js`
- Demo seed source: `src/template/seedLibrary.js`
- Demo runtime state: `src/template/useTemplateAppState.js`
- Pre-generated metadata: `src/template/seed-media-map.json`
- Metadata generation script: `scripts/generateTemplateMediaMap.mjs`
- Demo-mode usage notes: `src/template/README.md`

### Exactly what it does
1. Central mode resolver chooses app state implementation.
   - Normal mode: `useAppState`.
   - Demo mode: `useTemplateAppState`.
   - Triggers: `VITE_HEARTH_MODE=template`, `?mode=demo`, `?mode=template`, `?demo=1`.
2. Seeds are deterministic and curated.
   - 30 titles total.
   - Stable IDs and timestamps.
   - Includes user-state defaults (`status`, `vibe`, `energy`, `note`, `episodeProgress`).
3. Demo state contract mirrors real app-state contract.
   - Same high-level handlers and flags returned to UI.
   - This avoids mode-specific branching in view components.
4. Runtime is in-memory and ephemeral.
   - Add/edit/delete/decision flows work locally.
   - Refresh resets to original seeds.
   - `hearth*` local/session storage keys are cleared in demo mode.
5. Durable side effects are blocked.
   - Import/export are intentionally disabled in demo mode.
6. Metadata strategy is hybrid.
   - Primary path: pre-generated `seed-media-map.json`.
   - Secondary path: optional runtime hydration/repair for missing metadata.
   - Rate-limit-safe fallback behavior keeps app usable under API limits.
7. Auth is sandboxed for demo safety.
   - Anonymous auth attempted when Firebase is available.
   - Non-anonymous sessions are signed out in template mode.
   - Local fallback user object is provided if needed.

### Build sequence used in this repo
This is the concrete order that made the implementation stable:
1. Added mode gate first (`useConfiguredAppState`) so all later work stayed isolated.
2. Created deterministic seed library with IDs, timestamps, and minimal defaults.
3. Implemented demo app-state adapter with parity to production hook shape.
4. Added guardrails for irreversible flows (disable import/export).
5. Added reset semantics (clear storage + in-memory source of truth).
6. Added metadata enrichment path (pre-generated map + runtime repair).
7. Added auth isolation logic so demo mode cannot accidentally run on real user sessions.
8. Documented usage and debug controls.

### Useful commands
- Run demo mode:
```bash
VITE_HEARTH_MODE=template npm run dev
```
- Trigger demo mode on hosted build:
```text
?mode=demo
```
- Regenerate metadata map:
```bash
npm run template:media-map
```

## Abstract: reusable pattern for other projects

### Core blueprint
1. Create a dedicated demo-mode resolver.
2. Keep demo runtime behind the same public state contract as production.
3. Seed deterministic, representative data for key user journeys.
4. Keep mutations local and ephemeral.
5. Make reset behavior explicit and reliable.
6. Block or stub durable operations.
7. Preload metadata snapshots when realism/performance matters.
8. Isolate auth/session behavior for safety.

### Design principles
- Contract parity over implementation parity.
- Determinism over random generation.
- Fast initial render over live fetch dependency.
- Demo safety over feature completeness.
- Explicit mode visibility in UI messaging.

### Nuance matrix you can tune per project
- Seed size: smoke test, realistic, stress.
- Data richness: minimal, partially hydrated, fully hydrated.
- Auth policy: fake user, anonymous, bypass.
- Side-effect policy: read-only, editable-no-save, editable-with-sandboxed-save.
- Reset policy: refresh reset, session reset, scheduled reset.
- Metadata policy: snapshot-only, on-demand repair, continuous sync.

### Common failure modes to avoid
- UI reads different state shapes between prod and demo.
- Hidden writes still hitting production APIs.
- Random seeds making screenshots/tests unstable.
- Demo mode sharing a real signed-in session.
- Demo-only flags scattered across many components.

## Reusable template prompt

```md
You are implementing a **demo mode** for an existing application.

Context:
- Stack: <framework/runtime>
- Current production state entry point: <hook/store/service>
- Core flows that must behave the same in demo mode: <list>
- Production backends in normal mode: <db/auth/apis>
- Constraints: <latency/security/UX/testing constraints>

Goal:
Build a realistic but safe and ephemeral demo mode.

Implementation requirements:
1. Add a centralized mode resolver using env `<ENV_MODE_KEY>` and query overrides `<params>`.
2. Add a demo-state adapter that exposes the same interface as production state.
3. Implement deterministic seed data with stable IDs/timestamps and representative records.
4. Keep demo mutations local/in-memory; prevent production writes.
5. Enforce reset semantics (refresh/session reset behavior).
6. Disable or stub durable actions (import/export/sync/destructive writes).
7. Add explicit demo-mode UI messaging.
8. Support optional metadata snapshot loading for realism/performance.
9. Add auth/session isolation guardrails for demo mode.
10. Provide run instructions and a verification checklist.

Deliverables:
- File-by-file change plan
- Final code changes
- Short rationale for architectural choices
- Verification checklist with expected outcomes

Quality bar:
- Minimal impact on production code paths.
- Repeatable behavior across runs.
- No hidden durable side effects.
```

## Acceptance checklist
- Mode switch works via env and URL query.
- Demo adapter returns expected app-state contract.
- Seed load is deterministic and complete.
- Core user flows work in-session.
- Refresh/session reset returns to baseline.
- Durable operations are blocked/stubbed.
- Auth/session isolation prevents real-account leakage.
