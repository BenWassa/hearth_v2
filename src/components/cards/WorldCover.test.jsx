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

  it('is named by the World, with one decorative lazy card image', async () => {
    const button = await mount(<WorldCover world={world} onOpen={() => {}} />);
    expect(button.getAttribute('aria-label')).toBe('Pixar');
    const images = button.querySelectorAll('img');
    // The logo is baked into the card, so there is nothing to overlay.
    expect(images).toHaveLength(1);
    const [art] = images;
    expect(art.getAttribute('src')).toBe('/assets/worlds/pixar/card.webp');
    expect(art.getAttribute('alt')).toBe('');
    expect(art.getAttribute('loading')).toBe('lazy');
    expect(button.textContent).toBe('2 sagas');
    const described = document.getElementById(
      button.getAttribute('aria-describedby'),
    );
    expect(described.textContent).toBe('2 sagas');
  });

  it('uses the World card field when present', async () => {
    const button = await mount(
      <WorldCover world={{ ...world, card: '/c.webp' }} onOpen={() => {}} />,
    );
    expect(button.querySelector('img').getAttribute('src')).toBe('/c.webp');
  });

  it('falls back to the serif World name when the card image fails', async () => {
    const button = await mount(<WorldCover world={world} onOpen={() => {}} />);
    await act(async () => {
      button.querySelector('img').dispatchEvent(new Event('error'));
    });
    expect(button.querySelectorAll('img')).toHaveLength(0);
    const name = button.querySelector('.font-serif');
    expect(name.textContent).toBe('Pixar');
    expect(button.getAttribute('aria-label')).toBe('Pixar');
  });

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
