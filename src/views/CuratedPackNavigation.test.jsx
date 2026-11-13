import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import TonightView from './TonightView.jsx';
import { useViewHistory } from '../app/useViewHistory.js';

vi.mock('./components/tonight/HeroCarousel.jsx', () => ({
  default: () => null,
}));
vi.mock('./components/tonight/SuggestionSection.jsx', () => ({
  default: () => null,
}));
vi.mock('./components/tonight/TonightHeaderMenu.jsx', () => ({
  default: () => null,
}));
vi.mock('./components/tonight/BottomNav.jsx', () => ({ default: () => null }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.unstubAllEnvs();
  window.history.replaceState(null, '', '/');
});
const click = async (node) =>
  act(async () => {
    node.focus();
    node.click();
  });
const travel = async (direction) =>
  act(async () => {
    await new Promise((resolve) => {
      window.addEventListener('popstate', resolve, { once: true });
      window.history[direction]();
    });
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
const mount = async (preview = true) => {
  window.history.replaceState(null, '', preview ? '/' : '/?curatedPreview=0');
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  function Harness() {
    const { view } = useViewHistory('tonight');
    return (
      <div data-view={view}>
        <TonightView items={[]} />
      </div>
    );
  }
  await act(async () => root.render(<Harness />));
  return {
    host,
    close: async () => {
      await act(async () => root.unmount());
      host.remove();
    },
  };
};

it('shows a pack with an empty library, closes via real Back and restores scroll/focus, supports Forward', async () => {
  const { host, close } = await mount();
  try {
    const tile = host.querySelector('[data-curated-pack]');
    expect(tile).not.toBeNull();
    const scroller = host.querySelector('.overflow-y-auto');
    scroller.scrollTop = 240;
    await click(tile);
    expect(host.querySelector('#curated-pack-heading').textContent).toBe(
      'Black Comedy Excellence',
    );
    expect(host.querySelector('[data-curated-scroller]').textContent).toContain(
      'All films',
    );
    // Only optional pack artwork may appear; no provider film posters yet.
    const imageSources = [
      ...host.querySelectorAll('[data-curated-scroller] img'),
    ].map((image) => image.getAttribute('src'));
    expect(
      imageSources.every((src) =>
        src.startsWith('/assets/packs/black-comedy-excellence/'),
      ),
    ).toBe(true);
    expect(
      host.querySelectorAll('[aria-labelledby="curated-all-heading"] li'),
    ).toHaveLength(50);
    const chapterButton = [...host.querySelectorAll('nav button')].find(
      (button) => button.textContent.includes('Spoofs & Satire'),
    );
    await click(chapterButton);
    expect(document.activeElement.getAttribute('aria-labelledby')).toBe(
      'chapter-spoofs-satire',
    );
    expect(window.history.state.__hearthNavigation).toEqual({
      view: 'tonight',
      depth: 1,
    });
    expect(host.querySelector('[data-view]').dataset.view).toBe('tonight');
    await travel('back');
    expect(host.querySelector('#curated-pack-heading')).toBeNull();
    expect(scroller.scrollTop).toBe(240);
    expect(document.activeElement).toBe(tile);
    expect(window.history.state.__hearthNavigation.depth).toBe(0);
    await travel('forward');
    expect(host.querySelector('#curated-pack-heading')).not.toBeNull();
    await click(host.querySelector('[aria-label="Back to collections"]'));
    // Close follows the same asynchronous browser stack.
    await act(async () => new Promise((resolve) => setTimeout(resolve, 40)));
    expect(host.querySelector('#curated-pack-heading')).toBeNull();
    expect(window.history.state.__hearthNavigation.depth).toBe(0);
  } finally {
    await close();
  }
});

it('keeps the Collections index mounted behind a pack and returns to its tile', async () => {
  const { host, close } = await mount();
  try {
    await click(host.querySelector('[data-all-collections]'));
    const index = host.querySelector('[aria-labelledby="collections-heading"]');
    const scroller = index.querySelector('.overflow-y-auto');
    scroller.scrollTop = 64;
    const tile = index.querySelector('[data-curated-pack]');
    expect(index.textContent).toContain('Curated collections');
    expect(index.textContent).toContain('Sagas');
    await click(tile);
    expect(index.hasAttribute('inert')).toBe(true);
    await travel('back');
    expect(index.hasAttribute('inert')).toBe(false);
    expect(scroller.scrollTop).toBe(64);
    expect(document.activeElement).toBe(tile);
  } finally {
    await close();
  }
});

it('does not expose draft packs without an explicit dev preview', async () => {
  const { host, close } = await mount(false);
  try {
    expect(host.querySelector('[data-curated-pack]')).toBeNull();
  } finally {
    await close();
  }
});

it('keeps draft content out of production even with the preview query', async () => {
  vi.stubEnv('DEV', false);
  const { host, close } = await mount(true);
  try {
    expect(host.querySelector('[data-curated-pack]')).toBeNull();
  } finally {
    await close();
  }
});
