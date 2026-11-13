import { expect, it, vi } from 'vitest';
import { getMediaDetails } from '../../services/mediaApi/client.js';
vi.mock('../../services/mediaApi/client.js', () => ({
  getMediaDetails: vi.fn(),
}));

it.each(['curated', 'directors'])(
  '%s refetches failures and mismatches but caches verified details',
  async (collection) => {
    const { loadFilm } = await (collection === 'curated'
      ? import('./filmMedia.js')
      : import('../directors/filmMedia.js'));
    const film = { tmdbId: 987654321 };
    getMediaDetails.mockReset();
    getMediaDetails.mockRejectedValueOnce(new Error('offline'));
    expect(await loadFilm(film)).toBeNull();
    getMediaDetails.mockResolvedValueOnce({
      provider: 'tmdb',
      providerId: 'wrong',
    });
    expect(await loadFilm(film)).toBeNull();
    const details = {
      provider: 'tmdb',
      providerId: String(film.tmdbId),
      type: 'movie',
    };
    getMediaDetails.mockResolvedValueOnce(details);
    expect(await loadFilm(film)).toEqual(details);
    expect(await loadFilm(film)).toEqual(details);
    expect(getMediaDetails).toHaveBeenCalledTimes(3);
  },
);
