import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ActionBar from './ActionBar';

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

describe('ActionBar', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('does not render a status button for shows', async () => {
    const mounted = await renderIntoDom(
      <ActionBar
        item={{ id: 'show-1', type: 'show', status: 'unwatched' }}
        onToggleStatus={jest.fn()}
      />,
    );

    expect(mounted.container.querySelector('button')).toBeNull();
    await cleanupDom(mounted);
  });

  it('renders mark watched button for unwatched movies', async () => {
    const onToggleStatus = jest.fn();
    const mounted = await renderIntoDom(
      <ActionBar
        item={{ id: 'movie-1', type: 'movie', status: 'unwatched' }}
        onToggleStatus={onToggleStatus}
      />,
    );

    const button = mounted.container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button.textContent).toContain('Mark Watched');

    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onToggleStatus).toHaveBeenCalledWith('movie-1', 'unwatched');

    await cleanupDom(mounted);
  });
});
