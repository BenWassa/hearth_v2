import React, { useEffect, useRef, useState } from 'react';
import {
  LogOut,
  MoreHorizontal,
  Plus,
  Upload,
  Download,
  Trash2,
  Wrench,
} from 'lucide-react';
import { APP_VERSION } from '../../../version';
import hearthVector from '../../../assets/hearth_vector_up.png';

const iconButtonBase =
  'flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 active:scale-95';

const menuSurface =
  'absolute top-full mt-2 overflow-hidden rounded-xl border border-stone-800/80 bg-stone-950/95 shadow-2xl shadow-black/55 backdrop-blur-xl';

const menuItemBase =
  'flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-150 ease-out focus:outline-none focus-visible:bg-stone-900 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/60';

const menuDivider = 'border-t border-stone-900/90';

const menuEyebrow =
  'text-[10px] font-bold uppercase tracking-widest text-stone-500';

const getSpaceInitials = (label) => {
  const words = String(label || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const initials = words
    .slice(0, 2)
    .map((word) => word.replace(/[^a-z0-9]/gi, '').charAt(0))
    .join('');

  return (initials || '?').toUpperCase();
};

const truncateUsername = (name, maxLength = 24) => {
  const trimmed = String(name || '').trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength - 1) + '…';
};

const TonightHeaderMenu = ({
  spaceLabel,
  spaceId,
  userSpaces = [],
  onSwitchSpace,
  onAddSpace,
  isMenuOpen,
  setIsMenuOpen,
  onImport,
  onExport,
  showDevMetadataTools,
  openAuditModal,
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

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Escape') return;
      setIsProfileOpen(false);
      setIsMenuOpen(false);
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setIsMenuOpen]);

  return (
    <>
      <div
        className="fixed top-0 inset-x-0 z-40 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-md bg-stone-950"
        style={{ height: 'env(safe-area-inset-top)' }}
      />
      <header
        className="fixed inset-x-0 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-md px-3 sm:px-4 py-2.5 flex items-center justify-between z-40 border-b border-stone-800/70 bg-gradient-to-b from-stone-950/95 to-stone-950/82 backdrop-blur-xl shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        style={{ top: 'env(safe-area-inset-top)' }}
      >
        <div ref={utilityRef} className="relative z-10 w-11 flex justify-start">
          {showUtilityMenu ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
                className={`${iconButtonBase} -ml-2 ${
                  isMenuOpen
                    ? 'bg-stone-800/90 text-stone-100'
                    : 'text-stone-500 hover:bg-stone-900/70 hover:text-stone-200'
                }`}
                aria-label="Open library options"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {isMenuOpen && (
                <div
                  className={`${menuSurface} left-0 z-30 w-56`}
                  role="menu"
                  aria-label="Library options"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onImport?.();
                    }}
                    className={`${menuItemBase} text-stone-300 hover:bg-stone-900/70 hover:text-stone-100`}
                    role="menuitem"
                  >
                    <Upload className="w-4 h-4 text-stone-500 shrink-0" />
                    Import library
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExport?.();
                    }}
                    className={`${menuItemBase} ${menuDivider} text-stone-300 hover:bg-stone-900/70 hover:text-stone-100`}
                    role="menuitem"
                  >
                    <Download className="w-4 h-4 text-stone-500 shrink-0" />
                    Export library
                  </button>
                  {onDeleteAll && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenDeleteAll?.();
                      }}
                      className={`${menuItemBase} ${menuDivider} text-red-400 hover:bg-red-950/30 hover:text-red-300 focus-visible:bg-red-950/30`}
                      role="menuitem"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      Delete all titles
                    </button>
                  )}
                  {showDevMetadataTools && (
                    <>
                      <div
                        className={`px-4 pb-1 pt-3 ${menuEyebrow} ${menuDivider}`}
                      >
                        Dev tools
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          openAuditModal?.();
                        }}
                        className={`${menuItemBase} text-amber-300/90 hover:bg-amber-950/20 hover:text-amber-200 focus-visible:bg-amber-950/20`}
                        role="menuitem"
                      >
                        <Wrench className="w-4 h-4 shrink-0" />
                        Audit metadata
                      </button>
                    </>
                  )}
                  <div
                    className={`px-4 py-2.5 text-[10px] text-stone-600 ${menuDivider}`}
                  >
                    v{APP_VERSION}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-11 w-11" />
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex max-w-[calc(100%-7.5rem)] items-center gap-2.5 text-stone-100">
          <img
            src={hearthVector}
            alt="Hearth"
            className="h-6 w-6 object-contain sm:h-7 sm:w-7"
          />
          <h1 className="truncate font-serif text-2xl leading-none tracking-wide sm:text-[1.7rem]">
            Hearth
          </h1>
        </div>

        <div ref={profileRef} className="relative z-10 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsMenuOpen(false);
            }}
            className={`${iconButtonBase} rounded-full border px-3 min-w-fit ${
              isProfileOpen
                ? 'border-stone-600 bg-stone-800 text-stone-100'
                : 'border-stone-800 bg-stone-900/80 text-stone-400 hover:border-stone-700 hover:bg-stone-900 hover:text-stone-200'
            }`}
            aria-label={`Open space menu for ${spaceLabel || 'current space'}`}
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            title={spaceLabel}
          >
            <span className="text-[11px] font-bold leading-none tracking-wide truncate max-w-[6rem]">
              {truncateUsername(spaceLabel, 16)}
            </span>
          </button>
          {isProfileOpen && (
            <div
              className={`${menuSurface} right-0 z-30 max-h-[min(70vh,28rem)] w-64 overflow-y-auto`}
              role="menu"
              aria-label="Space and account options"
            >
              <div className="border-b border-stone-900 px-4 py-3">
                <p className={`${menuEyebrow} mb-0.5`}>Space</p>
                <p
                  className="text-sm font-medium text-stone-200 truncate max-w-[11rem]"
                  title={spaceLabel || 'Space unavailable'}
                >
                  {truncateUsername(spaceLabel, 20) || 'Space unavailable'}
                </p>
                {isTemplateSession && (
                  <p className="mt-1 text-[11px] text-stone-500">
                    Session resets on refresh.
                  </p>
                )}
              </div>

              {userSpaces.length > 1 && (
                <div className="border-b border-stone-900">
                  <p className={`px-4 pb-1 pt-2.5 ${menuEyebrow}`}>
                    Switch space
                  </p>
                  {userSpaces
                    .filter((s) => s.id !== spaceId)
                    .map((space) => (
                      <button
                        type="button"
                        key={space.id}
                        onClick={() => {
                          setIsProfileOpen(false);
                          onSwitchSpace?.(space.id, space.name);
                        }}
                        className={`${menuItemBase} text-stone-300 hover:bg-stone-900/70 hover:text-stone-100`}
                        title={space.name}
                        role="menuitem"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-700/80 bg-stone-800 text-[9px] font-bold text-stone-400">
                          {getSpaceInitials(space.name)}
                        </span>
                        <span className="truncate max-w-[9rem]">
                          {truncateUsername(space.name, 18)}
                        </span>
                      </button>
                    ))}
                </div>
              )}

              {onAddSpace && !isTemplateSession && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onAddSpace();
                  }}
                  className={`${menuItemBase} ${
                    showSignOut ? menuDivider : ''
                  } text-stone-400 hover:bg-stone-900/70 hover:text-stone-200`}
                  role="menuitem"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  Add space
                </button>
              )}

              {showSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onSignOut?.();
                  }}
                  className={`${menuItemBase} text-stone-400 hover:bg-stone-900/70 hover:text-stone-200`}
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
