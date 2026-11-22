import { expect, it, vi } from 'vitest';
import { getMediaDetails } from '../../services/mediaApi/client.js';
vi.mock('../../services/mediaApi/client.js', () => ({
  getMediaDetails: vi.fn(),
}));

it('refetches failures and mismatches but caches verified details', async () => {
  const { loadFilm } = await import('./filmMedia.js');
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
});

it('retries once when the connection comes back, and can be cancelled', async () => {
  const { retryWhenOnline } = await import('./filmMedia.js');
  const retry = vi.fn();
  retryWhenOnline(retry);
  window.dispatchEvent(new Event('online'));
  window.dispatchEvent(new Event('online'));
  expect(retry).toHaveBeenCalledTimes(1);
  const cancelled = vi.fn();
  const stop = retryWhenOnline(cancelled);
  stop();
  window.dispatchEvent(new Event('online'));
  expect(cancelled).not.toHaveBeenCalled();
});
