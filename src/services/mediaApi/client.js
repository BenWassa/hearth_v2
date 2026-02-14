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

const MAX_GET_RETRIES = 2;
const BACKOFF_BASE_MS = 350;
const MAX_BACKOFF_MS = 5000;

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const parseRetryAfterMs = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const seconds = Number.parseFloat(raw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  const dateMs = Date.parse(raw);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
};

const getRetryDelayMs = ({ attempt, retryAfterHeader }) => {
  const serverDelay = parseRetryAfterMs(retryAfterHeader);
  if (serverDelay !== null) {
    return Math.min(serverDelay, MAX_BACKOFF_MS);
  }

  const exponential = BACKOFF_BASE_MS * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 200);
  return Math.min(exponential + jitter, MAX_BACKOFF_MS);
};

const withRequestMeta = (error, meta = {}) => {
  const nextMeta = {
    attempts: Number(meta.attempts || 0),
    totalRetryDelayMs: Number(meta.totalRetryDelayMs || 0),
    status: Number(meta.status || 0) || undefined,
    url: meta.url,
  };
  const suffix = ` [url=${nextMeta.url} attempts=${nextMeta.attempts} retryMs=${nextMeta.totalRetryDelayMs}]`;

  if (error instanceof Error) {
    error.requestMeta = nextMeta;
    if (!error.message.includes('[url=')) {
      error.message += suffix;
    }
    return error;
  }

  const wrapped = new Error(`Request failed${suffix}`);
  wrapped.requestMeta = nextMeta;
  return wrapped;
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
  let attempt = 0;
  let totalRetryDelayMs = 0;
  while (attempt <= MAX_GET_RETRIES) {
    const response = await fetch(url);

    if (response.ok) {
      const payload = await parseJsonResponse(response, url);
      if (!payload?.ok) {
        throw withRequestMeta(
          new Error(payload?.error?.message || 'Request failed'),
          {
            attempts: attempt + 1,
            totalRetryDelayMs,
            status: response.status,
            url,
          },
        );
      }
      return payload.data;
    }

    const canRetry = response.status === 429 && attempt < MAX_GET_RETRIES;
    if (!canRetry) {
      throw withRequestMeta(await toError(response, url), {
        attempts: attempt + 1,
        totalRetryDelayMs,
        status: response.status,
        url,
      });
    }

    const retryDelayMs = getRetryDelayMs({
      attempt,
      retryAfterHeader: response.headers.get('Retry-After'),
    });
    await delay(retryDelayMs);
    totalRetryDelayMs += retryDelayMs;
    attempt += 1;
  }
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
