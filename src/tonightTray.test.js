import { buildTonightTray } from './domain/watchlist';

const makeItem = (id, energy) => ({ id, energy });

describe('buildTonightTray', () => {
  it('returns one of each energy when available', () => {
    const unwatched = [
      makeItem('l1', 'light'),
      makeItem('b1', 'balanced'),
      makeItem('f1', 'focused'),
      makeItem('l2', 'light'),
    ];

    const tray = buildTonightTray(unwatched, () => 0);

    expect(tray).toEqual([unwatched[0], unwatched[1], unwatched[2]]);
  });

  it('fills remaining slots from the pool', () => {
    const unwatched = [
      makeItem('l1', 'light'),
      makeItem('b1', 'balanced'),
      makeItem('x1', null),
    ];

    const tray = buildTonightTray(unwatched, () => 0);

    expect(tray).toEqual(unwatched);
  });
});
