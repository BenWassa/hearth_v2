import React from 'react';
import { Heart } from 'lucide-react';
import { ENERGIES, VIBES } from './config/constants.js';
import { useAppState } from './app/useAppState.js';
import OnboardingView from './views/OnboardingView.js';
import TonightView from './views/TonightView.js';
import ShelfView from './views/ShelfView.js';
import AddView from './views/AddView.js';
import ImportModal from './views/ImportModal.js';
import DecisionView from './views/DecisionView.js';

export default function HearthApp() {
  const {
    autoReloadCountdown,
    authResolved,
    contextItems,
    decisionResult,
    dismissUpdate,
    errorMessage,
    handleAddItem,
    handleBulkDelete,
    handleCreateSpace,
    handleDeleteAll,
    handleDelete,
    handleExportItems,
    handleImportItems,
    handleInvite,
    handleMarkWatched,
    handleRefreshMetadata,
    handleReloadNow,
    handleSignIn,
    handleSignOut,
    handleUpdateItem,
    isBootstrapping,
    isBulkDeleting,
    isDeciding,
    isImportOpen,
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
    user,
    view,
  } = useAppState();

  if (!authResolved || isBootstrapping) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-amber-700">
          <Heart className="w-8 h-8 opacity-50" />
        </div>
      </div>
    );
  }

  if (loading && !items.length && view !== 'onboarding') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-amber-700">
          <Heart className="w-8 h-8 opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300 font-sans selection:bg-amber-900/50 selection:text-amber-200">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(66,40,20,0.2),rgba(12,10,9,1))]"></div>

      <div className="relative w-full lg:max-w-md lg:mx-auto min-h-screen flex flex-col">
        {errorMessage && (
          <div className="px-6 pt-4 text-xs text-stone-300">{errorMessage}</div>
        )}
        {newVersionAvailable ? (
          <div className="mx-4 mt-4 mb-2">
            <div className="bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-500/40 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
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
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-md transition-colors active:scale-95"
                      onClick={handleReloadNow}
                    >
                      Reload Now
                    </button>
                    <button
                      className="px-4 py-2 bg-stone-800/60 hover:bg-stone-700/60 border border-stone-600 text-stone-300 text-sm font-medium rounded-md transition-colors"
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
          updateMessage && (
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
            onAdd={() => setView('add')}
            onImport={() => setIsImportOpen(true)}
            onExport={handleExportItems}
            onInvite={handleInvite}
            onDeleteAll={handleDeleteAll}
            onDecide={(pool) => startDecision(pool)}
            onToggleStatus={handleMarkWatched}
            onRefreshMetadata={handleRefreshMetadata}
            onUpdate={handleUpdateItem}
            goToShelf={() => setView('shelf')}
            spaceId={spaceId}
            spaceName={spaceName}
            isDeletingAll={isWipingSpace}
            onSignOut={handleSignOut}
          />
        )}

        {view === 'shelf' && (
          <ShelfView
            items={items}
            onAdd={() => setView('add')}
            onToggleStatus={handleMarkWatched}
            onRefreshMetadata={handleRefreshMetadata}
            onUpdate={handleUpdateItem}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            isBulkDeleting={isBulkDeleting}
            onBack={() => setView('tonight')}
          />
        )}

        {view === 'add' && (
          <AddView onBack={() => setView('tonight')} onSubmit={handleAddItem} />
        )}

        {view === 'decision' && (
          <DecisionView
            isDeciding={isDeciding}
            result={decisionResult}
            onClose={() => setView('tonight')}
            onReroll={() =>
              startDecision(
                contextItems.filter((item) => item.id !== decisionResult?.id),
              )
            }
          />
        )}

        {isImportOpen && (
          <ImportModal
            onClose={() => setIsImportOpen(false)}
            onImport={handleImportItems}
            validVibes={VIBES.map((v) => v.id)}
            validEnergies={ENERGIES.map((e) => e.id)}
            existingItems={items}
          />
        )}
      </div>
    </div>
  );
}
