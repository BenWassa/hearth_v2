# ADR 0001: Repo Split Timing for Dynamic Backend Migration

## Status

Accepted

## Context

The migration introduces backend API runtime, schema changes, and deployment changes.
Splitting into a new repository too early increases coordination overhead while contracts are still evolving.

## Decision

Keep the migration in the current repository until after Sprint 7 (Vercel cutover) is stable.

Trigger for split:
- Sprint 7 completed
- One stable production cycle completed on dynamic runtime
- CI/CD and secret management plan documented

Then perform optional Sprint 8 repo extraction.

## Consequences

Positive:
- Faster iteration while API and schema contracts settle
- Less CI/CD duplication during high-churn phase
- Easier rollback to existing baseline during cutover period

Negative:
- Main repo remains mixed-purpose longer
- Requires temporary discipline to avoid unrelated churn conflicts

## Notes

This decision can be revisited only if a hard ownership boundary is needed before Sprint 7.
