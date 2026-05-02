import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import EpisodeItem from './EpisodeItem.jsx';

const baseEpisode = {
  id: 's1e1',
  number: 1,
  title: 'Opening Night',
  airDate: '',
  description: '',
  runtimeMinutes: null,
  watched: false,
};

const renderEpisode = async (episode) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <EpisodeItem
        episode={{ ...baseEpisode, ...episode }}
        isNextUp={false}
        isExpanded
        isSpoilerRevealed
        onToggleExpand={() => {}}
        onToggleWatched={() => {}}
        onToggleSpoiler={() => {}}
      />,
    );
  });
  return { container, root };
};

const cleanupEpisode = async ({ container, root }) => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
};

describe('EpisodeItem release fallback', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('shows release date copy when an unreleased episode has no description', async () => {
    const mounted = await renderEpisode({ airDate: '2099-01-01' });

    expect(mounted.container.textContent).toContain('Releases Jan 1');
    expect(mounted.container.textContent).not.toContain('No description yet.');

    await cleanupEpisode(mounted);
  });

  it('keeps real descriptions ahead of release fallback', async () => {
    const mounted = await renderEpisode({
      airDate: '2099-01-01',
      description: 'A real synopsis.',
    });

    expect(mounted.container.textContent).toContain('A real synopsis.');
    expect(mounted.container.textContent).not.toContain('Releases Jan 1');

    await cleanupEpisode(mounted);
  });

  it('uses neutral copy when no description or release date is available', async () => {
    const mounted = await renderEpisode({});

    expect(mounted.container.textContent).toContain(
      'Description not available.',
    );

    await cleanupEpisode(mounted);
  });
});
