// Provider credits are not editorial membership: require an exact Director crew
// role and canonical person/movie identifiers. Never infer authorship from title.
const image = (path, size) =>
  typeof path === 'string' && path.startsWith('/')
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : '';

const asYear = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date || '')
  ? String(date).slice(0, 4)
  : '';

const mapDirector = (raw, editorial, today = new Date()) => {
  if (!raw || Number(raw.id) !== Number(editorial.personId)) {
    throw new Error('Director identity does not match the editorial catalog.');
  }
  const asOf = today.toISOString().slice(0, 10);
  const seen = new Set();
  const credits = Array.isArray(raw.movie_credits?.crew)
    ? raw.movie_credits.crew
    : [];
  const films = credits
    .filter((credit) =>
      credit?.job === 'Director' &&
      credit?.department === 'Directing' &&
      Number.isSafeInteger(Number(credit.id)) &&
      Number(credit.id) > 0 &&
      credit.adult !== true &&
      credit.video !== true &&
      asYear(credit.release_date) &&
      credit.release_date <= asOf
    )
    .map((credit) => ({
      provider: 'tmdb',
      providerId: String(credit.id),
      title: String(credit.title || credit.original_title || '').trim(),
      year: asYear(credit.release_date),
      releaseDate: credit.release_date,
      overview: String(credit.overview || ''),
      poster: image(credit.poster_path, 'w342'),
      backdrop: image(credit.backdrop_path, 'w780'),
    }))
    .filter((film) => {
      if (!film.title || seen.has(film.providerId)) return false;
      seen.add(film.providerId);
      return true;
    })
    .sort((a, b) =>
      a.releaseDate.localeCompare(b.releaseDate) ||
      a.title.localeCompare(b.title),
    );
  const byId = new Map(films.map((film) => [film.providerId, film]));
  const startHere = (editorial.entryFilmIds || [])
    .map((id) => byId.get(String(id)))
    .filter(Boolean);
  return {
    id: editorial.id,
    personId: String(editorial.personId),
    name: editorial.name,
    description: editorial.description,
    portrait: image(raw.profile_path, 'w342'),
    startHere,
    films,
    // Credits can contain short films and documentaries; do not call this a
    // complete list of feature films without runtime checks.
    filmographyLabel: 'Directed film credits',
    missingStarterIds: (editorial.entryFilmIds || [])
      .map(String)
      .filter((id) => !byId.has(id)),
  };
};

module.exports = { mapDirector };
