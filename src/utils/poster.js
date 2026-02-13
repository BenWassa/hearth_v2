import { APP_BASE, BACKDROP_DIR, POSTER_DIR } from '../config/constants.js';
import backdropMap from '../backdrop-map.json';
import { slugifyTitle } from './text.js';
import { readEnv } from './env.js';

const MEDIA_ASSET_BASE_URL = (
  readEnv('VITE_MEDIA_ASSET_BASE_URL', 'REACT_APP_MEDIA_ASSET_BASE_URL') || ''
)
  .trim()
  .replace(/\/+$/, '');

const maybeResolveStorageUrl = (pathValue) => {
  if (!MEDIA_ASSET_BASE_URL) return '';
  if (!pathValue || !pathValue.startsWith('/')) return '';
  if (
    pathValue.startsWith(`${POSTER_DIR}/`) ||
    pathValue.startsWith(`${BACKDROP_DIR}/`)
  ) {
    return `${MEDIA_ASSET_BASE_URL}${pathValue}`;
  }
  return '';
};

const backdropMapBySlug = Object.entries(backdropMap).reduce(
  (acc, [title, path]) => {
    const slug = slugifyTitle(title);
    if (slug && !acc[slug]) {
      acc[slug] = path;
    }
    return acc;
  },
  {},
);

export const stripAppBase = (value) => {
  if (!APP_BASE) return value;
  if (value.startsWith(APP_BASE)) return value.slice(APP_BASE.length) || '/';
  return value;
};

export const stripOrigin = (value) => {
  if (typeof window === 'undefined') return value;
  if (!/^https?:\/\//i.test(value)) return value;
  const origin = window.location.origin;
  if (value.startsWith(origin)) return value.slice(origin.length) || '/';
  return value;
};

export const normalizePosterPath = (poster) => {
  if (!poster) return poster;
  if (poster.startsWith('data:')) return poster;
  const withoutOrigin = stripOrigin(poster);
  const withoutBase = stripAppBase(withoutOrigin);
  if (/^https?:\/\//i.test(withoutBase)) return poster;

  const posterPath = withoutBase.startsWith('/')
    ? withoutBase
    : `/${withoutBase}`;
  if (!posterPath.startsWith(`${POSTER_DIR}/`)) return poster;

  const rawFile = posterPath.slice(POSTER_DIR.length + 1).split(/[?#]/)[0];
  const decoded = rawFile.replace(/\+/g, ' ');
  let clean = decoded;
  try {
    clean = decodeURIComponent(decoded);
  } catch (err) {
    // Ignore malformed escape sequences and fall back to raw.
  }
  const base = clean.replace(/\.[a-z0-9]+$/i, '');
  const slug = slugifyTitle(base);
  if (!slug) return poster;
  return `${POSTER_DIR}/${slug}.jpg`;
};

export const resolvePosterSrc = (poster) => {
  if (!poster) return '';
  const normalized = normalizePosterPath(poster);
  if (!normalized) return '';
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('data:'))
    return normalized;
  const storageUrl = maybeResolveStorageUrl(normalized);
  if (storageUrl) return storageUrl;
  if (normalized.startsWith('/')) return `${APP_BASE}${normalized}`;
  return `${APP_BASE}/${normalized}`;
};

export const resolveBackdropSrc = (backdrop) => {
  if (!backdrop) return '';
  const withoutOrigin = stripOrigin(backdrop);
  const withoutBase = stripAppBase(withoutOrigin);
  if (/^https?:\/\//i.test(withoutBase) || withoutBase.startsWith('data:')) {
    return backdrop;
  }
  const backdropPath = withoutBase.startsWith('/')
    ? withoutBase
    : `/${withoutBase}`;
  const storageUrl = maybeResolveStorageUrl(backdropPath);
  if (storageUrl) return storageUrl;
  return `${APP_BASE}${backdropPath}`;
};

export const getPosterSrc = (item) => {
  if (item?.poster) return resolvePosterSrc(item.poster);
  const slug = slugifyTitle(item?.title);
  if (!slug) return '';
  return resolvePosterSrc(`${POSTER_DIR}/${slug}.jpg`);
};

export const getBackdropSrc = (item) => {
  if (item?.backdrop) return resolveBackdropSrc(item.backdrop);
  if (item?.backdropPath) return resolveBackdropSrc(item.backdropPath);
  if (item?.backdrop_path) return resolveBackdropSrc(item.backdrop_path);
  if (item?.title && backdropMap[item.title]) {
    return resolveBackdropSrc(backdropMap[item.title]);
  }
  const slug = slugifyTitle(item?.title);
  if (!slug) return '';
  if (backdropMapBySlug[slug]) {
    return resolveBackdropSrc(backdropMapBySlug[slug]);
  }
  return resolveBackdropSrc(`${BACKDROP_DIR}/${slug}-backdrop.jpg`);
};
