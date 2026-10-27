import { describe, expect, it } from 'vitest';
import { activityScore } from './tonightActivity.js';

const now = new Date('2026-10-27T12:00:00.000Z');

describe('activityScore', () => {
  it('does not boost metadata-only updatedAt changes', () => {
    const baseline = activityScore({}, { now });
    const edited = activityScore(
      { updatedAt: '2026-10-27T11:00:00.000Z' },
      { now },
    );

    expect(edited).toBe(baseline);
    expect(edited).toBe(0);
  });

  it('scores a recent deliberate add higher than an old add', () => {
    const recent = activityScore(
      { additionOrigin: 'manual', createdAt: '2026-10-26T12:00:00.000Z' },
      { now },
    );
    const old = activityScore(
      { additionOrigin: 'manual', createdAt: '2026-09-27T12:00:00.000Z' },
      { now },
    );

    expect(recent).toBeGreaterThan(old);
    expect(recent).toBeGreaterThan(0);
  });

  it('scores a recent watch event higher than an old one', () => {
    const recent = activityScore(
      {
        userState: {
          status: 'watched',
          markedWatchedAt: '2026-10-26T12:00:00.000Z',
        },
      },
      { now },
    );
    const old = activityScore(
      { status: 'watched', markedWatchedAt: '2026-09-27T12:00:00.000Z' },
      { now },
    );

    expect(recent).toBeGreaterThan(old);
  });

  it('returns zero when activity data is missing', () => {
    expect(activityScore({}, { now })).toBe(0);
  });

  it('returns zero for invalid timestamps', () => {
    expect(
      activityScore(
        {
          additionOrigin: 'manual',
          createdAt: 'not-a-date',
          status: 'watched',
          markedWatchedAt: { seconds: 'invalid' },
        },
        { now },
      ),
    ).toBe(0);
  });

  it('is deterministic for a fixed now and supports Firestore timestamps', () => {
    const item = {
      additionOrigin: 'manual',
      createdAt: { seconds: Date.parse('2026-10-26T12:00:00.000Z') / 1000 },
    };

    expect(activityScore(item, { now })).toBe(activityScore(item, { now }));
  });
});
