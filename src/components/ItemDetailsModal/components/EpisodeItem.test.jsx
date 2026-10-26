import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
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

const renderEpisode = async (episode, props = {}) => {
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
        {...props}
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

describe('EpisodeItem accessibility', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('exposes the row as an expand button wired to its description', async () => {
    const onToggleExpand = vi.fn();
    const mounted = await renderEpisode(
      { description: 'Plot.' },
      { isExpanded: false, onToggleExpand },
    );
    const toggle = mounted.container.querySelector('[aria-expanded]');
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    const description = mounted.container.querySelector(
      `#${toggle.getAttribute('aria-controls')}`,
    );
    expect(description.hidden).toBe(true);

    await act(async () => {
      toggle.click();
    });
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
    await cleanupEpisode(mounted);
  });

  it('reveals the description to assistive tech when expanded', async () => {
    const mounted = await renderEpisode({ description: 'Plot.' });
    const toggle = mounted.container.querySelector('[aria-expanded]');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(
      mounted.container.querySelector(
        `#${toggle.getAttribute('aria-controls')}`,
      ).hidden,
    ).toBe(false);
    await cleanupEpisode(mounted);
  });

  it('keeps the watched toggle separate from the expand control', async () => {
    const onToggleWatched = vi.fn();
    const onToggleExpand = vi.fn();
    const mounted = await renderEpisode(
      {},
      { onToggleWatched, onToggleExpand },
    );
    const watched = mounted.container.querySelector(
      'button[aria-label="Mark Opening Night watched"]',
    );
    await act(async () => {
      watched.click();
    });
    expect(onToggleWatched).toHaveBeenCalledTimes(1);
    expect(onToggleExpand).not.toHaveBeenCalled();
    await cleanupEpisode(mounted);
  });

  it('keeps watched titles and metadata fully opaque and retains the watched check', async () => {
    const mounted = await renderEpisode({
      watched: true,
      airDate: '2024-06-01',
      runtimeMinutes: 42,
    });
    const row = mounted.container.querySelector('[aria-expanded]');
    expect(row.textContent).toContain('Opening Night');
    expect(row.textContent).toContain('2024');
    expect(row.textContent).toContain('42');
    for (const element of [row, ...row.querySelectorAll('*')]) {
      expect(element.getAttribute('class') || '').not.toMatch(
        /(?:^|\s)opacity-(?!100\b)\d+/,
      );
      expect(element.style.opacity).toBe('');
    }
    expect(
      mounted.container.querySelector(
        '[aria-label="Mark Opening Night unwatched"] svg',
      ),
    ).not.toBeNull();
    await cleanupEpisode(mounted);
  });
});
