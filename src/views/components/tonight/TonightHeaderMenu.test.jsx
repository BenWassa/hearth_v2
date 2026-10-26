import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import TonightHeaderMenu from './TonightHeaderMenu.jsx';

const Harness = (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <TonightHeaderMenu
      spaceLabel="Living Room"
      spaceId="home"
      userSpaces={[
        { id: 'home', name: 'Living Room' },
        { id: 'cabin', name: 'Cabin' },
      ]}
      onAddSpace={() => {}}
      isMenuOpen={isMenuOpen}
      setIsMenuOpen={setIsMenuOpen}
      {...props}
    />
  );
};

let container;
let root;

const press = async (target, key) => {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  await act(async () => target.dispatchEvent(event));
  return event;
};

const click = async (target) => {
  await act(async () => target.click());
};

const render = async (props = {}) => {
  await act(async () => root.render(<Harness {...props} />));
};

describe('TonightHeaderMenu', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it.each([
    ['library', 'Open library options'],
    ['profile', 'Open space menu for Living Room'],
  ])(
    'supports keyboard navigation and Escape in the %s menu',
    async (_, label) => {
      await render();
      const trigger = container.querySelector(`button[aria-label="${label}"]`);
      trigger.focus();
      await press(trigger, 'ArrowDown');
      const items = Array.from(container.querySelectorAll('[role="menuitem"]'));
      expect(document.activeElement).toBe(items[0]);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      await press(document.activeElement, 'ArrowUp');
      expect(document.activeElement).toBe(items.at(-1));
      await press(document.activeElement, 'ArrowDown');
      expect(document.activeElement).toBe(items[0]);
      await press(document.activeElement, 'End');
      expect(document.activeElement).toBe(items.at(-1));
      await press(document.activeElement, 'Home');
      expect(document.activeElement).toBe(items[0]);

      await press(document.activeElement, 'Escape');
      expect(container.querySelector('[role="menu"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      await press(trigger, 'ArrowUp');
      expect(document.activeElement).toBe(
        Array.from(container.querySelectorAll('[role="menuitem"]')).at(-1),
      );
    },
  );

  it('lets Tab leave and closes without returning focus', async () => {
    vi.useFakeTimers();
    await render();
    const trigger = container.querySelector(
      'button[aria-label="Open library options"]',
    );
    await click(trigger);
    const profile = container.querySelector(
      'button[aria-label="Open space menu for Living Room"]',
    );
    // Menu items are reached with arrows, so Tab skips them and exits the menu.
    for (const item of container.querySelectorAll('[role="menuitem"]')) {
      expect(item.tabIndex).toBe(-1);
    }
    const event = await press(document.activeElement, 'Tab');
    expect(event.defaultPrevented).toBe(false);
    // jsdom does not perform the browser's default sequential focus movement.
    profile.focus();
    await act(async () => vi.runAllTimers());
    expect(container.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(profile);
  });

  it('preserves click toggles and action callbacks without stealing action focus', async () => {
    const destination = document.createElement('button');
    document.body.appendChild(destination);
    const onImport = vi.fn(() => destination.focus());
    const onAddSpace = vi.fn();
    await render({ onImport, onAddSpace });
    // The destination represents focus entering a surface opened by the action.
    try {
      const utility = container.querySelector(
        'button[aria-label="Open library options"]',
      );
      await click(utility);
      expect(document.activeElement.textContent).toContain('Import library');
      await click(utility);
      expect(container.querySelector('[role="menu"]')).toBeNull();
      await click(utility);
      await click(container.querySelector('[role="menuitem"]'));
      expect(onImport).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(destination);

      await click(
        container.querySelector(
          'button[aria-label="Open space menu for Living Room"]',
        ),
      );
      await click(
        Array.from(container.querySelectorAll('[role="menuitem"]')).find(
          (item) => item.textContent.includes('Add space'),
        ),
      );
      expect(onAddSpace).toHaveBeenCalledOnce();
      expect(container.querySelector('[role="menu"]')).toBeNull();
    } finally {
      destination.remove();
    }
  });
});
