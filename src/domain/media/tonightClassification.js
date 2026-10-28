import {
  canonicalMediaKey,
  getEffectiveClassification,
  tagProvenance,
} from './classification.mjs';
import {
  getShowWatchProgressSummary,
  isEpisodeWatched,
} from '../../components/ItemDetailsModal/utils/showProgress.js';
import { startOfLocalDay, toLocalDate } from '../../utils/releaseDates.js';

export const QUICK_BITES_MAX_MINUTES = 30;
const weight = (value) =>
  ({ high: 3, medium: 1, low: 0, unknown: 0 }[value] || 0);
export const primaryTheme = (item) => {
  const { attributes: a } = getEffectiveClassification(item);
  const accessibleMomentum =
    a.plotMomentum.value === 'high' &&
    ['low', 'medium'].includes(a.narrativeComplexity.value) &&
    ['low', 'medium'].includes(a.attentionDemand.value);
  const scores = {
    hooked: accessibleMomentum ? 10 : 0,
    comfort: weight(a.comfort.value) * 2 - weight(a.attentionDemand.value),
    comedy:
      weight(a.comedyFirst.value) * 2 - weight(a.narrativeComplexity.value),
    focused:
      weight(a.narrativeComplexity.value) * 2 +
      weight(a.attentionDemand.value) +
      weight(a.plotMomentum.value),
    visual: weight(a.visualDistinctiveness.value) * 3,
    classic: weight(a.curatedClassic.value),
  };
  const provenance = tagProvenance(item);
  const vibe = item.userState?.vibe || item.vibe;
  const energy = item.userState?.energy || item.energy;
  const weakComedy =
    a.comedyFirst.value === 'unknown' &&
    provenance.vibe !== 'automatic' &&
    ['easy', 'comfort'].includes(vibe) &&
    (item.genres?.[0] ?? item.media?.genres?.[0]) === 'Comedy';
  const comedyIntent =
    a.comfort.value !== 'high' &&
    (a.comedyFirst.value === 'high' || weakComedy);
  // Existing explicit/unknown-origin tags remain meaningful, facet by facet.
  if (provenance.vibe !== 'automatic') {
    const theme = {
      comfort: comedyIntent ? 'comedy' : 'comfort',
      easy: comedyIntent ? 'comedy' : 'comfort',
      gripping: accessibleMomentum ? 'hooked' : 'focused',
      visual: 'visual',
      classic: 'classic',
    }[vibe];
    if (theme) scores[theme] += 12;
  }
  if (provenance.energy !== 'automatic' && energy === 'focused')
    scores.focused += 2;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return ranked[0][1] > 0 ? ranked[0][0] : 'unknown';
};
const positiveRuntime = (n) =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
export const nextWatchRuntime = (item, now = new Date()) => {
  if (item.type === 'movie')
    return positiveRuntime(item.media?.runtimeMinutes ?? item.runtimeMinutes);
  const seasons = item.showData?.seasons || item.seasons || [];
  const progress =
    item.userState?.episodeProgress || item.episodeProgress || {};
  const episodes = seasons
    .flatMap((s) =>
      (s.episodes || []).map((e) => ({
        ...e,
        seasonNumber: e.seasonNumber ?? s.seasonNumber ?? s.number,
        episodeNumber: e.episodeNumber ?? e.number,
      })),
    )
    .filter((e) => Number(e.seasonNumber) >= 1)
    .sort(
      (a, b) =>
        a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber,
    );
  const next = episodes.find((e) => {
    const date = toLocalDate(e.airDate || e.air_date || e.releaseDate);
    return (
      (!date || startOfLocalDay(date) <= startOfLocalDay(now)) &&
      !isEpisodeWatched(progress, e)
    );
  });
  return next ? positiveRuntime(next.runtimeMinutes ?? next.runtime) : null;
};
export const allocateTonightThemes = (
  items,
  { quickBites = true, now = new Date() } = {},
) => {
  const rows = {
    comfort: [],
    comedy: [],
    hooked: [],
    quick: [],
    focused: [],
    visual: [],
    classic: [],
    unknown: [],
  };
  const seen = new Set();
  for (const item of items) {
    if (item.status !== 'unwatched') continue;
    if (item.type === 'show') {
      const summary = getShowWatchProgressSummary(
        {
          ...item,
          seasons: item.showData?.seasons || item.seasons,
          episodeProgress:
            item.userState?.episodeProgress || item.episodeProgress,
        },
        { now },
      );
      if (summary.watchedAny || summary.fullyWatched) continue;
    }
    const key = canonicalMediaKey(item) || item.id;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    const runtime = nextWatchRuntime(item, now);
    const theme =
      quickBites && runtime !== null && runtime <= QUICK_BITES_MAX_MINUTES
        ? 'quick'
        : primaryTheme(item);
    rows[theme].push(item);
  }
  return rows;
};
