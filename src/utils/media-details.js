import mediaMap from '../media-map.json';
import { slugifyTitle } from './text.js';

const mediaMapBySlug = Object.entries(mediaMap).reduce(
  (acc, [title, details]) => {
    const slug = slugifyTitle(title);
    if (slug && !acc[slug]) {
      acc[slug] = details;
    }
    return acc;
  },
  {},
);

export const getMediaDetailsByTitle = (title) => {
  if (!title) return null;
  if (mediaMap[title]) return mediaMap[title];
  const slug = slugifyTitle(title);
  if (!slug) return null;
  return mediaMapBySlug[slug] || null;
};
