import { useMemo } from 'react';
import { getMediaDetailsByTitle } from '../../../utils/media-details.js';

/**
 * Hook to merge raw item data with media details
 */
export const useItemData = (rawItem) => {
  const mediaDetails = useMemo(
    () => getMediaDetailsByTitle(rawItem?.title),
    [rawItem?.title],
  );

  const item = rawItem
    ? {
        ...mediaDetails,
        ...rawItem,
        title: rawItem.title?.trim() || '[add title]',
        year:
          rawItem.year?.toString().trim() ||
          mediaDetails?.year?.toString().trim() ||
          '[add year]',
        director:
          rawItem.director?.toString().trim() ||
          rawItem.media?.directors?.[0]?.toString().trim() ||
          (rawItem.type === 'show'
            ? rawItem.media?.creators?.[0]?.toString().trim() || ''
            : '') ||
          mediaDetails?.director?.toString().trim() ||
          '[add director]',
        note: rawItem.note?.toString().trim() || '',
        overview:
          rawItem.overview?.toString().trim() ||
          rawItem.media?.overview?.toString().trim() ||
          mediaDetails?.overview?.toString().trim() ||
          '',
        actors: rawItem.actors ?? rawItem.cast ?? mediaDetails?.actors ?? [],
        genres: rawItem.genres ?? mediaDetails?.genres ?? [],
        runtimeMinutes:
          rawItem.runtimeMinutes ?? mediaDetails?.runtimeMinutes ?? '',
        type: rawItem.type ?? mediaDetails?.type,
        backdrop:
          rawItem.backdrop ??
          rawItem.backdropPath ??
          rawItem.backdrop_path ??
          mediaDetails?.backdrop,
        poster: rawItem.poster ?? mediaDetails?.poster,
      }
    : null;

  return item;
};
