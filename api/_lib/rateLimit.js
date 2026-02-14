const store = new Map();

const DEFAULT_SCOPE_WEIGHTS = {
  search: 1,
  'media-details': 1,
  'media-seasons': 1,
  'media-episodes': 2,
  refresh: 2,
  default: 1,
};

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parsePositiveFloat = (value) => {
  const parsed = Number.parseFloat(value || '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseScopeWeights = () => {
  const raw = process.env.API_RATE_LIMIT_SCOPE_WEIGHTS || '';
  if (!raw.trim()) return DEFAULT_SCOPE_WEIGHTS;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SCOPE_WEIGHTS;
    const normalized = { ...DEFAULT_SCOPE_WEIGHTS };
    Object.entries(parsed).forEach(([scope, weight]) => {
      const numeric = Number(weight);
      if (Number.isFinite(numeric) && numeric > 0) {
        normalized[scope] = numeric;
      }
    });
    return normalized;
  } catch {
    return DEFAULT_SCOPE_WEIGHTS;
  }
};

const getConfig = () => {
  const tokensPerSecond = parsePositiveFloat(
    process.env.API_RATE_LIMIT_TOKENS_PER_SEC,
  );
  const burst = parsePositiveFloat(process.env.API_RATE_LIMIT_BURST);
  const scopeWeights = parseScopeWeights();
  if (tokensPerSecond && burst) {
    return {
      mode: 'token_bucket',
      tokensPerSecond,
      burst,
      scopeWeights,
    };
  }

  const legacyWindowMs = parsePositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS);
  const legacyMax = parsePositiveInt(process.env.API_RATE_LIMIT_MAX);
  return {
    mode: 'fixed_window',
    windowMs: legacyWindowMs || 60_000,
    max: legacyMax || 60,
    scopeWeights,
  };
};

const getClientKey = (req) => {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
};

const checkTokenBucket = (req, scope, config) => {
  const now = Date.now();
  const key = getClientKey(req);
  const entry = store.get(key) || {
    tokens: config.burst,
    lastRefillMs: now,
  };

  const elapsedMs = Math.max(0, now - entry.lastRefillMs);
  const refill = (elapsedMs / 1000) * config.tokensPerSecond;
  entry.tokens = Math.min(config.burst, entry.tokens + refill);
  entry.lastRefillMs = now;

  const cost = Number(config.scopeWeights?.[scope] || config.scopeWeights?.default || 1);
  if (entry.tokens >= cost) {
    entry.tokens -= cost;
    store.set(key, entry);
    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
      scope,
      cost,
      retryAfterMs: 0,
      policy: `token_bucket; rate=${config.tokensPerSecond}/s; burst=${config.burst}`,
    };
  }

  store.set(key, entry);
  const deficit = cost - entry.tokens;
  const retryAfterMs = Math.ceil((deficit / config.tokensPerSecond) * 1000);
  return {
    allowed: false,
    remaining: Math.floor(Math.max(entry.tokens, 0)),
    scope,
    cost,
    retryAfterMs,
    policy: `token_bucket; rate=${config.tokensPerSecond}/s; burst=${config.burst}`,
  };
};

const checkFixedWindow = (req, scope, config) => {
  const now = Date.now();
  const key = `${scope}:${getClientKey(req)}`;
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > config.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.max - 1,
      scope,
      cost: 1,
      retryAfterMs: 0,
      policy: `fixed_window; window_ms=${config.windowMs}; max=${config.max}`,
    };
  }

  if (entry.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      scope,
      cost: 1,
      retryAfterMs: config.windowMs - (now - entry.windowStart),
      policy: `fixed_window; window_ms=${config.windowMs}; max=${config.max}`,
    };
  }

  entry.count += 1;
  store.set(key, entry);
  return {
    allowed: true,
    remaining: Math.max(config.max - entry.count, 0),
    scope,
    cost: 1,
    retryAfterMs: 0,
    policy: `fixed_window; window_ms=${config.windowMs}; max=${config.max}`,
  };
};

const checkRateLimit = (req, scope = 'default') => {
  const config = getConfig();
  if (config.mode === 'token_bucket') {
    return checkTokenBucket(req, scope, config);
  }
  return checkFixedWindow(req, scope, config);
};

const setRateLimitHeaders = (res, rate) => {
  if (!res || !rate) return;
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, rate.remaining || 0)));
  if (rate.policy) {
    res.setHeader('X-RateLimit-Policy', rate.policy);
  }
  if (rate.scope) {
    res.setHeader('X-RateLimit-Scope', rate.scope);
  }
  if (!rate.allowed && rate.retryAfterMs) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))));
  }
};

const __resetRateLimitStore = () => {
  store.clear();
};

module.exports = {
  __resetRateLimitStore,
  checkRateLimit,
  setRateLimitHeaders,
};
