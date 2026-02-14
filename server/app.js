const express = require('express');
const path = require('path');

const healthHandler = require('../api/health');
const searchHandler = require('../api/search');
const mediaHandler = require('../api/media/[provider]/[id]');
const seasonsHandler = require('../api/media/[provider]/[id]/seasons');
const seasonEpisodesHandler = require('../api/media/[provider]/[id]/season/[seasonNumber]');
const refreshHandler = require('../api/media/refresh');

const app = express();

app.use(express.json({ limit: '1mb' }));

const invoke = (handler, paramMapper = () => ({})) => {
  return async (req, res, next) => {
    try {
      req.query = {
        ...(req.query || {}),
        ...paramMapper(req),
      };
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
};

app.get('/api/health', invoke(healthHandler));
app.get('/api/search', invoke(searchHandler));
app.get(
  '/api/media/:provider/:id',
  invoke(mediaHandler, (req) => ({
    provider: req.params.provider,
    id: req.params.id,
  })),
);
app.get(
  '/api/media/:provider/:id/seasons',
  invoke(seasonsHandler, (req) => ({
    provider: req.params.provider,
    id: req.params.id,
  })),
);
app.get(
  '/api/media/:provider/:id/season/:seasonNumber',
  invoke(seasonEpisodesHandler, (req) => ({
    provider: req.params.provider,
    id: req.params.id,
    seasonNumber: req.params.seasonNumber,
  })),
);
app.post('/api/media/refresh', invoke(refreshHandler));

const staticDir = path.join(__dirname, '..', 'build');
const CRITICAL_NO_STORE_FILES = new Set([
  '/index.html',
  '/sw.js',
  '/version.json',
  '/manifest.json',
]);

const setStaticCacheHeaders = (res, filePath) => {
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (normalizedPath.includes('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  const isCritical = [...CRITICAL_NO_STORE_FILES].some((criticalPath) =>
    normalizedPath.endsWith(criticalPath),
  );
  if (isCritical) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=3600');
};

app.use(
  express.static(staticDir, {
    setHeaders: setStaticCacheHeaders,
  }),
);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      ok: false,
      data: null,
      meta: {
        requestId: null,
      },
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
      },
    });
    return;
  }

  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  console.error('Unhandled server error:', error);
  res.status(500).json({
    ok: false,
    data: null,
    meta: {
      requestId: null,
    },
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    },
  });
});

module.exports = app;
