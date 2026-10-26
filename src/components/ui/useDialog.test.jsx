import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useDialog from './useDialog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const Dialog = ({ onClose, label, children }) => {
  const dialogProps = useDialog({ onClose });
  return (
    <div {...dialogProps} aria-label={label}>
      <button>first {label}</button>
      {children}
      <button>last {label}</button>
    </div>
  );
};

const press = (key, options = {}) =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, ...options }),
    );
  });

describe('useDialog', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('exposes dialog semantics, focuses in, and restores focus on close', () => {
    const Harness = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button id="opener" onClick={() => setOpen(true)}>
            opener
          </button>
          {open && <Dialog label="one" onClose={() => setOpen(false)} />}
        </>
      );
    };
    act(() => root.render(<Harness />));
    const opener = container.querySelector('#opener');
    opener.focus();
    act(() => opener.click());

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.contains(document.activeElement)).toBe(true);

    press('Escape');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('only closes the topmost dialog on Escape', () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const Harness = ({ showInner }) => (
      <Dialog label="outer" onClose={outer}>
        {showInner && <Dialog label="inner" onClose={inner} />}
      </Dialog>
    );
    act(() => root.render(<Harness showInner={false} />));
    // A nested picker opens after its parent has mounted.
    act(() => root.render(<Harness showInner />));
    press('Escape');
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it('wraps Tab from the last control back to the first', () => {
    act(() => root.render(<Dialog label="trap" onClose={() => {}} />));
    const [first, last] = container.querySelectorAll('button');
    last.focus();
    press('Tab');
    expect(document.activeElement).toBe(first);
  });

  it('skips display:none controls when choosing focus and trapping Tab', () => {
    act(() =>
      root.render(
        <Dialog label="resp" onClose={() => {}}>
          <button style={{ display: 'none' }}>hidden close</button>
        </Dialog>,
      ),
    );
    const buttons = container.querySelectorAll('button');
    expect(document.activeElement).toBe(buttons[0]);
    buttons[2].focus();
    press('Tab');
    expect(document.activeElement).toBe(buttons[0]);
  });
});
