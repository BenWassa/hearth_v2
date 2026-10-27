import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ItemDetailsModal from './ItemDetailsModal.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const pressEscape = () =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
  });

describe('ItemDetailsModal dialogs', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderModal = (props = {}) => {
    const onClose = vi.fn();
    act(() =>
      root.render(
        <ItemDetailsModal
          isOpen
          item={{ title: 'Heat', type: 'movie', year: '1995' }}
          onClose={onClose}
          onAddItem={vi.fn()}
          {...props}
        />,
      ),
    );
    return { onClose };
  };

  it('exposes a labelled modal dialog and Escape closes it', () => {
    const { onClose } = renderModal();
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(container.querySelector(`#${labelId}`).textContent).toBe('Heat');

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides missing metadata instead of showing bracketed placeholders', () => {
    renderModal({ item: { title: 'Heat', type: 'movie' } });
    expect(container.textContent).not.toContain('[add');
  });

  it.each([
    [true, 'auto'],
    [false, 'smooth'],
  ])(
    'uses %s reduced motion preference for season and next-episode scrolling',
    (reducedMotion, behavior) => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({ matches: reducedMotion })),
      );
      const frames = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) =>
        frames.push(callback),
      );
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
      const scrolls = [];
      const originalScroll = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (options) {
        scrolls.push({ element: this, options });
      };

      try {
        renderModal({
          item: {
            id: 'test-series',
            title: 'Test Series',
            type: 'show',
            source: { staleAfter: Date.now() + 60000 },
            episodeProgress: { s1e1: true },
            seasons: [1, 2].map((number) => ({
              number,
              episodes: [
                {
                  id: `s${number}e1`,
                  number: 1,
                  title: `Episode ${number}`,
                },
              ],
            })),
          },
        });
        act(() => {
          while (frames.length) frames.shift()(0);
        });

        const seasonScroll = scrolls.find(({ element }) =>
          element.matches('[data-season-number="2"]'),
        );
        expect(seasonScroll?.options).toEqual({
          behavior,
          inline: 'center',
          block: 'nearest',
        });
        const episodeScroll = scrolls.find(({ element }) =>
          element.matches('[data-episode-id="s2e1"]'),
        );
        expect(episodeScroll?.options).toEqual({
          behavior,
          block: 'center',
          inline: 'nearest',
        });
      } finally {
        if (originalScroll) {
          Element.prototype.scrollIntoView = originalScroll;
        } else {
          delete Element.prototype.scrollIntoView;
        }
      }
    },
  );

  it('adds directly without a classification picker', async () => {
    const onAddItem = vi.fn().mockResolvedValue(undefined);
    const { onClose } = renderModal({ onAddItem });
    const addButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent.includes('Add to shelf'),
    );
    await act(async () => addButton.click());
    expect(onAddItem).toHaveBeenCalledOnce();
    expect(onAddItem.mock.calls[0][0].title).toBe('Heat');
    expect(container.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(container.textContent).not.toContain('Vibe');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
