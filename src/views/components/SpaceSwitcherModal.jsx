import React, { useState } from 'react';
import { ArrowRight, Check, Loader2, Plus } from 'lucide-react';
import hearthVector from '../../assets/hearth_vector_up.png';

const SpaceSwitcherModal = ({
  spaces = [],
  currentSpaceId,
  onSelect,
  onCreateNew,
  isLoading = false,
}) => {
  const [creating, setCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const trimmedName = newSpaceName.trim();

  const getInitials = (name = '') =>
    (name.replace(/[^a-z]/gi, '').slice(0, 2) || '?').toUpperCase();

  const handleCreate = () => {
    if (!trimmedName) return;
    onCreateNew(trimmedName);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 px-6 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <img
            src={hearthVector}
            alt="Hearth"
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-2xl font-serif tracking-wide text-stone-100">
            Choose a Space
          </h1>
          <p className="text-xs text-stone-500 text-center">
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
            <p className="text-center text-sm text-stone-500 py-4">
              No spaces found. Create one below.
            </p>
          ) : (
            spaces.map((space) => {
              const isCurrent = space.id === currentSpaceId;
              return (
                <button
                  key={space.id}
                  onClick={() => onSelect(space.id, space.name)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-colors text-left ${
                    isCurrent
                      ? 'bg-amber-900/20 border-amber-700/40 text-amber-200'
                      : 'bg-stone-900/60 border-stone-800/60 text-stone-200 hover:bg-stone-800/60 hover:border-stone-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold uppercase shrink-0 ${
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
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Create new space
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && trimmedName && handleCreate()}
                placeholder="Space name..."
                maxLength={100}
                className="w-full bg-stone-900/50 border border-stone-800/80 text-stone-100 placeholder:text-stone-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCreating(false);
                    setNewSpaceName('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-stone-800 text-stone-500 hover:text-stone-300 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!trimmedName}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-bold text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  Create
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceSwitcherModal;
