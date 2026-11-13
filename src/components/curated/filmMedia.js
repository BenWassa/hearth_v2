import { getMediaDetails } from '../../services/mediaApi/client.js';

// Shared across rails and previews: deduplicate in-flight requests and cache
// results for this session. Small batches keep provider traffic bounded.
const cache = new Map();
const queue = [];
let running = 0;
const drain = () => {
  while (running < 3 && queue.length) {
    running += 1;
    const job = queue.shift();
    job().finally(() => {
      running -= 1;
      drain();
    });
  }
};
export const loadFilm = (film) => {
  const id = String(film.tmdbId || '');
  if (!/^\d+$/.test(id)) return Promise.resolve(null);
  const cached = cache.get(id);
  if (cached && Date.now() - cached.at < 30 * 60 * 1000) return cached.promise;
  const promise = new Promise((resolve) => {
    queue.push(async () => {
      try {
        const data = await getMediaDetails({
          provider: 'tmdb',
          providerId: id,
          type: 'movie',
        });
        resolve(
          data?.provider === 'tmdb' && String(data.providerId) === id
            ? data
            : null,
        );
      } catch {
        resolve(null);
      }
    });
  });
  cache.set(id, { promise, at: Date.now() });
  drain();
  return promise;
};
export const loadFilms = (films) => Promise.all(films.map(loadFilm));
