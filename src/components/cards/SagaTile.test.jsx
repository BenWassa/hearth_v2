import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import SagaTile from './SagaTile.jsx';
global.IS_REACT_ACT_ENVIRONMENT = true;

let root, host;
const mount = async (element) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(element));
};
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
});

const saga = {
  id: 'saga-x',
  title: 'Toy Story Collection',
  backdrop: '/abc.jpg',
};

it('is a button named by the saga name without the Collection suffix', async () => {
  const open = vi.fn();
  await mount(<SagaTile saga={saga} onOpen={open} />);
  const tile = host.querySelector('button');
  expect(tile.getAttribute('aria-label')).toBe('Toy Story');
  expect(tile.textContent).toBe('Toy Story');
  expect(tile.className).toContain('aspect-video');
  expect(tile.className).toContain('min-h-[44px]');
  expect(host.querySelector('img')).not.toBeNull();
  await act(async () => tile.click());
  expect(open).toHaveBeenCalledWith(saga);
});

it('falls back to the name on warm stone with no scrim when the art is missing or fails', async () => {
  await mount(<SagaTile saga={{ id: 's', title: '' }} onOpen={vi.fn()} />);
  expect(host.querySelector('img')).toBeNull();
  await act(async () => root.render(<SagaTile saga={saga} onOpen={vi.fn()} />));
  expect(host.querySelector('.bg-gradient-to-t')).not.toBeNull();
  await act(async () =>
    host.querySelector('img').dispatchEvent(new Event('error')),
  );
  expect(host.querySelector('img')).toBeNull();
  expect(host.querySelector('.bg-gradient-to-t')).toBeNull();
  expect(host.querySelector('button').className).toContain('bg-stone-800');
  expect(host.textContent).toBe('Toy Story');
});
