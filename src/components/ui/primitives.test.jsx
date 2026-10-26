import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dialog from './Dialog.jsx';
import IconButton from './IconButton.jsx';
import ProgressBar from './ProgressBar.jsx';
import SelectChip from './SelectChip.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('ui primitives', () => {
  let container;
  let root;
  const render = (node) => act(() => root.render(node));

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('IconButton exposes its label as the accessible name and forwards clicks', () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Close details" onClick={onClick}>
        x
      </IconButton>,
    );
    const button = container.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Close details');
    expect(button.getAttribute('type')).toBe('button');
    act(() => button.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ProgressBar scales the fill with transform and honours min', () => {
    render(<ProgressBar value={0.5} min={4} label="Season progress" />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
    expect(bar.firstElementChild.style.transform).toBe('scaleX(0.04)');

    render(<ProgressBar value={0} min={4} />);
    expect(container.firstElementChild.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(container.firstElementChild.firstElementChild.style.transform).toBe(
      'scaleX(0)',
    );

    render(<ProgressBar value={250} />);
    expect(container.firstElementChild.firstElementChild.style.transform).toBe(
      'scaleX(1)',
    );
  });

  it('SelectChip reports selection with aria-pressed', () => {
    render(<SelectChip selected>Comfort</SelectChip>);
    expect(container.querySelector('button').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(
      container.querySelector('button span').classList.contains('underline'),
    ).toBe(true);
    render(<SelectChip>Comfort</SelectChip>);
    expect(container.querySelector('button').getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(
      container.querySelector('button span').classList.contains('underline'),
    ).toBe(false);
  });

  it('Dialog closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <Dialog onClose={onClose} aria-labelledby="t">
        <h2 id="t">Title</h2>
      </Dialog>,
    );
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-labelledby')).toBe('t');
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
