import React from 'react';
import { Menu } from 'lucide-react';
import { APP_VERSION } from '../../../version';

const TonightHeaderMenu = ({
  greeting,
  spaceLabel,
  isMenuOpen,
  setIsMenuOpen,
  onInvite,
  onImport,
  onExport,
  showDevMetadataTools,
  openAuditModal,
  onMetadataRepairMissing,
  isMetadataRepairing,
  onDeleteAll,
  onOpenDeleteAll,
  onSignOut,
}) => {
  return (
    <>
      {isMenuOpen && (
        <button
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
      <header className="px-6 py-8 flex justify-between items-start">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-amber-700 font-bold uppercase tracking-widest">
            {greeting}
          </p>
          <h2
            className="text-3xl font-serif text-stone-100 max-w-full"
            title={spaceLabel}
            aria-label={spaceLabel}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {spaceLabel}
          </h2>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`p-2 rounded-full transition-colors ${
              isMenuOpen
                ? 'bg-stone-900 text-amber-400'
                : 'bg-stone-900/50 text-stone-400 hover:text-stone-200'
            }`}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          {isMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-stone-950 border border-stone-800 rounded-xl shadow-2xl overflow-hidden z-30"
              role="menu"
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onInvite();
                }}
                className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 transition-colors"
                role="menuitem"
              >
                Invite partner
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onImport();
                }}
                className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 transition-colors"
                role="menuitem"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onExport();
                }}
                className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 transition-colors"
                role="menuitem"
              >
                Export
              </button>
              {showDevMetadataTools && (
                <>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      openAuditModal();
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-amber-300 hover:bg-amber-950/20 hover:text-amber-200 transition-colors border-t border-stone-900"
                    role="menuitem"
                  >
                    Audit Metadata (Dev)
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onMetadataRepairMissing?.();
                    }}
                    disabled={isMetadataRepairing}
                    className="w-full px-4 py-3 text-left text-sm text-amber-300 hover:bg-amber-950/20 hover:text-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-t border-stone-900"
                    role="menuitem"
                  >
                    {isMetadataRepairing
                      ? 'Repairing Metadata...'
                      : 'Repair Missing Metadata (Dev)'}
                  </button>
                </>
              )}
              {onDeleteAll && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenDeleteAll();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-rose-300 hover:bg-rose-950/30 hover:text-rose-200 transition-colors border-t border-stone-900"
                  role="menuitem"
                >
                  Delete all titles
                </button>
              )}
              <div className="px-4 py-3 text-xs text-stone-400 border-t border-stone-900">
                Version {APP_VERSION}
              </div>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onSignOut();
                }}
                className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 hover:text-stone-200 transition-colors border-t border-stone-900"
                role="menuitem"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default TonightHeaderMenu;
