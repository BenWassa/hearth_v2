import { describe, expect, it } from 'vitest';
import { CURATED_PACKS, getCuratedPacks } from './curatedPacks';

describe('curated packs config', () => {
  it('contains the complete draft Black Comedy Excellence collection with valid references', () => {
    const [pack] = CURATED_PACKS;
    const films = pack.chapters.flatMap((chapter) => chapter.films);
    const ids = films.map((film) => film.id);
    const titleYears = films.map(({ title, year }) => `${title}|${year}`);
    const filmIds = new Set(ids);

    expect(pack).toMatchObject({
      id: 'black-comedy-excellence',
      type: 'editorial-pack',
      version: 1,
      status: 'draft',
      title: 'Black Comedy Excellence',
      credit: 'Curated by Black Comedy Excellence',
    });
    expect(pack.chapters).toHaveLength(6);
    expect(films).toHaveLength(50);
    expect(new Set(ids).size).toBe(50);
    expect(new Set(titleYears).size).toBe(50);
    expect(pack.chapters.map((chapter) => chapter.films.length)).toEqual([
      10, 10, 9, 8, 8, 5,
    ]);
    expect(pack.featuredIds).toEqual([
      'coming-to-america',
      'friday',
      'house-party',
      'hollywood-shuffle',
      'girls-trip',
      'black-dynamite',
    ]);
    expect(pack.featuredIds.every((id) => filmIds.has(id))).toBe(true);
    expect(getCuratedPacks()).toEqual([]);
    expect(getCuratedPacks({ preview: true })).toEqual([pack]);
  });
});

describe('curated pack identities and art slots', () => {
  const pack = CURATED_PACKS[0];
  const films = pack.chapters.flatMap((chapter) => chapter.films);

  it('maps every film to a distinct TMDB movie id', () => {
    const ids = films.map((film) => film.tmdbId);
    expect(ids.every((id) => Number.isInteger(id) && id > 0)).toBe(true);
    expect(new Set(ids).size).toBe(films.length);
  });

  it('exposes artwork paths for the card, hero and each chapter', () => {
    const base = '/assets/packs/black-comedy-excellence';
    expect(pack.art).toEqual({
      card: `${base}/card.webp`,
      hero: `${base}/hero.webp`,
    });
    pack.chapters.forEach((chapter) =>
      expect([chapter.art, chapter.heroArt]).toEqual([
        `${base}/chapters/${chapter.id}.webp`,
        `${base}/chapters/${chapter.id}-hero.webp`,
      ]),
    );
  });
});
