import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const WipeConfirmModal = ({
  isOpen,
  isDeletingAll,
  wipeConfirmText,
  setWipeConfirmText,
  canConfirmWipe,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <button
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Close delete confirmation"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-rose-500/40 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-10 h-10 rounded-full bg-rose-900/40 border border-rose-500/30 flex items-center justify-center text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif text-rose-200">Delete all titles?</h3>
              <p className="text-sm text-stone-300">
                This permanently clears every title in this space for everyone.
              </p>
              <p className="text-xs text-rose-300/90 uppercase tracking-wider font-semibold">
                Type WIPE to confirm
              </p>
            </div>
          </div>

          <input
            value={wipeConfirmText}
            onChange={(event) => setWipeConfirmText(event.target.value)}
            placeholder="WIPE"
            autoComplete="off"
            className="w-full px-4 py-3 bg-stone-950/80 border border-stone-700 rounded-xl text-sm tracking-wider uppercase text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-rose-500/70 focus:ring-2 focus:ring-rose-500/20"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={Boolean(isDeletingAll)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-stone-900 border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canConfirmWipe}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-rose-600/90 text-white hover:bg-rose-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeletingAll ? 'Deleting...' : 'Delete all'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WipeConfirmModal;
