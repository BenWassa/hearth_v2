// @vitest-environment node
import { expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const {
  isActiveWatchlistDocument,
} = require('../../../scripts/watchlistMaintenance.cjs');
it('backfill guards retained documents, including pending removal timestamps', () => {
  expect(isActiveWatchlistDocument({ title: 'Active' })).toBe(true);
  expect(isActiveWatchlistDocument({ removedAt: 1 })).toBe(false);
  expect(
    isActiveWatchlistDocument({ removedAt: null, removedBy: 'member' }),
  ).toBe(false);
  const source = readFileSync(
    new URL('../../../scripts/backfillCollections.js', import.meta.url),
    'utf8',
  );
  expect(source).toContain(
    'watchSnap.exists && isActiveWatchlistDocument(watchSnap.data())',
  );
});
