import React, { useEffect, useRef, useState } from 'react';
import {
  LogOut,
  MoreHorizontal,
  Upload,
  Download,
  Trash2,
  Wrench,
} from 'lucide-react';
import { APP_VERSION } from '../../../version';
import hearthVector from '../../../assets/hearth_vector_up.png';

const TonightHeaderMenu = ({
  spaceLabel,
  isMenuOpen,
  setIsMenuOpen,
  onImport,
  onExport,
  showDevMetadataTools,
  openAuditModal,
  onMetadataRepairMissing,
  isMetadataRepairing,
  onDeleteAll,
  onOpenDeleteAll,
  onSignOut,
  showUtilityMenu = true,
  showSignOut = true,
  isTemplateSession = false,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const utilityRef = useRef(null);

  // Close both menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (utilityRef.current && !utilityRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setIsMenuOpen]);

  return (
    <>
      <header className="fixed top-0 inset-x-0 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-md px-3 sm:px-4 py-3 flex items-center justify-between z-40 border-b border-stone-800/70 bg-gradient-to-b from-stone-950/95 to-stone-950/80 backdrop-blur-xl shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
        {/* Left — utility actions (import/export/dev/delete) */}
        <div ref={utilityRef} className="relative z-10 w-10 flex justify-start">
          {showUtilityMenu ? (
            <>
              <button
                onClick={() => {
                  setIsMenuOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
                className={`p-2 -ml-2 rounded-lg transition-colors ${
                  isMenuOpen
                    ? 'text-stone-200 bg-stone-800/80'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {isMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-52 bg-stone-950 border border-stone-800/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-30"
                  role="menu"
                >
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onImport();
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 hover:text-stone-100 transition-colors flex items-center gap-3"
                    role="menuitem"
                  >
                    <Upload className="w-4 h-4 text-stone-500 shrink-0" />
                    Import library
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExport();
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-stone-300 hover:bg-stone-900/60 hover:text-stone-100 transition-colors flex items-center gap-3 border-t border-stone-900"
                    role="menuitem"
                  >
                    <Download className="w-4 h-4 text-stone-500 shrink-0" />
                    Export library
                  </button>
                  {onDeleteAll && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenDeleteAll();
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors flex items-center gap-3 border-t border-stone-900"
                      role="menuitem"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      Delete all titles
                    </button>
                  )}
                  {showDevMetadataTools && (
                    <>
                      <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-stone-600 border-t border-stone-900">
                        Dev tools
                      </div>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          openAuditModal();
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-amber-400/80 hover:bg-amber-950/20 hover:text-amber-300 transition-colors flex items-center gap-3"
                        role="menuitem"
                      >
                        <Wrench className="w-4 h-4 shrink-0" />
                        Audit metadata
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onMetadataRepairMissing?.();
                        }}
                        disabled={isMetadataRepairing}
                        className="w-full px-4 py-2.5 text-left text-sm text-amber-400/80 hover:bg-amber-950/20 hover:text-amber-300 transition-colors flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                        role="menuitem"
                      >
                        <Wrench className="w-4 h-4 shrink-0" />
                        {isMetadataRepairing
                          ? 'Repairing...'
                          : 'Repair missing metadata'}
                      </button>
                    </>
                  )}
                  <div className="px-4 py-2.5 text-[10px] text-stone-600 border-t border-stone-900">
                    v{APP_VERSION}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>

        {/* Centre — brand */}
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

        {/* Right — profile / account */}
        <div ref={profileRef} className="relative z-10 w-10 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsMenuOpen(false);
            }}
            className={`w-8 h-8 rounded-full border transition-colors flex items-center justify-center ${
              isProfileOpen
                ? 'bg-stone-800 border-stone-600 text-stone-100'
                : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
            }`}
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            title={spaceLabel}
          >
            <span className="text-[11px] font-bold uppercase leading-none">
              {(spaceLabel || '?').slice(0, 2)}
            </span>
          </button>
          {isProfileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 bg-stone-950 border border-stone-800/80 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-30"
              role="menu"
            >
              {/* Space identity */}
              <div className="px-4 py-3 border-b border-stone-900">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-0.5">
                  Space
                </p>
                <p className="text-sm font-medium text-stone-200 truncate">
                  {spaceLabel || '—'}
                </p>
                {isTemplateSession && (
                  <p className="mt-1 text-[11px] text-stone-500">
                    Session resets on refresh.
                  </p>
                )}
              </div>
              {showSignOut && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onSignOut();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-stone-400 hover:bg-stone-900/60 hover:text-stone-200 transition-colors flex items-center gap-3"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default TonightHeaderMenu;
