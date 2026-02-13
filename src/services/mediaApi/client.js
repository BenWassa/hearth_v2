const toError = async (response) => {
  let message = `Request failed (${response.status})`;
  try {
    const payload = await response.json();
    if (payload?.error?.message) message = payload.error.message;
  } catch (err) {
    // Ignore parse errors and keep status-based fallback.
  }
  return new Error(message);
};

const getJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw await toError(response);
  const payload = await response.json();
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
  if (!response.ok) throw await toError(response);
  const payload = await response.json();
  if (!payload?.ok) {
    throw new Error(payload?.error?.message || 'Refresh failed');
  }
  return payload.data;
};
