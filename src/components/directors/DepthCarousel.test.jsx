import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import catalog from '../../config/directorEssentials.json';
import DepthCarousel from './DepthCarousel.jsx';

vi.mock('gsap', () => ({
  default: {
    to: vi.fn((position, { index, onUpdate, onComplete }) => {
      position.index = index;
      onUpdate();
      onComplete();
      return { kill: vi.fn() };
    }),
  },
}));

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

it('jumps to a director via its dot and marks it current', async () => {
  const dot = host.querySelector(
    `[aria-label="Go to ${directors[7].name}, 8 of 12"]`,
  );
  await click(dot);
  expect(front()).toBe(card(7));
  expect(dot.getAttribute('aria-current')).toBe('true');
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

it('swipes to the next director without opening a card', async () => {
  const stage = card(0).parentElement.parentElement;
  stage.setPointerCapture = vi.fn();
  const pointer = (type, clientX) =>
    Object.assign(new Event(type, { bubbles: true }), {
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      clientX,
    });

  await act(async () => {
    card(0).dispatchEvent(pointer('pointerdown', 150));
    stage.dispatchEvent(pointer('pointermove', 120));
    stage.dispatchEvent(pointer('pointerup', 120));
    card(1).dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
  });

  expect(front()).toBe(card(1));
  expect(onOpen).not.toHaveBeenCalled();
});

it('updates immediately without a tween when reduced motion is preferred', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  card(0).focus();
  await key('ArrowRight');
  expect(front()).toBe(card(1));
  expect(card(1).style.opacity).toBe('1');
  expect(gsap.to).not.toHaveBeenCalled();
});
