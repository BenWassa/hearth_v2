export const providerIdFor = (item) => {
  const source = item?.source || {};
  const provider = String(
    source.provider || item?.media?.provider || item?.provider || '',
  ).toLowerCase();
  const id = String(
    source.providerId || item?.media?.providerId || item?.providerId || '',
  ).trim();
  if (provider === 'tmdb' && id) return id;
  const mediaId = String(item?.mediaId || item?.id || '');
  return mediaId.startsWith('tmdb:') ? mediaId.slice(5) : '';
};

export const findByFilmId = (items, id) =>
  (items || []).find(
    (item) => providerIdFor(item) === String(id) && item?.type !== 'show',
  );

export const toWatchlistPayload = (film) => {
  if (
    film?.provider !== 'tmdb' ||
    !/^\d+$/.test(String(film?.providerId || ''))
  ) {
    throw new Error('Film identity could not be verified.');
  }
  return {
    schemaVersion: 2,
    title: film.title,
    type: 'movie',
    status: 'unwatched',
    source: {
      provider: 'tmdb',
      providerId: String(film.providerId),
      fetchedAt: Date.now(),
      locale: 'en-US',
    },
    media: {
      ...film,
      type: 'movie',
      provider: 'tmdb',
      providerId: String(film.providerId),
      title: film.title,
      poster: film.posterUrl || film.poster || '',
      backdrop: film.backdropUrl || film.backdrop || '',
      logo: film.logoUrl || film.logo || '',
      directors: Array.isArray(film.directors) ? film.directors : [],
    },
    userState: {
      status: 'unwatched',
      note: '',
      episodeProgress: {},
      tagProvenance: { vibe: 'automatic', energy: 'automatic' },
    },
  };
};
