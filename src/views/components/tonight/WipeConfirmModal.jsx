import React, { useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button.jsx';
import Dialog from '../../../components/ui/Dialog.jsx';

const WipeConfirmModal = ({
  isOpen,
  isDeletingAll,
  wipeConfirmText,
  setWipeConfirmText,
  canConfirmWipe,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Closing is blocked while the delete is in flight.
  const handleClose = isDeletingAll ? undefined : onClose;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-stone-950/85"
        onClick={handleClose}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Dialog
        onClose={handleClose}
        aria-labelledby="wipe-confirm-title"
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="pointer-events-auto w-full max-w-md space-y-6 rounded-2xl border border-red-900/30 bg-stone-900 p-6 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-900/30 bg-red-900/20 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3
                id="wipe-confirm-title"
                className="font-serif text-lg text-stone-100"
              >
                Delete all titles?
              </h3>
              <p className="text-sm text-stone-300">
                This permanently clears every title in this space for everyone.
              </p>
              <label
                htmlFor="wipe-confirm-input"
                className="block text-xs font-semibold uppercase tracking-wider text-red-400"
              >
                Type WIPE to confirm
              </label>
            </div>
          </div>

          <input
            id="wipe-confirm-input"
            value={wipeConfirmText}
            onChange={(event) => setWipeConfirmText(event.target.value)}
            placeholder="WIPE"
            autoComplete="off"
            className="min-h-[44px] w-full rounded-xl border border-stone-700 bg-stone-800/50 px-4 py-3 text-sm uppercase tracking-wider text-stone-100 placeholder:text-stone-400 focus:border-red-700/50 focus:outline-none focus:ring-2 focus:ring-red-900/50"
          />

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={Boolean(isDeletingAll)}
              className="min-h-[44px] flex-1 px-4 text-sm font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              disabled={!canConfirmWipe}
              className="min-h-[44px] flex-1 px-4 text-sm font-semibold"
            >
              <Trash2 className="h-4 w-4" />
              {isDeletingAll ? 'Deleting...' : 'Delete all'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default WipeConfirmModal;
