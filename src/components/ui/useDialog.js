import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, oldest first. Only the last one reacts to Escape and Tab so a
// nested picker closes before the modal underneath it.
const openDialogs = [];

// jsdom has no layout, so walk up checking computed styles instead of using
// getClientRects(). Catches display:none from responsive classes like `sm:hidden`.
const isVisible = (el) => {
  if (el.closest('[hidden], [inert]')) return false;
  for (
    let node = el;
    node && node !== document.body;
    node = node.parentElement
  ) {
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
};

/**
 * Dialog contract for hand-rolled modals: Escape closes the topmost dialog,
 * Tab stays inside it, focus moves in on open and returns to the opener on close.
 *
 * Spread the result on the dialog root and add `aria-labelledby` pointing at the
 * visible title:
 *   <div {...useDialog({ onClose })} aria-labelledby="item-title" className="fixed inset-0 ..." />
 *
 * Render the scrim as a decorative sibling (`aria-hidden`, `tabIndex={-1}`) so
 * it never joins the tab order.
 */
const useDialog = ({ onClose, initialFocusRef } = {}) => {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const opener = document.activeElement;
    openDialogs.push(node);

    const target =
      initialFocusRef?.current ||
      Array.from(node.querySelectorAll(FOCUSABLE)).find(isVisible) ||
      node;
    target.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (openDialogs[openDialogs.length - 1] !== node) return;

      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        isVisible,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!node.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = openDialogs.indexOf(node);
      if (index !== -1) openDialogs.splice(index, 1);
      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
    // initialFocusRef is read once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, role: 'dialog', 'aria-modal': true, tabIndex: -1 };
};

export default useDialog;
