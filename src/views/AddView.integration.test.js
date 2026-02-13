import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AddView from './AddView';
import { useMediaSearch } from './hooks/useMediaSearch';
import { getMediaDetails } from '../services/mediaApi/client';

jest.mock('./hooks/useMediaSearch');
jest.mock('../services/mediaApi/client');

const renderIntoDom = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
};

const cleanupDom = async ({ container, root }) => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
};

describe('AddView integration', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    useMediaSearch.mockReturnValue({
      results: [],
      loading: false,
      error: '',
      hasQuery: false,
    });
    getMediaDetails.mockReset();
  });

  it('submits enriched v2 payload when a search result is selected', async () => {
    useMediaSearch.mockReturnValue({
      results: [
        {
          provider: 'tmdb',
          providerId: '123',
          type: 'movie',
          title: 'Spirited Away',
          year: '2001',
        },
      ],
      loading: false,
      error: '',
      hasQuery: true,
    });
    getMediaDetails.mockResolvedValue({
      provider: 'tmdb',
      providerId: '123',
      type: 'movie',
      title: 'Spirited Away',
      year: '2001',
      runtimeMinutes: 125,
      posterUrl: '/poster.jpg',
      backdropUrl: '/backdrop.jpg',
      genres: ['Animation'],
      cast: ['Actor A'],
    });

    const onSubmit = jest.fn();
    const mounted = await renderIntoDom(
      <AddView onBack={() => {}} onSubmit={onSubmit} />,
    );

    const resultButton = Array.from(
      mounted.container.querySelectorAll('button'),
    ).find((button) => button.textContent.includes('Spirited Away'));
    const submitButton = Array.from(
      mounted.container.querySelectorAll('button'),
    ).find((button) => button.textContent.includes('Put on Shelf'));

    await act(async () => {
      resultButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await act(async () => {
      submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.schemaVersion).toBe(2);
    expect(payload.source.provider).toBe('tmdb');
    expect(payload.media.title).toBe('Spirited Away');
    expect(payload.userState.status).toBe('unwatched');

    await cleanupDom(mounted);
  });
});
