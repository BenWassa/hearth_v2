import fixtures from './collections-fixture.json';

// Read-only demo scenario. Never used by the connected household app.
// Metadata from TMDB, 2026-10-26; activity is synthetic, relative to injected now.
export const buildCollectionFixture = ({
  count = 25,
  now = Date.now(),
  dispersed = false,
} = {}) => {
  const image = (path, size) =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
  return Array.from(
    { length: Math.min(100, Math.max(0, count)) },
    (_, index) => {
      const source = fixtures[index % fixtures.length];
      const providerId =
        index < fixtures.length && !dispersed
          ? source.providerId
          : `fixture-${index}`;
      return source.parts.map((part, filmIndex) => {
        const imported = index % 7 === 6;
        const completed = index % 5 === 4;
        const status =
          completed || (filmIndex === 0 && index % 3 !== 1)
            ? 'watched'
            : 'unwatched';
        const at = now - (index < 2 ? index + 1 : index * 7) * 86400000;
        return {
          id: `fixture-${index}-${filmIndex}`,
          type: 'movie',
          title: part.title,
          source: { provider: 'tmdb', providerId: part.providerId },
          year: part.year,
          poster: image(part.poster, 'w342'),
          backdrop: image(part.backdrop, 'w780'),
          status,
          additionOrigin: imported ? 'import' : 'manual',
          createdAt: index === 21 ? now : at,
          markedWatchedAt: status === 'watched' && !imported ? at : null,
          addedBy: filmIndex % 2 ? 'household-member-a' : 'household-member-b',
          vibe: 'comfort',
          energy: 'balanced',
          collection: {
            provider: 'tmdb',
            providerId,
            name: source.name,
            poster: image(source.poster, 'w342'),
            backdrop: image(source.backdrop, 'w780'),
          },
        };
      });
    },
  ).flat();
};
