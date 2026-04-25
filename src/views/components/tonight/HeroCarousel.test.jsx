import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import HeroCarousel from './HeroCarousel';

const renderIntoDom = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
};

const cleanupDom = async ({ container, root }) => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
};

const dispatchTouch = (element, type, { x, y }) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const touch = { clientX: x, clientY: y };
  Object.defineProperty(event, 'targetTouches', {
    value: type === 'touchend' || type === 'touchcancel' ? [] : [touch],
  });
  Object.defineProperty(event, 'changedTouches', {
    value: [touch],
  });
  element.dispatchEvent(event);
};

describe('HeroCarousel', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses logo art when available and shows no title text fallback on image failure', async () => {
    const mounted = await renderIntoDom(
      <HeroCarousel
        items={[
          {
            id: '1',
            title: 'Severance',
            type: 'show',
            year: '2022',
            backdrop: '/backdrop.jpg',
            logo: 'https://example.com/logo.png',
          },
        ]}
      />,
    );

    const logo = mounted.container.querySelector('img[alt="Severance logo"]');
    expect(logo).toBeTruthy();

    await act(async () => {
      logo.dispatchEvent(new Event('error'));
    });

    expect(
      mounted.container.querySelector('img[alt="Severance logo"]'),
    ).toBeNull();
    expect(mounted.container.textContent).not.toContain('Severance');

    await cleanupDom(mounted);
  });

  it('auto-advances every 6 seconds and opens currently active item', async () => {
    vi.useFakeTimers();
    const onOpenDetails = vi.fn();

    const mounted = await renderIntoDom(
      <HeroCarousel
        items={[
          {
            id: '1',
            title: 'Movie One',
            type: 'movie',
            year: '2001',
            backdrop: '/one.jpg',
          },
          {
            id: '2',
            title: 'Movie Two',
            type: 'movie',
            year: '2002',
            backdrop: '/two.jpg',
          },
        ]}
        onOpenDetails={onOpenDetails}
      />,
    );

    await act(async () => {
      vi.advanceTimersByTime(6000);
    });

    const heroButton = mounted.container.querySelector('[role="button"]');
    await act(async () => {
      heroButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenDetails).toHaveBeenCalledTimes(1);
    expect(onOpenDetails.mock.calls[0][0].title).toBe('Movie Two');

    await cleanupDom(mounted);
  });

  it('ignores mostly vertical touch movement so page scroll does not move slides', async () => {
    const onOpenDetails = vi.fn();

    const mounted = await renderIntoDom(
      <HeroCarousel
        items={[
          {
            id: '1',
            title: 'Movie One',
            type: 'movie',
            year: '2001',
            backdrop: '/one.jpg',
          },
          {
            id: '2',
            title: 'Movie Two',
            type: 'movie',
            year: '2002',
            backdrop: '/two.jpg',
          },
        ]}
        onOpenDetails={onOpenDetails}
      />,
    );

    const heroButton = mounted.container.querySelector('[role="button"]');
    await act(async () => {
      dispatchTouch(heroButton, 'touchstart', { x: 100, y: 10 });
      dispatchTouch(heroButton, 'touchmove', { x: 106, y: 80 });
      dispatchTouch(heroButton, 'touchend', { x: 106, y: 80 });
      heroButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenDetails).toHaveBeenCalledTimes(1);
    expect(onOpenDetails.mock.calls[0][0].title).toBe('Movie One');

    await cleanupDom(mounted);
  });

  it('suppresses the synthetic click after a horizontal swipe', async () => {
    const onOpenDetails = vi.fn();

    const mounted = await renderIntoDom(
      <HeroCarousel
        items={[
          {
            id: '1',
            title: 'Movie One',
            type: 'movie',
            year: '2001',
            backdrop: '/one.jpg',
          },
          {
            id: '2',
            title: 'Movie Two',
            type: 'movie',
            year: '2002',
            backdrop: '/two.jpg',
          },
        ]}
        onOpenDetails={onOpenDetails}
      />,
    );

    const heroButton = mounted.container.querySelector('[role="button"]');
    await act(async () => {
      dispatchTouch(heroButton, 'touchstart', { x: 100, y: 10 });
      dispatchTouch(heroButton, 'touchmove', { x: 50, y: 12 });
      dispatchTouch(heroButton, 'touchend', { x: 50, y: 12 });
      heroButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenDetails).not.toHaveBeenCalled();

    await act(async () => {
      heroButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenDetails).toHaveBeenCalledTimes(1);
    expect(onOpenDetails.mock.calls[0][0].title).toBe('Movie Two');

    await cleanupDom(mounted);
  });
});
