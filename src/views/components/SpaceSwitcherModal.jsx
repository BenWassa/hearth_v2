import React, { useState } from 'react';
import { ArrowRight, Check, Loader2, Plus, X } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import IconButton from '../../components/ui/IconButton.jsx';
import hearthVector from '../../assets/hearth_vector_up.webp';

const SpaceSwitcherModal = ({
  spaces = [],
  currentSpaceId,
  onSelect,
  onCreateNew,
  onClose,
  isLoading = false,
}) => {
  const [creating, setCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const trimmedName = newSpaceName.trim();
  // First run (no current space) has nowhere to go back to, so it cannot be dismissed.
  const canDismiss = Boolean(currentSpaceId) && typeof onClose === 'function';

  const getInitials = (name = '') =>
    (name.replace(/[^a-z]/gi, '').slice(0, 2) || '?').toUpperCase();

  const handleCreate = () => {
    if (!trimmedName) return;
    onCreateNew(trimmedName);
  };

  return (
    <Dialog
      onClose={canDismiss ? onClose : undefined}
      aria-labelledby="space-switcher-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-shell pl-[calc(1.5rem+var(--safe-left))] pr-[calc(1.5rem+var(--safe-right))] pt-[max(3rem,var(--safe-top))] pb-[max(3rem,var(--safe-bottom))]"
    >
      {canDismiss && (
        <IconButton
          label="Close space switcher"
          onClick={onClose}
          className="absolute right-[calc(0.75rem+var(--safe-right))] top-[max(0.75rem,var(--safe-top))]"
        >
          <X className="h-5 w-5" />
        </IconButton>
      )}

      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <img
            src={hearthVector}
            alt=""
            width="48"
            height="48"
            loading="lazy"
            decoding="async"
            className="w-12 h-12 object-contain"
          />
          <h1
            id="space-switcher-title"
            className="text-2xl font-serif tracking-wide text-stone-100"
          >
            Choose a Space
          </h1>
          <p className="text-xs text-stone-400 text-center">
            Select the space you want to open, or create a new one.
          </p>
        </div>

        {/* Space list */}
        <div className="w-full flex flex-col gap-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            </div>
          ) : spaces.length === 0 ? (
            <p className="text-center text-sm text-stone-400 py-4">
              No spaces found. Create one below.
            </p>
          ) : (
            spaces.map((space) => {
              const isCurrent = space.id === currentSpaceId;
              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => onSelect(space.id, space.name)}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`w-full min-h-[44px] flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-opacity text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    isCurrent
                      ? 'bg-amber-900/20 border-amber-700/40 text-amber-200'
                      : 'bg-stone-900/60 border-stone-800/60 text-stone-200 hover:bg-stone-800/60 hover:border-stone-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-label font-bold uppercase shrink-0 ${
                      isCurrent
                        ? 'bg-amber-800/50 text-amber-200'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {getInitials(space.name)}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">
                    {space.name}
                  </span>
                  {isCurrent && (
                    <Check className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Create new space */}
        <div className="w-full">
          {!creating ? (
            <Button
              variant="secondary"
              onClick={() => setCreating(true)}
              className="w-full min-h-[44px] px-4 text-sm"
            >
              <Plus className="w-4 h-4" />
              Create new space
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="space-switcher-name"
                className="ml-1 text-xs font-semibold text-stone-300"
              >
                Space name
              </label>
              <input
                id="space-switcher-name"
                autoFocus
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && trimmedName && handleCreate()
                }
                placeholder="The Living Room..."
                maxLength={100}
                aria-describedby="space-switcher-name-hint"
                className="w-full min-h-[44px] bg-stone-800/50 border border-stone-700 text-stone-100 placeholder:text-stone-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-900/50 transition-opacity"
              />
              <p
                id="space-switcher-name-hint"
                className="ml-1 text-xs text-stone-400"
              >
                Enter the name of an existing space to join it. A new name
                creates a new space.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCreating(false);
                    setNewSpaceName('');
                  }}
                  className="flex-1 min-h-[44px] px-4 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!trimmedName}
                  className="flex-1 min-h-[44px] px-4 text-sm font-bold"
                >
                  Create
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default SpaceSwitcherModal;
