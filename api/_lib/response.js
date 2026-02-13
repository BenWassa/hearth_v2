const { randomUUID } = require('crypto');

const getRequestId = (req) => {
  const headerId =
    req?.headers?.['x-request-id'] || req?.headers?.['X-Request-Id'];
  if (typeof headerId === 'string' && headerId.trim()) return headerId.trim();
  return randomUUID();
};

const send = (res, status, body) => {
  res.status(status);
  res.json(body);
};

const ok = (req, res, data, meta = {}) => {
  const requestId = getRequestId(req);
  return send(res, 200, {
    ok: true,
    data,
    meta: {
      requestId,
      ...meta,
    },
    error: null,
  });
};

const fail = (req, res, status, code, message, meta = {}) => {
  const requestId = getRequestId(req);
  return send(res, status, {
    ok: false,
    data: null,
    meta: {
      requestId,
      ...meta,
    },
    error: {
      code,
      message,
    },
  });
};

module.exports = {
  fail,
  getRequestId,
  ok,
};
