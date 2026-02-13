const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const toImageUrl = (path, size = 'w300') => {
  if (typeof path !== 'string' || !path.trim()) return '';
  return `${IMAGE_BASE}/${size}${path}`;
};

const makeEpisodeId = (seasonNumber, episodeNumber, fallbackId) => {
  const season = Number.isFinite(seasonNumber) ? seasonNumber : 0;
  const episode = Number.isFinite(episodeNumber) ? episodeNumber : 0;
  if (season > 0 && episode > 0) return `s${season}e${episode}`;
  if (fallbackId) return String(fallbackId);
  return '';
};

const mapEpisode = (episode = {}, seasonNumber) => {
  const episodeNumber = Number.isFinite(episode.episode_number)
    ? episode.episode_number
    : null;
  const episodeId = makeEpisodeId(seasonNumber, episodeNumber, episode.id);

  return {
    episodeId,
    episodeNumber,
    name: episode.name || '',
    overview: episode.overview || '',
    airDate: episode.air_date || '',
    runtimeMinutes: Number.isFinite(episode.runtime) ? episode.runtime : null,
    stillUrl: toImageUrl(episode.still_path),
  };
};

module.exports = {
  mapEpisode,
};
