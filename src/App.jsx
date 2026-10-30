import React, { Suspense, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { ENERGIES, VIBES } from './config/constants.js';
import { isTemplateMode } from './app/useConfiguredAppState.js';
import { useAppState } from './app/useAppState.js';
import { lazyWithPrefetch, prefetchOnIdle } from './app/lazyWithPrefetch.js';
import OnboardingView from './views/OnboardingView.jsx';
import TonightView from './views/TonightView.jsx';
import RecentlyRemovedNotice from './components/RecentlyRemovedNotice.jsx';
import { isRecentlyRemovedNotice } from './app/recentlyRemovedNotice.js';

// Non-first-paint views and modals ship as separate chunks. Tonight and the
// shell stay eager. Chunks are prefetched on idle after first render so a tap
// rarely waits on the network.
const ShelfView = lazyWithPrefetch(() => import('./views/ShelfView.jsx'));
const AddView = lazyWithPrefetch(() => import('./views/AddView.jsx'));
const DecisionView = lazyWithPrefetch(() => import('./views/DecisionView.jsx'));
const ImportModal = lazyWithPrefetch(() => import('./views/ImportModal.jsx'));
const SpaceSwitcherModal = lazyWithPrefetch(() =>
  import('./views/components/SpaceSwitcherModal.jsx'),
);

export function AppLoadingScreen() {
  return (
    <div className="min-h-dvh bg-shell flex items-center justify-center">
      <div className="animate-pulse text-amber-700">
        <Heart className="w-8 h-8 opacity-50" />
      </div>
    </div>
  );
}

/**
 * Real (Firebase-backed) app. Template mode renders HearthAppView from
 * src/template/TemplateApp.jsx with its own state hook, which is lazy-loaded
 * from src/index.jsx so the template code and seed data stay out of this chunk.
 */
export default function HearthApp() {
  return <HearthAppView appState={useAppState()} />;
}

export function HearthAppView({ appState }) {
  const {
    autoReloadCountdown,
    authResolved,
    contextItems,
    decisionContext,
    decisionResult,
    dismissUpdate,
    errorMessage,
    handleAddItem,
    handleBulkDelete,
    removedItems,
    handleRestoreRemoved,
    handlePurgeRemoved,
    handleCreateSpace,
    handleDeleteAll,
    handleDelete,
    handleExportItems,
    goBack,
    handleImportItems,
    handleLoadUserSpaces,
    handleMarkWatched,
    handleMetadataAudit,
    handleMetadataRefreshAll,
    loadTemplateScenario,
    backgroundAuditReport,
    handleReloadNow,
    handleSignIn,
    handleSignOut,
    handleSwitchSpace,
    handleUpdateItem,
    isBootstrapping,
    isBulkDeleting,
    isDeciding,
    isImportOpen,
    importProgress,
    isMetadataRepairing,
    isSpaceSetupRunning,
    isWipingSpace,
    isSigningIn,
    items,
    joinError,
    loading,
    newVersionAvailable,
    spaceId,
    setIsImportOpen,
    setView,
    spaceName,
    startDecision,
    updateMessage,
    templateScenario,
    user,
    userSpaces,
    view,
  } = appState;

  const [isSpaceSwitcherOpen, setIsSpaceSwitcherOpen] = useState(false);

  // On startup: if authenticated with known spaces but no space stored, show switcher
  // Guard against the new-user onboarding flow (userSpaces.length === 0 means they haven't made one yet)
  useEffect(() => {
    if (!authResolved || !user || isBootstrapping || isTemplateMode) return;
    if (!spaceId && userSpaces.length > 0) {
      setIsSpaceSwitcherOpen(true);
    }
  }, [authResolved, user, spaceId, isBootstrapping, userSpaces]);

  useEffect(
    () =>
      prefetchOnIdle([
        ShelfView,
        AddView,
        DecisionView,
        SpaceSwitcherModal,
        ...(isTemplateMode ? [] : [ImportModal]),
      ]),
    [],
  );

  const handleOpenSpaceSwitcher = () => {
    handleLoadUserSpaces();
    setIsSpaceSwitcherOpen(true);
  };

  const handleSpaceSwitcherSelect = (id, name) => {
    setIsSpaceSwitcherOpen(false);
    handleSwitchSpace(id, name);
    setView('tonight');
  };

  const handleSpaceSwitcherCreate = (name) => {
    setIsSpaceSwitcherOpen(false);
    handleCreateSpace(name);
  };
  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');
  const isDevToolsContext = Boolean(import.meta?.env?.DEV) || isLocalHost;
  const allowTemplateDevMenu = isTemplateMode && isDevToolsContext;
  const showDevMetadataTools =
    (!isTemplateMode && isDevToolsContext) || allowTemplateDevMenu;

  if (!authResolved || isBootstrapping) {
    return <AppLoadingScreen />;
  }

  if (loading && !items.length && view !== 'onboarding' && view !== 'tonight') {
    return <AppLoadingScreen />;
  }

  return (
    <div className="min-h-dvh bg-shell text-stone-300 font-sans selection:bg-amber-900/50 selection:text-amber-200 pl-safe-l pr-safe-r">
      <div className="relative w-full lg:max-w-md lg:mx-auto min-h-dvh flex flex-col">
        {errorMessage && (
          <div role="alert" className="px-6 pt-4 text-sm text-stone-300">
            {errorMessage}
          </div>
        )}
        <RecentlyRemovedNotice
          message={
            !newVersionAvailable && isRecentlyRemovedNotice(updateMessage)
              ? updateMessage
              : ''
          }
          onDismiss={dismissUpdate}
        />
        {newVersionAvailable ? (
          <div className="mx-4 mt-4 mb-2">
            <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-amber-200 mb-1">
                    Update Available
                  </h3>
                  <p className="text-xs text-stone-300 mb-3">
                    {updateMessage}
                    {autoReloadCountdown !== null && (
                      <span className="block mt-1 text-amber-400/80">
                        Auto-reloading in {autoReloadCountdown}s...
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="min-h-11 min-w-11 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 text-sm font-medium rounded-md transition-opacity motion-safe:active:scale-95"
                      onClick={handleReloadNow}
                    >
                      Reload Now
                    </button>
                    <button
                      className="min-h-11 min-w-11 px-4 py-2 bg-stone-800/60 hover:bg-stone-700/60 border border-stone-600 text-stone-300 text-sm font-medium rounded-md transition-opacity"
                      onClick={dismissUpdate}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          updateMessage &&
          !isRecentlyRemovedNotice(updateMessage) && (
            <div className="px-6 pt-2 text-xs text-stone-300">
              {updateMessage}
            </div>
          )
        )}

        {view === 'onboarding' && (
          <OnboardingView
            onCreate={handleCreateSpace}
            onSignIn={handleSignIn}
            joinError={joinError}
            isBusy={isSpaceSetupRunning}
            isSigningIn={isSigningIn}
            user={user}
          />
        )}

        {view === 'tonight' && (
          <TonightView
            items={items}
            isLoading={loading}
            onAdd={() => setView('add')}
            onImport={() => setIsImportOpen(true)}
            onExport={handleExportItems}
            onDeleteAll={handleDeleteAll}
            hasRemovedItems={removedItems.length > 0}
            onOpenRemoved={() => setView('recently-removed')}
            onDecide={(pool, context) => startDecision(pool, context)}
            onToggleStatus={handleMarkWatched}
            onDelete={handleDelete}
            onUpdate={handleUpdateItem}
            onAddItem={handleAddItem}
            showDevMetadataTools={showDevMetadataTools}
            onMetadataAudit={handleMetadataAudit}
            onMetadataRefreshAll={handleMetadataRefreshAll}
            backgroundAuditReport={backgroundAuditReport}
            isMetadataRepairing={isMetadataRepairing}
            goToShelf={() => setView('shelf')}
            importProgress={importProgress}
            spaceId={spaceId}
            spaceName={spaceName}
            userSpaces={userSpaces}
            onSwitchSpace={handleSwitchSpace}
            onAddSpace={handleOpenSpaceSwitcher}
            isDeletingAll={isWipingSpace}
            onSignOut={handleSignOut}
            showUtilityMenu={!isTemplateMode || allowTemplateDevMenu}
            showSignOut={!isTemplateMode}
            isTemplateSession={isTemplateMode}
            loadTemplateScenario={loadTemplateScenario}
            templateScenario={templateScenario}
          />
        )}

        <Suspense fallback={null}>
          {(view === 'shelf' || view === 'recently-removed') && (
            <ShelfView
              items={items}
              onAdd={() => setView('add')}
              onToggleStatus={handleMarkWatched}
              onUpdate={handleUpdateItem}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              showRemoved={view === 'recently-removed'}
              removedItems={removedItems}
              onRestoreRemoved={handleRestoreRemoved}
              onPurgeRemoved={handlePurgeRemoved}
              isBulkDeleting={isBulkDeleting}
              onBack={goBack}
            />
          )}

          {view === 'add' && (
            <AddView
              removedItems={removedItems}
              items={items}
              onBack={goBack}
              onSubmit={handleAddItem}
              allowManualEntry={isTemplateMode}
            />
          )}

          {view === 'decision' && (
            <DecisionView
              isDeciding={isDeciding}
              result={decisionResult}
              onClose={goBack}
              onReroll={() =>
                startDecision(
                  contextItems.filter((item) => item.id !== decisionResult?.id),
                  decisionContext,
                )
              }
              decisionContext={decisionContext}
            />
          )}
        </Suspense>

        {isImportOpen && !isTemplateMode && (
          <Suspense fallback={null}>
            <ImportModal
              onClose={() => setIsImportOpen(false)}
              onImport={handleImportItems}
              importProgress={importProgress}
              validVibes={VIBES.map((v) => v.id)}
              validEnergies={ENERGIES.map((e) => e.id)}
              existingItems={items}
            />
          </Suspense>
        )}
      </div>

      {isSpaceSwitcherOpen && (
        <Suspense fallback={null}>
          <SpaceSwitcherModal
            spaces={userSpaces}
            currentSpaceId={spaceId}
            onSelect={handleSpaceSwitcherSelect}
            onCreateNew={handleSpaceSwitcherCreate}
            onClose={() => setIsSpaceSwitcherOpen(false)}
            isLoading={false}
          />
        </Suspense>
      )}

      {/* Camera cutout / status bar strip. Sits above every view and modal
          (highest z in the app is 80) so the inset always reads as solid
          shell black, never a translucent header or a poster bleeding up.
          Collapses to 0px on hardware without a cutout. */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[100] h-safe-t bg-shell pointer-events-none"
      />
    </div>
  );
}
