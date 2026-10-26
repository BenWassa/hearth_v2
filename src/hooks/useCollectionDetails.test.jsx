import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { getCollectionDetails } from '../services/mediaApi/client.js';
import useCollectionDetails from './useCollectionDetails.js';
vi.mock('../services/mediaApi/client.js', () => ({
  getCollectionDetails: vi.fn(),
}));
global.IS_REACT_ACT_ENVIRONMENT = true;
let current, host, root;
const Harness = (props) => {
  current = useCollectionDetails(props);
  return null;
};
const mount = async (props) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<Harness {...props} />));
};
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
  vi.clearAllMocks();
});
it('clears previous saga data during another saga load and reports its failure without old parts', async () => {
  let rejectSecond;
  getCollectionDetails
    .mockResolvedValueOnce({ parts: [{ providerId: 'old' }] })
    .mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectSecond = reject;
        }),
    );
  await mount({ providerId: 'a', enabled: true });
  expect(current.data.parts[0].providerId).toBe('old');
  await act(async () => root.render(<Harness providerId="b" enabled />));
  expect(current.data).toBeNull();
  expect(current.loading).toBe(true);
  await act(async () => rejectSecond(new Error('offline')));
  expect(current.data).toBeNull();
  expect(current.error.message).toBe('offline');
  expect(current.loading).toBe(false);
});
it('ignores an old request that resolves after selection changes', async () => {
  let resolveOld;
  getCollectionDetails
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValueOnce({ parts: [{ providerId: 'new' }] });
  await mount({ providerId: 'a', enabled: true });
  await act(async () => root.render(<Harness providerId="b" enabled />));
  await act(async () => resolveOld({ parts: [{ providerId: 'old' }] }));
  expect(current.data.parts[0].providerId).toBe('new');
  await act(async () =>
    root.render(<Harness providerId="b" enabled={false} />),
  );
  expect(current.data).toBeNull();
  expect(current.loading).toBe(false);
});
