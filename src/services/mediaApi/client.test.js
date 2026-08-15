import { vi } from 'vitest';
import { refreshMediaMetadata } from './client.js';

const makeResponse = ({ status = 200, body, retryAfter = null }) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (name) =>
      String(name).toLowerCase() === 'retry-after' ? retryAfter : null,
  },
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});

describe('refreshMediaMetadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries rate-limited refreshes using Retry-After', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({
          status: 429,
          retryAfter: '0',
          body: { ok: false, error: { message: 'Too many requests.' } },
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          body: { ok: true, data: { media: { title: 'Arrival' } } },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      refreshMediaMetadata({
        provider: 'tmdb',
        providerId: '329865',
        type: 'movie',
      }),
    ).resolves.toEqual({ media: { title: 'Arrival' } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bounds retries for transient server failures and exposes request metadata', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        makeResponse({
          status: 503,
          retryAfter: '0',
          body: { ok: false, error: { message: 'Provider unavailable.' } },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const error = await refreshMediaMetadata({
      provider: 'tmdb',
      providerId: '329865',
      type: 'movie',
    }).catch((caught) => caught);

    expect(error).toBeInstanceOf(Error);
    expect(error.requestMeta).toMatchObject({
      attempts: 3,
      status: 503,
      url: '/api/media/refresh',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry permanent client errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        status: 400,
        body: { ok: false, error: { message: 'Invalid provider.' } },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      refreshMediaMetadata({
        provider: 'invalid',
        providerId: '1',
        type: 'movie',
      }),
    ).rejects.toThrow('Invalid provider.');
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
