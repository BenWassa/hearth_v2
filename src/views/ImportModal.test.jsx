import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import ImportModal from './ImportModal';
import { ENERGIES, VIBES } from '../config/constants.js';

const mount = async (props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <ImportModal
        validVibes={VIBES.map((v) => v.id)}
        validEnergies={ENERGIES.map((e) => e.id)}
        {...props}
      />,
    );
  });
  return {
    container,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
};

const clickByText = async (container, text) => {
  const button = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent.includes(text),
  );
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

const reachReview = async (container) => {
  await clickByText(container, 'Load sample data');
  await clickByText(container, 'Preview');
};

const pasteRows = async (container, rows) => {
  await clickByText(container, 'Next');
  const input = container.querySelector('#import-raw-text');
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    ).set.call(input, JSON.stringify(rows));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await clickByText(container, 'Preview');
};

describe('ImportModal', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('is a labelled dialog', async () => {
    const mounted = await mount({ onClose: vi.fn(), onImport: vi.fn() });
    const dialog = mounted.container.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-labelledby')).toBe('import-title');
    expect(mounted.container.querySelector('#import-title')).not.toBeNull();
    await mounted.unmount();
  });

  it('moves focus into each import step when its navigation control disappears', async () => {
    const mounted = await mount({ onClose: vi.fn(), onImport: vi.fn() });
    const next = Array.from(mounted.container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Next',
    );
    next.focus();
    await clickByText(mounted.container, 'Next');
    expect(document.activeElement).toBe(
      mounted.container.querySelector('#import-raw-text'),
    );
    await clickByText(mounted.container, 'Back');
    await pasteRows(mounted.container, [
      { title: 'Test film', type: 'movie', vibe: 'comfort', energy: 'light' },
    ]);
    expect(document.activeElement.textContent).toContain('Step 3 of 3');

    await clickByText(mounted.container, 'Back');
    expect(document.activeElement).toBe(
      mounted.container.querySelector('#import-raw-text'),
    );
    await clickByText(mounted.container, 'Back');
    expect(document.activeElement).toBe(
      mounted.container.querySelector('#import-llm-prompt'),
    );
    await mounted.unmount();
  });

  it('focuses the next missing field when a corrected row disappears, then the review heading', async () => {
    const mounted = await mount({ onClose: vi.fn(), onImport: vi.fn() });
    await pasteRows(mounted.container, [
      { title: 'First film', type: 'movie', vibe: 'comfort' },
      { title: 'Second film', type: 'movie', vibe: 'easy' },
    ]);
    const firstLight = Array.from(
      mounted.container.querySelectorAll('button'),
    ).find((button) => button.textContent === 'Light');
    firstLight.focus();
    await act(async () => firstLight.click());
    expect(mounted.container.querySelector('[value="First film"]')).toBeNull();
    expect(document.activeElement.getAttribute('aria-labelledby')).toBe(
      'import-energy-label-1',
    );
    await clickByText(mounted.container, 'Light');
    expect(document.activeElement.textContent).toContain('Step 3 of 3');
    await mounted.unmount();
  });

  it('focuses the remaining issue when an import checkbox removes its row', async () => {
    const mounted = await mount({ onClose: vi.fn(), onImport: vi.fn() });
    await pasteRows(mounted.container, [
      { title: 'First film', type: 'movie', vibe: 'comfort' },
      { title: 'Second film', type: 'movie', vibe: 'easy' },
    ]);
    const checkbox = mounted.container.querySelector('input[type="checkbox"]');
    checkbox.focus();
    await act(async () => checkbox.click());
    expect(document.activeElement.getAttribute('aria-labelledby')).toBe(
      'import-energy-label-1',
    );
    await mounted.unmount();
  });

  it('associates invalid and missing fields with readable correction instructions', async () => {
    const mounted = await mount({ onClose: vi.fn(), onImport: vi.fn() });
    await pasteRows(mounted.container, [
      { title: '', type: 'other', energy: 'other' },
    ]);
    const errors = [
      ['input[aria-label="Title"]', 'Title is required.'],
      [
        '[aria-labelledby="import-type-label-0"]',
        'Type must be movie or show.',
      ],
      ['[aria-labelledby="import-vibe-label-0"]', 'Choose a vibe.'],
      [
        '[aria-labelledby="import-energy-label-0"]',
        'Energy must be one of the listed options.',
      ],
    ];
    for (const [selector, message] of errors) {
      const field = mounted.container.querySelector(selector);
      expect(field.getAttribute('aria-invalid')).toBe('true');
      expect(
        document.getElementById(field.getAttribute('aria-describedby'))
          .textContent,
      ).toBe(message);
    }
    expect(mounted.container.textContent).not.toContain(
      'marked in red or orange',
    );
    await clickByText(mounted.container, 'Assign Manually');
    expect(document.activeElement).toBe(
      mounted.container.querySelector('input[aria-label="Title"]'),
    );
    await mounted.unmount();
  });

  it('closes when the import resolves, not on a timer', async () => {
    const onClose = vi.fn();
    const onImport = vi.fn().mockResolvedValue(undefined);
    const mounted = await mount({ onClose, onImport });
    await reachReview(mounted.container);
    await clickByText(mounted.container, 'Import');
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    await mounted.unmount();
  });

  it('stays open with a Try again action when the import fails', async () => {
    const onClose = vi.fn();
    const onImport = vi.fn().mockRejectedValue(new Error('boom'));
    const mounted = await mount({ onClose, onImport });
    await reachReview(mounted.container);
    await clickByText(mounted.container, 'Import');
    expect(onClose).not.toHaveBeenCalled();
    expect(mounted.container.textContent).toContain('did not finish');
    await clickByText(mounted.container, 'Try again');
    expect(onImport).toHaveBeenCalledTimes(2);
    await mounted.unmount();
  });

  it('drives the progress bar from processed over total', async () => {
    let resolveImport;
    const onImport = vi.fn(
      () => new Promise((resolve) => (resolveImport = resolve)),
    );
    const mounted = await mount({
      onClose: vi.fn(),
      onImport,
      importProgress: { total: 4, processed: 1 },
    });
    await reachReview(mounted.container);
    await clickByText(mounted.container, 'Import');
    const bar = mounted.container.querySelector('[role="progressbar"]');
    expect(bar.getAttribute('aria-valuenow')).toBe('25');
    expect(bar.firstElementChild.style.transform).toBe('scaleX(0.25)');
    await act(async () => resolveImport());
    await mounted.unmount();
  });
});
