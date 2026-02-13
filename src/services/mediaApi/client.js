const buildInvalidJsonError = ({ url, contentType, raw }) => {
  const snippet = raw.slice(0, 40).replace(/\s+/g, ' ').trim();
  const looksLikeMisroutedApi =
    snippet.startsWith('const {') ||
    snippet.startsWith('<!doctype') ||
    snippet.startsWith('<html');

  const hint = looksLikeMisroutedApi
    ? 'This usually means `/api` is not routed to the backend server.'
    : '';

  return new Error(
    `Invalid API response for ${url}. Expected JSON but received ${
      contentType || 'unknown content type'
    }${snippet ? ` (starts with: "${snippet}")` : ''}${hint ? ` ${hint}` : ''}`,
  );
};

const parseJsonResponse = async (response, url) => {
  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw buildInvalidJsonError({ url, contentType, raw });
  }
};

const toError = async (response, url) => {
  let message = `Request failed (${response.status})`;
  try {
    const payload = await parseJsonResponse(response, url);
    if (payload?.error?.message) message = payload.error.message;
  } catch (err) {
    if (err instanceof Error) {
      return err;
    }
  }
  return new Error(message);
};

const getJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw await toError(response, url);
  const payload = await parseJsonResponse(response, url);
  if (!payload?.ok) {
    throw new Error(payload?.error?.message || 'Request failed');
  }
  return payload.data;
};

export const searchMedia = async ({ q, type = 'all', page = 1 }) => {
  const params = new URLSearchParams({
    q,
    type,
    page: String(page),
  });
  return getJson(`/api/search?${params.toString()}`);
};

export const getMediaDetails = async ({ provider, providerId, type }) => {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return getJson(`/api/media/${provider}/${providerId}${suffix}`);
};

export const getShowSeasons = async ({ provider, providerId }) => {
  return getJson(`/api/media/${provider}/${providerId}/seasons`);
};

export const getSeasonEpisodes = async ({
  provider,
  providerId,
  seasonNumber,
}) => {
  return getJson(`/api/media/${provider}/${providerId}/season/${seasonNumber}`);
};

export const refreshMediaMetadata = async ({
  provider,
  providerId,
  type,
  locale = 'en-US',
}) => {
  const response = await fetch('/api/media/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider,
      providerId,
      type,
      locale,
    }),
  });
  if (!response.ok) throw await toError(response, '/api/media/refresh');
  const payload = await parseJsonResponse(response, '/api/media/refresh');
  if (!payload?.ok) {
    throw new Error(payload?.error?.message || 'Refresh failed');
  }
  return payload.data;
};
