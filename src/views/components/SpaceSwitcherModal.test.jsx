import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import SpaceSwitcherModal from './SpaceSwitcherModal.jsx';
import WipeConfirmModal from './tonight/WipeConfirmModal.jsx';

const spaces = [
  { id: 'a', name: 'Living Room' },
  { id: 'b', name: 'Cabin' },
];

const mount = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return {
    container,
    cleanup: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
};

const pressEscape = () =>
  act(async () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
  });

describe('SpaceSwitcherModal', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('is a labelled dialog that marks the active space and closes on Escape', async () => {
    const onClose = vi.fn();
    const { container, cleanup } = await mount(
      <SpaceSwitcherModal
        spaces={spaces}
        currentSpaceId="a"
        onSelect={() => {}}
        onCreateNew={() => {}}
        onClose={onClose}
      />,
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = container.querySelector(
      `#${dialog.getAttribute('aria-labelledby')}`,
    );
    expect(title.textContent).toBe('Choose a Space');
    expect(container.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
    expect(
      container.querySelector('button[aria-label="Close space switcher"]'),
    ).toBeTruthy();

    await pressEscape();
    expect(onClose).toHaveBeenCalledOnce();
    await cleanup();
  });

  it('cannot be dismissed when there is no current space', async () => {
    const onClose = vi.fn();
    const { container, cleanup } = await mount(
      <SpaceSwitcherModal
        spaces={spaces}
        onSelect={() => {}}
        onCreateNew={() => {}}
        onClose={onClose}
      />,
    );

    expect(
      container.querySelector('button[aria-label="Close space switcher"]'),
    ).toBeNull();
    await pressEscape();
    expect(onClose).not.toHaveBeenCalled();
    await cleanup();
  });
});

describe('WipeConfirmModal', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('is a labelled dialog that closes on Escape', async () => {
    const onClose = vi.fn();
    const { container, cleanup } = await mount(
      <WipeConfirmModal
        isOpen
        wipeConfirmText=""
        setWipeConfirmText={() => {}}
        canConfirmWipe={false}
        onClose={onClose}
        onConfirm={() => {}}
      />,
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(
      container.querySelector(`#${dialog.getAttribute('aria-labelledby')}`)
        .textContent,
    ).toBe('Delete all titles?');

    await pressEscape();
    expect(onClose).toHaveBeenCalledOnce();
    await cleanup();
  });
});
