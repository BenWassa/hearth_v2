const store = new Map();

const getConfig = () => {
  const windowMs = Number.parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '', 10);
  const max = Number.parseInt(process.env.API_RATE_LIMIT_MAX || '', 10);
  return {
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000,
    max: Number.isFinite(max) && max > 0 ? max : 60,
  };
};

const getClientKey = (req) => {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
};

const checkRateLimit = (req, scope = 'default') => {
  const now = Date.now();
  const { windowMs, max } = getConfig();
  const key = `${scope}:${getClientKey(req)}`;
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - entry.windowStart),
    };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, remaining: Math.max(max - entry.count, 0) };
};

module.exports = {
  checkRateLimit,
};
