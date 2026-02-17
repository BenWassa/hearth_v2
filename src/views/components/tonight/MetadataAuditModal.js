import React from 'react';
import { BarChart3, X } from 'lucide-react';

const MetadataAuditModal = ({
  isOpen,
  onClose,
  isAuditLoading,
  auditReport,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <button
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Close metadata audit"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-700 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-serif text-stone-100">
                Metadata Audit
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 transition-colors p-1 hover:bg-stone-800 rounded"
              aria-label="Close metadata audit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isAuditLoading ? (
            <div className="text-sm text-stone-400">Running audit...</div>
          ) : !auditReport ? (
            <div className="text-sm text-stone-400">
              Audit data is unavailable right now.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg bg-stone-900/40 border border-stone-800 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-stone-500">
                    Total
                  </div>
                  <div className="text-lg font-semibold text-stone-100">
                    {auditReport.totalItems}
                  </div>
                </div>
                <div className="rounded-lg bg-stone-900/40 border border-stone-800 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-stone-500">
                    Complete
                  </div>
                  <div className="text-lg font-semibold text-emerald-300">
                    {auditReport.completeItems}
                  </div>
                </div>
                <div className="rounded-lg bg-stone-900/40 border border-stone-800 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-stone-500">
                    Missing
                  </div>
                  <div className="text-lg font-semibold text-amber-300">
                    {auditReport.itemsWithGaps}
                  </div>
                </div>
                <div className="rounded-lg bg-stone-900/40 border border-stone-800 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-stone-500">
                    Shows Missing
                  </div>
                  <div className="text-lg font-semibold text-amber-300">
                    {auditReport.byType.show.withGaps}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-stone-900/30 border border-stone-800 px-3 py-3 text-xs text-stone-300 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>Source: {auditReport.gapCounts.source || 0}</div>
                <div>Poster: {auditReport.gapCounts.poster || 0}</div>
                <div>Backdrop: {auditReport.gapCounts.backdrop || 0}</div>
                <div>Runtime: {auditReport.gapCounts.runtimeMinutes || 0}</div>
                <div>Year: {auditReport.gapCounts.year || 0}</div>
                <div>Genres: {auditReport.gapCounts.genres || 0}</div>
                <div>Actors: {auditReport.gapCounts.actors || 0}</div>
                <div>Director: {auditReport.gapCounts.director || 0}</div>
                <div>
                  Season Count: {auditReport.gapCounts.seasonCount || 0}
                </div>
                <div>Seasons: {auditReport.gapCounts.seasons || 0}</div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-stone-500">
                  Missing Items ({auditReport.missingRows.length})
                </div>
                {auditReport.missingRows.length === 0 ? (
                  <div className="text-sm text-stone-400">
                    No missing metadata found.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {auditReport.missingRows.slice(0, 100).map((row) => (
                      <div
                        key={row.id}
                        className="rounded-lg border border-stone-800 bg-stone-900/30 px-3 py-2"
                      >
                        <div className="text-sm text-stone-200">
                          {row.title}
                        </div>
                        <div className="text-[11px] text-stone-500 uppercase tracking-wider">
                          {row.type}
                        </div>
                        <div className="text-xs text-amber-300 mt-1">
                          Missing: {row.gaps.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MetadataAuditModal;
