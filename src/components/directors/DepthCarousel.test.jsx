import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import catalog from '../../config/directorEssentials.json';
import DepthCarousel from './DepthCarousel.jsx';
import { emblaCalls } from './__fixtures__/fakeEmbla.js';

vi.mock('embla-carousel-react', () => import('./__fixtures__/fakeEmbla.js'));

global.IS_REACT_ACT_ENVIRONMENT = true;
const { directors } = catalog;
let host, root, onOpen;

beforeEach(async () => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  onOpen = vi.fn();
  await act(async () =>
    root.render(
      <DepthCarousel
        items={directors}
        renderItem={(director) => <span>{director.name}</span>}
        onOpen={onOpen}
      />,
    ),
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const card = (index) =>
  host.querySelector(`[data-director-card="${directors[index].id}"]`);
const front = () => host.querySelector('[data-director-card][tabindex="0"]');
const click = (element) => act(async () => element.click());
const key = (name) =>
  act(async () =>
    document.activeElement.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: name,
        bubbles: true,
        cancelable: true,
      }),
    ),
  );

it('renders all twelve names and gives only the front card a tab stop', () => {
  expect(
    [...host.querySelectorAll('[data-director-card]')].map(
      (el) => el.textContent,
    ),
  ).toEqual(directors.map(({ name }) => name));
  expect(front()).toBe(card(0));
  expect(card(0).getAttribute('aria-label')).toBe('Akira Kurosawa, 1 of 12');
  expect(
    host.querySelectorAll('[data-director-card][tabindex="0"]'),
  ).toHaveLength(1);
});

it('moves the front card and keyboard focus with Right, Left, End and Home', async () => {
  card(0).focus();
  for (const [name, index] of [
    ['ArrowRight', 1],
    ['ArrowLeft', 0],
    ['End', 11],
    ['Home', 0],
  ]) {
    await key(name);
    expect(front()).toBe(card(index));
    expect(document.activeElement).toBe(card(index));
  }
});

it('has no dot indicators', () => {
  expect(host.querySelector('[aria-label="Choose a director"]')).toBeNull();
  expect(host.querySelector('[aria-label^="Go to "]')).toBeNull();
});

it('opens the front director with its card as the focus-return element', async () => {
  await click(card(0));
  expect(onOpen).toHaveBeenCalledExactlyOnceWith(directors[0], card(0));
});

it('brings a tapped side card forward without opening it', async () => {
  await click(card(1));
  expect(front()).toBe(card(1));
  expect(onOpen).not.toHaveBeenCalled();
});

it('does not schedule autoplay or advance on its own', async () => {
  vi.useFakeTimers();
  await act(async () => {
    root.render(
      <DepthCarousel
        key="idle"
        items={directors}
        renderItem={(director) => director.name}
        onOpen={onOpen}
      />,
    );
  });
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => vi.advanceTimersByTime(60_000));
  expect(front()).toBe(card(0));
});

it('a tap that lands while the wheel is moving only stops it', async () => {
  const { lastApi } = await import('./__fixtures__/fakeEmbla.js');
  await act(async () => lastApi().touchWhileMoving());
  await click(card(0));
  expect(onOpen).not.toHaveBeenCalled();
  await click(card(0));
  expect(onOpen).toHaveBeenCalledOnce();
});

it('keeps keyboard focus on the front card when a swipe changes it', async () => {
  const { lastApi } = await import('./__fixtures__/fakeEmbla.js');
  card(0).focus();
  await act(async () => lastApi().scrollTo(3));
  expect(front()).toBe(card(3));
  expect(document.activeElement).toBe(card(3));
});

it('loops, lets a fling carry past several directors, and has no arrows', () => {
  const options = emblaCalls.options.at(-1);
  expect(options.loop).toBe(true);
  expect(options.skipSnaps).toBe(true);
  expect(host.querySelector('[aria-label^="Previous director"]')).toBeNull();
  expect(host.querySelector('[aria-label^="Next director"]')).toBeNull();
});

it('jumps without animation and settles one at a time when reduced motion is preferred', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  await act(async () =>
    root.render(
      <DepthCarousel
        key="reduced"
        items={directors}
        renderItem={(director) => director.name}
        onOpen={onOpen}
      />,
    ),
  );
  expect(emblaCalls.options.at(-1).skipSnaps).toBe(false);
  card(0).focus();
  await key('ArrowRight');
  expect(front()).toBe(card(1));
  expect(emblaCalls.scrollTo.at(-1)).toEqual([1, true]);
});

it('wraps across the ends and updates the hidden position counter', async () => {
  const counter = host.querySelector('p[aria-hidden="true"]');
  expect(counter.textContent).toBe('01 / 12');
  card(0).focus();

  await key('ArrowLeft');
  expect(front()).toBe(card(11));
  expect(counter.textContent).toBe('12 / 12');
  await click(front());
  expect(onOpen).toHaveBeenCalledExactlyOnceWith(directors[11], card(11));

  await key('ArrowRight');
  expect(front()).toBe(card(0));
  expect(counter.textContent).toBe('01 / 12');
});
