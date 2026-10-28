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
    vi.unstubAllGlobals();
  });

  it('loads only nearby backdrops initially and retains outgoing art on navigation', async () => {
    const mounted = await renderIntoDom(
      <HeroCarousel
        items={Array.from({ length: 5 }, (_, index) => ({
          id: String(index),
          title: `Title ${index}`,
          backdrop: `/backdrop-${index}.jpg`,
        }))}
      />,
    );
    const sources = () =>
      Array.from(mounted.container.querySelectorAll('img')).map((image) =>
        image.getAttribute('src'),
      );
    expect(sources()).toEqual(['/backdrop-0.jpg', '/backdrop-1.jpg']);
    const first = mounted.container.querySelector('img');
    expect(first.getAttribute('loading')).toBe('eager');
    expect(first.getAttribute('fetchpriority')).toBe('high');
    expect(first.getAttribute('decoding')).toBe('async');

    await act(async () => {
      mounted.container
        .querySelector('[aria-label="Show slide 4 of 5"]')
        .click();
    });
    expect(sources()).toEqual(
      Array.from({ length: 5 }, (_, index) => `/backdrop-${index}.jpg`),
    );
    await cleanupDom(mounted);
  });

  it('bounds arrow keys and swipes at both ends while dots reach every title', async () => {
    const mounted = await renderIntoDom(
      <HeroCarousel
        items={[
          { id: '1', title: 'One' },
          { id: '2', title: 'Two' },
          { id: '3', title: 'Three' },
        ]}
      />,
    );
    const group = mounted.container.querySelector('[role="group"]');
    const current = () =>
      mounted.container
        .querySelector('[aria-current="true"]')
        .getAttribute('aria-label');
    const key = async (key) =>
      act(async () => {
        group.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true }),
        );
      });
    const swipe = async (start, end) => {
      await act(async () => {
        dispatchTouch(group, 'touchstart', { x: start, y: 10 });
      });
      await act(async () => {
        dispatchTouch(group, 'touchmove', { x: end, y: 10 });
      });
      await act(async () => {
        dispatchTouch(group, 'touchend', { x: end, y: 10 });
      });
    };
    await key('ArrowLeft');
    await swipe(50, 150);
    expect(current()).toBe('Show slide 1 of 3');
    await key('ArrowRight');
    expect(current()).toBe('Show slide 2 of 3');
    await swipe(150, 50);
    expect(current()).toBe('Show slide 3 of 3');
    await key('ArrowRight');
    await swipe(150, 50);
    expect(current()).toBe('Show slide 3 of 3');
    await key('ArrowLeft');
    expect(current()).toBe('Show slide 2 of 3');
    for (let index = 1; index <= 3; index++) {
      const dot = mounted.container.querySelector(
        `[aria-label="Show slide ${index} of 3"]`,
      );
      expect(dot.className).toContain('min-h-11 min-w-11');
      await act(async () => {
        dot.click();
      });
      expect(current()).toBe(`Show slide ${index} of 3`);
    }
    await cleanupDom(mounted);
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

  it('stays on the first title after time passes and opens it', async () => {
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
      vi.advanceTimersByTime(60000);
    });

    const heroButton = mounted.container.querySelector(
      'button[aria-label^="Open details"]',
    );
    await act(async () => {
      heroButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenDetails).toHaveBeenCalledTimes(1);
    expect(onOpenDetails.mock.calls[0][0].title).toBe('Movie One');

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

    const heroButton = mounted.container.querySelector(
      'button[aria-label^="Open details"]',
    );
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

    const heroButton = mounted.container.querySelector(
      'button[aria-label^="Open details"]',
    );
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
  it.each(['focusin', 'pointerdown', 'touchstart'])(
    'stays on the current slide after %s',
    async (type) => {
      vi.useFakeTimers();
      const items = [
        { id: '1', title: 'One' },
        { id: '2', title: 'Two' },
      ];
      const mounted = await renderIntoDom(<HeroCarousel items={items} />);
      const button = mounted.container.querySelector(
        'button[aria-label^="Open details"]',
      );
      await act(async () => {
        if (type === 'touchstart')
          dispatchTouch(button, type, { x: 100, y: 10 });
        else button.dispatchEvent(new Event(type, { bubbles: true }));
        button.dispatchEvent(new Event('focusout', { bubbles: true }));
        vi.advanceTimersByTime(18000);
        mounted.root.render(
          <HeroCarousel items={[...items, { id: '3', title: 'Three' }]} />,
        );
      });
      await act(async () => {
        vi.advanceTimersByTime(18000);
      });
      expect(
        mounted.container
          .querySelector('[aria-current="true"]')
          .getAttribute('aria-label'),
      ).toBe('Show slide 1 of 3');
      await cleanupDom(mounted);
    },
  );

  it('disables slide transitions under reduced motion while allowing pagination', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const mounted = await renderIntoDom(
      <HeroCarousel
        items={[
          { id: '1', title: 'One' },
          { id: '2', title: 'Two' },
        ]}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(18000);
    });
    expect(
      mounted.container
        .querySelector('[aria-current="true"]')
        .getAttribute('aria-label'),
    ).toBe('Show slide 1 of 2');
    await act(async () => {
      mounted.container
        .querySelector('button[aria-label="Show slide 2 of 2"]')
        .click();
    });
    expect(
      mounted.container
        .querySelector('[aria-current="true"]')
        .getAttribute('aria-label'),
    ).toBe('Show slide 2 of 2');
    const slides = mounted.container.querySelectorAll('[style*="translateX"]');
    expect(slides.length).toBe(2);
    slides.forEach((slide) => expect(slide.style.transition).toBe('none'));
    await cleanupDom(mounted);
  });
});
