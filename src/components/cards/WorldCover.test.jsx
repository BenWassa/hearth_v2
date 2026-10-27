import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import WorldCover from './WorldCover.jsx';

const world = { id: 'pixar', name: 'Pixar', sagas: [{}, {}] };

describe('WorldCover', () => {
  let host;
  let root;
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });
  const mount = async (ui) => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => root.render(ui));
    return host.querySelector('button');
  };

  it('is named by the World, with decorative lazy art and wordmark', async () => {
    const button = await mount(<WorldCover world={world} onOpen={() => {}} />);
    expect(button.getAttribute('aria-label')).toBe('Pixar');
    const [art, wordmark] = button.querySelectorAll('img');
    expect(art.getAttribute('src')).toBe('/assets/worlds/pixar/tile.webp');
    expect(wordmark.getAttribute('src')).toBe(
      '/assets/worlds/pixar/wordmark.svg',
    );
    expect(wordmark.style.width).toBe('56%');
    [art, wordmark].forEach((img) => {
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('loading')).toBe('lazy');
    });
    expect(button.textContent).toBe('2 sagas');
    const described = document.getElementById(
      button.getAttribute('aria-describedby'),
    );
    expect(described.textContent).toBe('2 sagas');
  });

  it('uses the World tile and wordmark fields when present', async () => {
    const button = await mount(
      <WorldCover
        world={{ ...world, tile: '/t.webp', wordmark: '/w.svg' }}
        onOpen={() => {}}
      />,
    );
    const [art, wordmark] = button.querySelectorAll('img');
    expect(art.getAttribute('src')).toBe('/t.webp');
    expect(wordmark.getAttribute('src')).toBe('/w.svg');
  });

  it.each(['tile', 'wordmark'])(
    'falls back to the serif World name when the %s image fails',
    async (which) => {
      const button = await mount(
        <WorldCover world={world} onOpen={() => {}} />,
      );
      const imgs = button.querySelectorAll('img');
      await act(async () => {
        imgs[which === 'tile' ? 0 : 1].dispatchEvent(new Event('error'));
      });
      expect(button.querySelectorAll('img')).toHaveLength(0);
      const name = button.querySelector('.font-serif');
      expect(name.textContent).toBe('Pixar');
      expect(button.getAttribute('aria-label')).toBe('Pixar');
    },
  );

  it('calls onOpen with the click event and focuses the button', async () => {
    const onOpen = vi.fn();
    const button = await mount(<WorldCover world={world} onOpen={onOpen} />);
    await act(async () => button.click());
    expect(onOpen).toHaveBeenCalledOnce();
    expect(onOpen.mock.calls[0][0].currentTarget ?? button).toBeTruthy();
    expect(document.activeElement).toBe(button);
  });

  it('renders the neutral tile as text on stone with no art', async () => {
    const button = await mount(
      <WorldCover
        neutral
        world={{ id: 'all-collections', name: 'All collections', sagas: [{}] }}
        onOpen={() => {}}
      />,
    );
    expect(button.querySelectorAll('img')).toHaveLength(0);
    expect(button.hasAttribute('data-all-collections')).toBe(true);
    expect(button.hasAttribute('data-world-id')).toBe(false);
    expect(button.querySelector('.font-serif').textContent).toBe(
      'All collections',
    );
  });
});
