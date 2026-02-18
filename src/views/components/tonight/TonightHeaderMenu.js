import React, { useEffect, useRef, useState } from 'react';
import { Menu, User } from 'lucide-react';
import { APP_VERSION } from '../../../version';
import hearthVector from '../../../assets/hearth_vector_up.png';

const TonightHeaderMenu = ({
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
  const [isSpaceLabelOpen, setIsSpaceLabelOpen] = useState(false);
  const hideSpaceLabelTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideSpaceLabelTimerRef.current) {
        clearTimeout(hideSpaceLabelTimerRef.current);
      }
    };
  }, []);

  const revealSpaceLabel = () => {
    if (hideSpaceLabelTimerRef.current) {
      clearTimeout(hideSpaceLabelTimerRef.current);
    }
    setIsSpaceLabelOpen(true);
    hideSpaceLabelTimerRef.current = setTimeout(() => {
      setIsSpaceLabelOpen(false);
    }, 5000);
  };

  return (
    <>
      {isMenuOpen && (
        <button
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
      <header className="fixed top-0 inset-x-0 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-md px-2 sm:px-3 py-3 flex items-center justify-between z-40 border-b border-stone-800/70 bg-gradient-to-b from-stone-950/95 to-stone-950/80 backdrop-blur-xl shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
        <div className="relative z-10 w-10 flex justify-start">
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`p-2 -ml-2 rounded-full transition-colors ${
              isMenuOpen
                ? 'text-amber-400 bg-stone-900'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            title="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          {isMenuOpen && (
            <div
              className="absolute left-0 mt-2 w-48 bg-stone-950 border border-stone-800 rounded-xl shadow-2xl overflow-hidden z-30"
              role="menu"
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onInvite();
                }}
                className="w-full px-4 py-3 text-left text-base text-stone-300 hover:bg-stone-900/60 transition-colors"
                role="menuitem"
              >
                Invite partner
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onImport();
                }}
                className="w-full px-4 py-3 text-left text-base text-stone-300 hover:bg-stone-900/60 transition-colors"
                role="menuitem"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onExport();
                }}
                className="w-full px-4 py-3 text-left text-base text-stone-300 hover:bg-stone-900/60 transition-colors"
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
                    className="w-full px-4 py-3 text-left text-base text-amber-300 hover:bg-amber-950/20 hover:text-amber-200 transition-colors border-t border-stone-900"
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
                    className="w-full px-4 py-3 text-left text-base text-amber-300 hover:bg-amber-950/20 hover:text-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-t border-stone-900"
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
                  className="w-full px-4 py-3 text-left text-base text-rose-300 hover:bg-rose-950/30 hover:text-rose-200 transition-colors border-t border-stone-900"
                  role="menuitem"
                >
                  Delete all titles
                </button>
              )}
              <div className="px-4 py-3 text-sm text-stone-400 border-t border-stone-900">
                Version {APP_VERSION}
              </div>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onSignOut();
                }}
                className="w-full px-4 py-3 text-left text-base text-stone-300 hover:bg-stone-900/60 hover:text-stone-200 transition-colors border-t border-stone-900"
                role="menuitem"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 text-stone-100">
          <img
            src={hearthVector}
            alt="Hearth"
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
          />
          <h1 className="text-2xl sm:text-[1.7rem] leading-none font-serif tracking-wide">
            Hearth
          </h1>
        </div>

        <div className="relative z-10 w-10 flex justify-end">
          <button
            type="button"
            onClick={revealSpaceLabel}
            className="w-8 h-8 rounded-full bg-stone-900/80 border border-stone-800 flex items-center justify-center"
            title={spaceLabel}
            aria-label={spaceLabel}
          >
            <User className="w-3.5 h-3.5 text-stone-400" />
          </button>
          <div
            className={`absolute right-10 top-1/2 -translate-y-1/2 bg-stone-900/95 border border-stone-800 rounded-full px-3 py-1 transition-all duration-300 ${
              isSpaceLabelOpen
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-2 pointer-events-none'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300 whitespace-nowrap">
              {spaceLabel || 'Space'}
            </span>
          </div>
        </div>
      </header>
    </>
  );
};

export default TonightHeaderMenu;
