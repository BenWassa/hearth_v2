import {
  buildImportDedupeKey,
  parseText,
  normalizeItem,
  validateItem,
  resolveDefaults,
  commitImport,
} from './domain/import/importer';

const VALID_VIBES = ['comfort', 'easy', 'gripping', 'visual', 'classic'];
const VALID_ENERGIES = ['light', 'balanced', 'focused'];

describe('importer', () => {
  it('parses JSON arrays', () => {
    const input = JSON.stringify([
      {
        title: 'Spirited Away',
        type: 'movie',
        vibe: 'visual',
        energy: 'balanced',
      },
    ]);

    const result = parseText(input);

    expect(result.error).toBe('');
    expect(result.items).toHaveLength(1);
  });

  it('normalizes fields', () => {
    const normalized = normalizeItem({
      title: '  Ted Lasso ',
      type: 'TV',
      vibe: 'COMFORT',
      energy: 'Focused',
    });

    expect(normalized).toEqual({
      schemaVersion: '',
      title: 'Ted Lasso',
      type: 'show',
      vibe: 'comfort',
      energy: 'focused',
      note: '',
      poster: '',
      backdrop: '',
      year: '',
      director: '',
      genres: [],
      actors: [],
      runtimeMinutes: '',
      totalSeasons: '',
      seasons: [],
      episodeProgress: null,
      source: null,
      media: null,
      showData: null,
      userState: null,
    });
  });

  it('flags missing energy and vibe when allowed', () => {
    const item = normalizeItem({ title: 'Paddington 2', type: 'movie' });
    const result = validateItem(item, {
      validVibes: VALID_VIBES,
      validEnergies: VALID_ENERGIES,
      allowMissing: true,
    });

    expect(result.missing).toEqual(['vibe', 'energy']);
    expect(result.isValid).toBe(true);
  });

  it('requires missing energy and vibe for commit', () => {
    const item = normalizeItem({ title: 'Paddington 2', type: 'movie' });
    const result = validateItem(item, {
      validVibes: VALID_VIBES,
      validEnergies: VALID_ENERGIES,
    });

    expect(result.isValid).toBe(false);
  });

  it('applies defaults before commit', () => {
    const item = normalizeItem({ title: 'Paddington 2', type: 'movie' });
    const resolved = resolveDefaults(item, {
      vibe: 'comfort',
      energy: 'balanced',
    });

    expect(resolved.vibe).toBe('comfort');
    expect(resolved.energy).toBe('balanced');
  });

  it('commits items with a mocked writer', async () => {
    const items = [{ title: 'Item A' }, { title: 'Item B' }];
    const calls = [];

    const writer = async (item) => {
      calls.push(item.title);
      return { id: `id-${item.title}` };
    };

    const results = await commitImport(items, writer);

    expect(calls).toEqual(['Item A', 'Item B']);
    expect(results).toHaveLength(2);
  });

  it('builds dedupe key using title + type + year when provider is missing', () => {
    const key = buildImportDedupeKey({
      title: 'Dune',
      type: 'movie',
      year: '2021',
    });
    expect(key).toBe('title:dune:movie:2021');
  });

  it('builds dedupe key from provider identity when available', () => {
    const key = buildImportDedupeKey({
      title: 'Anything',
      source: { provider: 'tmdb', providerId: '123' },
    });
    expect(key).toBe('provider:tmdb:123');
  });

  it('normalizes provider identity aliases from imported rows', () => {
    const normalized = normalizeItem({
      title: 'The Matrix',
      tmdb_id: 603,
    });
    expect(normalized.source).toEqual({
      provider: 'tmdb',
      providerId: '603',
    });
  });
});
