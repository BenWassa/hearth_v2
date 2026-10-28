import React from 'react';

export default function RecentlyRemovedNotice({ message, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-[calc(var(--safe-top)+76px)] left-[calc(var(--safe-left)+1rem)] right-[calc(var(--safe-right)+1rem)] lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[calc(28rem-2rem)] z-50"
    >
      {message && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`${message} Dismiss notice`}
          className="w-full min-h-11 rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-left text-sm text-stone-100 shadow-lg hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
        >
          {message}
          <span className="block mt-1 text-xs text-stone-400">
            Tap to dismiss
          </span>
        </button>
      )}
    </div>
  );
}
