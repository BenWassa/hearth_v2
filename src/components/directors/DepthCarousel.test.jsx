import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import catalog from '../../config/directorEssentials.json';
import DepthCarousel from './DepthCarousel.jsx';

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

const swipe = async (moves) => {
  const stage = card(0).parentElement.parentElement;
  stage.setPointerCapture = vi.fn();
  const pointer = (type, clientX, timeStamp) => {
    const event = Object.assign(new Event(type, { bubbles: true }), {
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      clientX,
    });
    // React substitutes Date.now() for a zero timeStamp, so offset the clock.
    Object.defineProperty(event, 'timeStamp', { value: 1000 + timeStamp });
    return event;
  };
  const [[x0, t0], ...rest] = moves;
  const [xEnd, tEnd] = rest[rest.length - 1];
  await act(async () => {
    card(0).dispatchEvent(pointer('pointerdown', x0, t0));
    for (const [x, t] of rest)
      stage.dispatchEvent(pointer('pointermove', x, t));
    stage.dispatchEvent(pointer('pointerup', xEnd, tEnd));
    card(1).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
  });
};

it('a slow drag moves one director without opening a card', async () => {
  await swipe([
    [300, 0],
    [285, 200],
    [270, 400],
  ]);
  expect(front()).toBe(card(1));
  expect(onOpen).not.toHaveBeenCalled();
});

it('a quick flick spins on through several directors and stops on one', async () => {
  await swipe([
    [300, 0],
    [285, 30],
    [270, 60],
  ]);
  expect(front()).toBe(card(4));
  expect(onOpen).not.toHaveBeenCalled();
});

it('a flick the other way spins backwards around the wheel', async () => {
  await swipe([
    [270, 0],
    [285, 30],
    [300, 60],
  ]);
  expect(front()).toBe(card(8));
});

it('updates immediately without animation when reduced motion is preferred', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  card(0).focus();
  await key('ArrowRight');
  expect(front()).toBe(card(1));
  expect(card(1).style.opacity).toBe('1');
});
