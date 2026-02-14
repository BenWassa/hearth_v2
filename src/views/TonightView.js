import React, { useEffect, useMemo, useState } from 'react';
import { DAILY_TRAY_STORAGE_PREFIX } from '../config/constants.js';
import {
  buildTonightTray,
  isTonightTrayValidForPool,
} from '../domain/watchlist.js';
import ItemDetailsModal from '../components/ItemDetailsModal.js';
import BottomNav from './components/tonight/BottomNav.js';
import EnergyPickModal from './components/tonight/EnergyPickModal.js';
import MetadataAuditModal from './components/tonight/MetadataAuditModal.js';
import PickForUsCard from './components/tonight/PickForUsCard.js';
import SuggestionSection from './components/tonight/SuggestionSection.js';
import TonightHeaderMenu from './components/tonight/TonightHeaderMenu.js';
import VibePickModal from './components/tonight/VibePickModal.js';
import WipeConfirmModal from './components/tonight/WipeConfirmModal.js';

const TonightView = ({
  items,
  onAdd,
  onImport,
  onExport,
  onInvite,
  onDeleteAll,
  onDelete,
  onDecide,
  onToggleStatus,
  onUpdate,
  showDevMetadataTools = false,
  onMetadataAudit,
  onMetadataRepairMissing,
  isMetadataRepairing = false,
  goToShelf,
  importProgress,
  spaceId,
  spaceName,
  isDeletingAll,
  onSignOut,
}) => {
  const unwatched = items.filter((i) => i.status === 'unwatched');
  const unwatchedMovies = useMemo(
    () => unwatched.filter((i) => i.type === 'movie'),
    [unwatched],
  );
  const unwatchedShows = useMemo(
    () => unwatched.filter((i) => i.type === 'show'),
    [unwatched],
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [pickFilterMode, setPickFilterMode] = useState(null);
  const [pickFilters, setPickFilters] = useState({
    vibe: null,
    energy: null,
    type: null,
  });
  const [detailItem, setDetailItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [localPickError, setLocalPickError] = useState('');
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditReport, setAuditReport] = useState(null);

  const spaceLabel =
    spaceName && spaceName.trim() ? spaceName.trim() : 'Tonight';
  const activeImportTotal = Number(importProgress?.total || 0);
  const activeImportProcessed = Number(importProgress?.processed || 0);
  const showImportBanner = activeImportTotal > 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  const wipePhrase = 'WIPE';
  const canConfirmWipe =
    wipeConfirmText.trim().toUpperCase() === wipePhrase && !isDeletingAll;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const openDetails = (item) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  const openAuditModal = async () => {
    setIsAuditModalOpen(true);
    setIsAuditLoading(true);
    try {
      const report = await onMetadataAudit?.();
      setAuditReport(report || null);
    } finally {
      setIsAuditLoading(false);
    }
  };

  useEffect(() => {
    if (!detailItem) return;
    const updated = items.find((current) => current.id === detailItem.id);
    if (updated && updated !== detailItem) {
      setDetailItem(updated);
    }
  }, [detailItem, items]);

  const buildDailyTray = (pool, type) => {
    if (pool.length === 0) return [];
    const storageKey = `${DAILY_TRAY_STORAGE_PREFIX}:${
      spaceId || 'anon'
    }:${type}:${todayKey}`;

    try {
      const cached = JSON.parse(localStorage.getItem(storageKey) || 'null');
      const ids = Array.isArray(cached?.ids) ? cached.ids : [];
      const byId = new Map(pool.map((item) => [item.id, item]));
      const fromCache = ids.map((id) => byId.get(id)).filter(Boolean);
      if (
        fromCache.length === Math.min(3, pool.length) &&
        isTonightTrayValidForPool(pool, fromCache)
      ) {
        return fromCache;
      }
    } catch (err) {
      console.warn('Failed to read cached tray', err);
    }

    const tray = buildTonightTray(pool);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ ids: tray.map((item) => item.id) }),
      );
    } catch (err) {
      console.warn('Failed to cache tray', err);
    }
    return tray;
  };

  const movieSuggestions = useMemo(() => {
    return buildDailyTray(unwatchedMovies, 'movie');
  }, [unwatchedMovies, spaceId, todayKey]);

  const showSuggestions = useMemo(() => {
    return buildDailyTray(unwatchedShows, 'show');
  }, [unwatchedShows, spaceId, todayKey]);

  const closePickModal = (mode) => {
    setPickFilterMode(null);
    setIsPickModalOpen(false);
    setPickFilters((prev) => ({ ...prev, [mode]: null }));
  };

  const handleSelectVibe = (vibeId) => {
    const newVibe = pickFilters.vibe === vibeId ? null : vibeId;
    setPickFilters((prev) => ({ ...prev, vibe: newVibe }));

    if (!newVibe) return;
    const filtered = [...unwatchedMovies, ...unwatchedShows].filter(
      (item) => item.vibe === newVibe,
    );

    if (filtered.length > 0) {
      const pickedItem = filtered[Math.floor(Math.random() * filtered.length)];
      onDecide([pickedItem]);
      setPickFilters({ vibe: null, energy: null, type: null });
      setPickFilterMode(null);
      setIsPickModalOpen(false);
      return;
    }

    setLocalPickError('No items match that vibe yet.');
    setTimeout(() => setLocalPickError(''), 2500);
  };

  const handleSelectEnergy = (energyId) => {
    const newEnergy = pickFilters.energy === energyId ? null : energyId;
    setPickFilters((prev) => ({ ...prev, energy: newEnergy }));

    if (!newEnergy) return;
    const filtered = [...unwatchedMovies, ...unwatchedShows].filter(
      (item) => item.energy === newEnergy,
    );

    if (filtered.length > 0) {
      const pickedItem = filtered[Math.floor(Math.random() * filtered.length)];
      onDecide([pickedItem]);
      setPickFilters({ vibe: null, energy: null, type: null });
      setPickFilterMode(null);
      setIsPickModalOpen(false);
      return;
    }

    setLocalPickError('No items match that energy level yet.');
    setTimeout(() => setLocalPickError(''), 2500);
  };

  const handleOpenDeleteAll = () => {
    setWipeConfirmText('');
    setIsWipeConfirmOpen(true);
  };

  const closeWipeModal = () => {
    if (isDeletingAll) return;
    setIsWipeConfirmOpen(false);
    setWipeConfirmText('');
  };

  const confirmDeleteAll = async () => {
    if (!canConfirmWipe || !onDeleteAll) return;
    const didDelete = await onDeleteAll();
    if (didDelete) {
      setIsWipeConfirmOpen(false);
      setWipeConfirmText('');
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-in fade-in duration-500">
      <TonightHeaderMenu
        greeting={greeting}
        spaceLabel={spaceLabel}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onInvite={onInvite}
        onImport={onImport}
        onExport={onExport}
        showDevMetadataTools={showDevMetadataTools}
        openAuditModal={openAuditModal}
        onMetadataRepairMissing={onMetadataRepairMissing}
        isMetadataRepairing={isMetadataRepairing}
        onDeleteAll={onDeleteAll}
        onOpenDeleteAll={handleOpenDeleteAll}
        onSignOut={onSignOut}
      />

      <div className="flex-1 min-h-0 px-6 pb-6 flex flex-col overflow-hidden">
        <div className="space-y-6">
          {showImportBanner && (
            <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 px-3 py-2 space-y-1">
              <div className="text-xs text-amber-200 tabular-nums">
                Importing {activeImportProcessed}/{activeImportTotal}
              </div>
              {importProgress?.isRateLimitedBackoff && (
                <div className="text-[11px] text-amber-300/90">
                  Retrying after rate limit...
                </div>
              )}
            </div>
          )}
          <SuggestionSection
            title="Movies"
            pool={unwatchedMovies}
            suggestions={movieSuggestions}
            emptyLabel="No movies queued yet."
            onDecide={onDecide}
            onToggleStatus={onToggleStatus}
            onOpenDetails={openDetails}
          />

          <SuggestionSection
            title="TV Shows"
            pool={unwatchedShows}
            suggestions={showSuggestions}
            emptyLabel="No shows queued yet."
            onDecide={onDecide}
            onToggleStatus={onToggleStatus}
            onOpenDetails={openDetails}
          />

          <PickForUsCard
            onPickRandom={() => onDecide()}
            onPickVibe={() => {
              setLocalPickError('');
              setPickFilterMode('vibe');
              setIsPickModalOpen(true);
            }}
            onPickEnergy={() => {
              setLocalPickError('');
              setPickFilterMode('energy');
              setIsPickModalOpen(true);
            }}
          />
        </div>

        <BottomNav onAdd={onAdd} goToShelf={goToShelf} />
      </div>

      <VibePickModal
        isOpen={isPickModalOpen && pickFilterMode === 'vibe'}
        selectedVibe={pickFilters.vibe}
        onClose={() => closePickModal('vibe')}
        onSelectVibe={handleSelectVibe}
        localPickError={localPickError}
      />

      <EnergyPickModal
        isOpen={isPickModalOpen && pickFilterMode === 'energy'}
        selectedEnergy={pickFilters.energy}
        onClose={() => closePickModal('energy')}
        onSelectEnergy={handleSelectEnergy}
        localPickError={localPickError}
      />

      <ItemDetailsModal
        isOpen={isDetailOpen}
        item={detailItem}
        onClose={closeDetails}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />

      <MetadataAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        isAuditLoading={isAuditLoading}
        auditReport={auditReport}
      />

      <WipeConfirmModal
        isOpen={isWipeConfirmOpen}
        isDeletingAll={isDeletingAll}
        wipeConfirmText={wipeConfirmText}
        setWipeConfirmText={setWipeConfirmText}
        canConfirmWipe={canConfirmWipe}
        onClose={closeWipeModal}
        onConfirm={confirmDeleteAll}
      />
    </div>
  );
};

export default TonightView;
