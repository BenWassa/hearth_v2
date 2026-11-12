import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import DirectorsCollectionView from './DirectorsCollectionView.jsx';
import { getDirectorDetails, getMediaDetails } from '../services/mediaApi/client.js';

vi.mock('../services/mediaApi/client.js', () => ({
  getDirectorDetails: vi.fn(),
  getMediaDetails: vi.fn(),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const film = {
  provider: 'tmdb',
  providerId: '77',
  title: 'Memento',
  year: '2000',
  releaseDate: '2000-10-11',
  overview: 'A mystery',
  poster: '',
  backdrop: '',
};
const detail = {
  provider: 'tmdb',
  providerId: '77',
  type: 'movie',
  title: 'Memento',
  year: '2000',
  overview: 'A mystery',
  directors: ['Christopher Nolan'],
  posterUrl: '',
  backdropUrl: '',
};
const response = {
  id: 'christopher-nolan',
  personId: '525',
  name: 'Christopher Nolan',
  description: 'Time, memory, and immense scale',
  portrait: '',
  startHere: [film],
  films: [film],
  missingStarterIds: [],
};

const mount = async (props = {}) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<DirectorsCollectionView {...props} />));
  return {
    host,
    root,
    cleanup: async () => {
      await act(async () => root.unmount());
      host.remove();
    },
  };
};
const click = async (element) => {
  expect(element).toBeTruthy();
  await act(async () => element.click());
};

afterEach(() => vi.clearAllMocks());

it('shows a finite directory then loads only the chosen filmmaker', async () => {
  getDirectorDetails.mockResolvedValue(response);
  const view = await mount();
  try {
    expect(view.host.querySelectorAll('[data-director-card]')).toHaveLength(12);
    expect(getDirectorDetails).not.toHaveBeenCalled();
    await click(view.host.querySelector('[data-director-card="christopher-nolan"]'));
    expect(getDirectorDetails).toHaveBeenCalledExactlyOnceWith('525');
    expect(view.host.textContent).toContain('Memento');
    expect(view.host.textContent).toContain('Directed films');
  } finally {
    await view.cleanup();
  }
});

it('blocks automatic restore of a recently removed film', async () => {
  getDirectorDetails.mockResolvedValue(response);
  getMediaDetails.mockResolvedValue(detail);
  const onAddItem = vi.fn();
  const view = await mount({
    onAddItem,
    removedItems: [{ type: 'movie', source: { provider: 'tmdb', providerId: '77' } }],
  });
  try {
    await click(view.host.querySelector('[data-director-card="christopher-nolan"]'));
    await click([...view.host.querySelectorAll('button')].find((el) => el.getAttribute('aria-label')?.startsWith('Memento')));
    expect(view.host.textContent).toContain('Recently removed');
    expect(view.host.querySelector('button[disabled]')?.textContent).not.toBe('Add to shelf');
    expect(onAddItem).not.toHaveBeenCalled();
  } finally {
    await view.cleanup();
  }
});

it('saves only after fetching identity-matched film detail', async () => {
  getDirectorDetails.mockResolvedValue(response);
  getMediaDetails.mockResolvedValue(detail);
  const onAddItem = vi.fn().mockResolvedValue(undefined);
  const view = await mount({ onAddItem });
  try {
    await click(view.host.querySelector('[data-director-card="christopher-nolan"]'));
    await click([...view.host.querySelectorAll('button')].find((el) => el.getAttribute('aria-label')?.startsWith('Memento')));
    await click([...view.host.querySelectorAll('button')].find((el) => el.textContent?.includes('Add to shelf')));
    expect(onAddItem).toHaveBeenCalledTimes(1);
    const payload = onAddItem.mock.calls[0][0];
    expect(payload.source).toMatchObject({ provider: 'tmdb', providerId: '77' });
    expect(payload.userState.status).toBe('unwatched');
  } finally {
    await view.cleanup();
  }
});
