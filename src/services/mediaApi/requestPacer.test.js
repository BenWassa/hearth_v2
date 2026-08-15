import { vi } from 'vitest';
import { createRequestPacer } from './requestPacer.js';

describe('createRequestPacer', () => {
  it('starts the first request immediately and spaces later requests', async () => {
    let currentTime = 1000;
    const sleep = vi.fn(async (ms) => {
      currentTime += ms;
    });
    const request = vi.fn(async () => 'ok');
    const pacedRequest = createRequestPacer({
      minIntervalMs: 500,
      now: () => currentTime,
      sleep,
    });

    await expect(pacedRequest(request)).resolves.toBe('ok');
    currentTime += 100;
    await expect(pacedRequest(request)).resolves.toBe('ok');
    currentTime += 700;
    await expect(pacedRequest(request)).resolves.toBe('ok');

    expect(request).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledOnce();
    expect(sleep).toHaveBeenCalledWith(400);
  });
});
