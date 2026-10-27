---
name: release
description: Release Hearth from an approved integration branch through version bump, generated build metadata, quality gates, annotated tag, main fast-forward, and production rollout verification.
---

# Hearth release workflow

Use this skill when preparing or executing a Hearth release. A release merge to
`main` triggers Firebase App Hosting's production rollout. Treat a pushed tag or
merged commit as a rollout trigger, not proof that production is live.

## Preconditions

- Start from the approved integration/release branch and inspect `git status`,
  recent commits, remotes, and the current `main` relationship. Do not discard
  unrelated working-tree changes.
- Confirm the intended semver bump with the release owner when it is not already
  specified. Hearth uses `patch`, `minor`, or `major`.
- Review release-specific blockers, licensing notes, migration requirements,
  secrets, and `docs/DEPLOYMENT.md`. A release may include the entire integration
  branch, so review the full diff from `main`.

## Version and validation

1. Run `node scripts/versioning.js bump <patch|minor|major>`. This updates
   `package.json` and `package-lock.json`.
2. Run `node scripts/versioning.js generate`. This updates `src/version.js`,
   `public/version.json`, and the service worker version/build identifiers.
3. Run `node scripts/versioning.js check` and confirm the five version files
   agree: `package.json`, `package-lock.json`, `src/version.js`,
   `public/version.json`, and `public/sw.js`.
4. Run the repository release gates: `npm run lint`, `npm run format:check`,
   `npm run check:lockfile`, `npm run test:unit`, `npm run test:api`, and
   `npm run build`. Record results and resolve failures before release.
5. Review `git diff`, including generated metadata and the full branch diff.
   Ensure no secrets, local files, or unrelated work are included.

## Commit, tag, and deploy

1. Commit the release changes on the approved integration branch using the
   repository's release message convention, for example `release: vX.Y.Z`.
2. Create an annotated tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`.
3. Push the approved integration branch and tag to `origin`.
4. Fast-forward `main` to the release commit only when it is a clean fast-forward
   and the owner has authorized the production rollout. Push `main` to trigger
   App Hosting's automatic deployment. Stop and report if `main` has diverged.

## Rollout verification

- Poll the production `/version.json` with cache-busting until its `version`
  and `buildId` identify the release commit, or until the agreed rollout limit
  expires (15 minutes by default).
- Report the deployed version/build ID and time only after the endpoint confirms
  it. If the rollout limit expires, report that deployment is unconfirmed and
  continue diagnosis; never label a pushed release as live.
- Run the production smoke checks from `docs/DEPLOYMENT.md`, including app load,
  `/api/health`, search/details, and the primary add flow when practical. Do not
  perform a manual production data mutation as a smoke test.
- If production fails, follow the rollback runbook and notify the owner before
  changing production state.

## Gemini feature gate

Gemini is optional and server-only. Do not enable production calls or approve
metadata sharing as a routine release step. Production requires an owner-approved
rights decision for the public metadata sent to Google, an available model and
quota confirmed in the target AI Studio project, the key in App Hosting Secret
Manager, and runtime configuration for `GEMINI_MODEL`,
`GEMINI_CLASSIFICATION_ENABLED=true`,
`GEMINI_METADATA_SHARING_APPROVED=true`, and a bounded daily request limit.
Never put the key in source, `apphosting.yaml` as a literal, or a command line.
Follow `docs/open/issue-020-implementation-record.md` and run its small pilot
before any broader rollout. Keep inference disabled if any gate is unresolved.
