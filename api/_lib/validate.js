const ALLOWED_TYPES = new Set(['movie', 'show', 'all']);

const toString = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const parsePositiveInt = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
};

const validateSearchQuery = (query = {}) => {
  const q = toString(query.q);
  const typeRaw = toString(query.type).toLowerCase() || 'all';
  const page = parsePositiveInt(query.page, 1);

  if (q.length < 2) {
    return {
      ok: false,
      error: {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Query must be at least 2 characters.',
      },
    };
  }

  if (!ALLOWED_TYPES.has(typeRaw)) {
    return {
      ok: false,
      error: {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Type must be one of: movie, show, all.',
      },
    };
  }

  return {
    ok: true,
    value: {
      q,
      type: typeRaw,
      page,
    },
  };
};

module.exports = {
  validateSearchQuery,
};
