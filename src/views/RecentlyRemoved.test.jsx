import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import RecentlyRemoved, { timeLeftLabel } from './RecentlyRemoved.jsx';

it('shows live titles with 44px restore actions and reports conflicts and purge failures', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const onRestore = vi.fn().mockResolvedValue({ status: 'conflict' });
  const onPurge = vi.fn().mockResolvedValue([{ status: 'failed' }]);
  const onBack = vi.fn();
  await act(async () =>
    root.render(
      <RecentlyRemoved
        items={[
          {
            id: 'one',
            title: 'Still available',
            poster: '/poster.jpg',
            removedAt: Date.now(),
          },
          {
            id: 'two',
            title: 'Expired title',
            removedAt: Date.now() - 86400000,
          },
        ]}
        onRestore={onRestore}
        onPurge={onPurge}
        onBack={onBack}
      />,
    ),
  );
  expect(container.textContent).toContain('Still available');
  expect(container.textContent).not.toContain('Expired title');
  expect(container.textContent).toContain(
    'Some expired titles could not be cleared',
  );
  expect(container.querySelector('img').alt).toBe('');
  const restore = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Restore',
  );
  expect(restore.getAttribute('aria-label')).toBe('Restore Still available');
  expect(restore.className).toContain('min-h-11');
  await act(async () => restore.click());
  expect(onRestore).toHaveBeenCalledWith('one');
  expect(container.textContent).toContain(
    'This title is already on your shelf',
  );
  await act(async () => container.querySelector('button').click());
  expect(onBack).toHaveBeenCalled();
  await act(async () => root.unmount());
  container.remove();
});

it('minute cleanup reads the latest callback after another member removes a title', async () => {
  vi.useFakeTimers();
  const root = createRoot(document.createElement('div'));
  const first = vi.fn().mockResolvedValue([]);
  const latest = vi.fn().mockResolvedValue([]);
  try {
    await act(async () =>
      root.render(<RecentlyRemoved items={[]} onPurge={first} />),
    );
    await act(async () =>
      root.render(
        <RecentlyRemoved
          items={[{ id: 'new', title: 'New', removedAt: Date.now() }]}
          onPurge={latest}
        />,
      ),
    );
    await act(async () => vi.advanceTimersByTime(60000));
    expect(latest).toHaveBeenCalledOnce();
    expect(first).toHaveBeenCalledOnce();
  } finally {
    await act(async () => root.unmount());
    vi.useRealTimers();
  }
});

it('uses human time remaining at every boundary', () => {
  for (const [hours, label] of [
    [24, 'About 24 hours left'],
    [23.01, 'About 24 hours left'],
    [23, '23 hours left'],
    [2, '2 hours left'],
    [1.9, 'About 1 hour left'],
    [1, 'About 1 hour left'],
    [0.99, 'Less than an hour left'],
    [1 / 60, 'Less than an hour left'],
  ]) {
    expect(timeLeftLabel(hours * 3600000)).toBe(label);
  }
});
it('sorts by expiry, aligns Back, uses readable text and names restored titles', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () =>
    root.render(
      <RecentlyRemoved
        items={[
          { id: 'later', title: 'Later', removedAt: Date.now() },
          { id: 'soon', title: 'Soon', removedAt: Date.now() - 80000000 },
        ]}
        onPurge={async () => []}
        onRestore={async () => ({ status: 'restored' })}
      />,
    ),
  );
  expect(
    [...container.querySelectorAll('h2')].map((el) => el.textContent),
  ).toEqual(['Soon', 'Later']);
  expect(container.querySelector('button').className).toContain('!pl-0');
  expect(container.querySelector('.text-stone-400')).toBeNull();
  await act(async () =>
    container.querySelector('[aria-label="Restore Soon"]').click(),
  );
  expect(container.querySelector('[role="status"]').textContent).toContain(
    'Restored Soon.',
  );
  await act(async () => root.unmount());
});
