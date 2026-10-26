import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import TonightView from './TonightView.jsx';
import { buildCollectionFixture } from '../template/collectionFixtures.js';
vi.mock('../hooks/useCollectionPartCounts.js', () => ({
  default: () => new Map(),
}));
vi.mock('../hooks/useCollectionDetails.js', () => ({
  default: () => ({ data: null, loading: false, error: new Error('offline') }),
}));
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
vi.mock('../components/ItemDetailsModal.jsx', () => ({
  default: ({ isOpen, item, onClose }) =>
    isOpen ? (
      <button onClick={onClose}>Film details: {item.title}</button>
    ) : null,
}));
global.IS_REACT_ACT_ENVIRONMENT = true;
it('opens any saga, preserves search and scroll through details, and reaches its next film', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const button = (text) =>
    [...host.querySelectorAll('button')].find(
      (node) =>
        !node.closest('[inert]') &&
        node.textContent.toLowerCase().includes(text.toLowerCase()),
    );
  const click = async (node) => {
    await act(async () => {
      node.focus();
      node.click();
    });
    await act(async () => {
      await vi.dynamicImportSettled();
    });
  };
  try {
    await act(async () =>
      root.render(
        <TonightView items={buildCollectionFixture({ count: 25 })} />,
      ),
    );
    await click(button('Browse all 25'));
    expect(
      host.querySelector('[aria-labelledby="collections-heading"]'),
    ).not.toBeNull();
    const input = host.querySelector('#saga-search');
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      ).set.call(input, 'Avengers collection');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const browserScroller = input.closest('.overflow-y-auto');
    browserScroller.scrollTop = 52;
    await click(button('The Avengers'));
    expect(host.textContent).toContain('watched on your shelf');
    expect(host.textContent).toContain('Full series details are unavailable');
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      ),
    );
    expect(input.value).toBe('Avengers collection');
    expect(browserScroller.scrollTop).toBe(52);
    expect(document.activeElement.textContent).toContain('The Avengers');
    await click(button('The Avengers'));
    await click(button('Next up'));
    expect(host.textContent).toContain('Film details: Avengers: Age of Ultron');
    await click(button('Film details:'));
    expect(input.value).toBe('Avengers collection');
    await click(button('Tonight'));
    expect(host.querySelector('#saga-search')).toBeNull();
    expect(document.activeElement.textContent).toContain('Browse all 25');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
