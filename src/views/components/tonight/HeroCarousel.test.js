import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
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

describe('HeroCarousel', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    jest.useRealTimers();
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
    jest.useFakeTimers();
    const onOpenDetails = jest.fn();

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
      jest.advanceTimersByTime(6000);
    });

    const heroButton = mounted.container.querySelector('[role="button"]');
    await act(async () => {
      heroButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onOpenDetails).toHaveBeenCalledTimes(1);
    expect(onOpenDetails.mock.calls[0][0].title).toBe('Movie Two');

    await cleanupDom(mounted);
  });
});
