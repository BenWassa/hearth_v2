import React, { useEffect } from 'react';
import { BarChart3, Wrench, X } from 'lucide-react';
import Button from '../../../components/ui/Button.jsx';
import Dialog from '../../../components/ui/Dialog.jsx';
import IconButton from '../../../components/ui/IconButton.jsx';

const GAP_LABELS = {
  overview: 'movie description',
  showDescription: 'show description',
  episodeDescriptions: 'episode descriptions',
};

const MetadataAuditModal = ({
  isOpen,
  onClose,
  isAuditLoading,
  auditReport,
  onMetadataRefreshAll,
  isMetadataRepairing = false,
}) => {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-stone-950/85"
        onClick={onClose}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Dialog
        onClose={onClose}
        aria-labelledby="metadata-audit-title"
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="pointer-events-auto max-h-[85vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-stone-800 bg-stone-900 p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-400" />
              <h3
                id="metadata-audit-title"
                className="font-serif text-lg text-stone-100"
              >
                Metadata Audit
              </h3>
            </div>
            <IconButton label="Close metadata audit" onClick={onClose}>
              <X className="h-5 w-5" />
            </IconButton>
          </div>

          {isAuditLoading ? (
            <div className="text-sm text-stone-400">Running audit...</div>
          ) : !auditReport ? (
            <div className="text-sm text-stone-400">
              Audit data is unavailable right now.
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-stone-800 py-3 sm:grid-cols-4">
                <div>
                  <dt className="text-label uppercase tracking-widest text-stone-400">
                    Total
                  </dt>
                  <dd className="text-lg font-semibold text-stone-100">
                    {auditReport.totalItems}
                  </dd>
                </div>
                <div>
                  <dt className="text-label uppercase tracking-widest text-stone-400">
                    Complete
                  </dt>
                  <dd className="text-lg font-semibold text-stone-100">
                    {auditReport.completeItems}
                  </dd>
                </div>
                <div>
                  <dt className="text-label uppercase tracking-widest text-stone-400">
                    Missing
                  </dt>
                  <dd className="text-lg font-semibold text-amber-300">
                    {auditReport.itemsWithGaps}
                  </dd>
                </div>
                <div>
                  <dt className="text-label uppercase tracking-widest text-stone-400">
                    Shows Missing
                  </dt>
                  <dd className="text-lg font-semibold text-amber-300">
                    {auditReport.byType.show.withGaps}
                  </dd>
                </div>
              </dl>

              <div className="grid grid-cols-2 gap-2 text-xs text-stone-300 sm:grid-cols-3">
                <div>Source: {auditReport.gapCounts.source || 0}</div>
                <div>Poster: {auditReport.gapCounts.poster || 0}</div>
                <div>Backdrop: {auditReport.gapCounts.backdrop || 0}</div>
                <div>Logo: {auditReport.gapCounts.logo || 0}</div>
                <div>Runtime: {auditReport.gapCounts.runtimeMinutes || 0}</div>
                <div>Year: {auditReport.gapCounts.year || 0}</div>
                <div>
                  Movie descriptions: {auditReport.gapCounts.overview || 0}
                </div>
                <div>
                  Show descriptions:{' '}
                  {auditReport.gapCounts.showDescription || 0}
                </div>
                <div>
                  Episode descriptions:{' '}
                  {auditReport.missingEpisodeDescriptions || 0}
                </div>
                <div>Genres: {auditReport.gapCounts.genres || 0}</div>
                <div>Actors: {auditReport.gapCounts.actors || 0}</div>
                <div>Director: {auditReport.gapCounts.director || 0}</div>
                <div>
                  Season Count: {auditReport.gapCounts.seasonCount || 0}
                </div>
                <div>Seasons: {auditReport.gapCounts.seasons || 0}</div>
              </div>

              <div className="space-y-2">
                <div className="text-label uppercase tracking-widest text-stone-400">
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
                        className="border-b border-stone-800 px-1 py-2"
                      >
                        <div className="text-sm text-stone-200">
                          {row.title}
                        </div>
                        <div className="text-label text-stone-400 uppercase tracking-wider">
                          {row.type}
                        </div>
                        <div className="text-xs text-amber-300 mt-1">
                          Missing:{' '}
                          {row.gaps
                            .map((gap) => GAP_LABELS[gap] || gap)
                            .join(', ')}
                        </div>
                        {row.missingEpisodeDescriptions?.length > 0 && (
                          <div className="mt-1 text-xs text-stone-400">
                            {row.missingEpisodeDescriptions
                              .slice(0, 5)
                              .map((episode) => {
                                const episodeLabel = episode.episodeNumber
                                  ? `E${episode.episodeNumber}`
                                  : ' episode';
                                return `S${
                                  episode.seasonNumber
                                }${episodeLabel}${
                                  episode.title ? ` ${episode.title}` : ''
                                }`;
                              })
                              .join(', ')}
                            {row.missingEpisodeDescriptions.length > 5
                              ? ` +${
                                  row.missingEpisodeDescriptions.length - 5
                                } more`
                              : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-stone-800">
                <Button
                  variant="secondary"
                  onClick={() => onMetadataRefreshAll?.()}
                  disabled={isMetadataRepairing || isAuditLoading}
                  className="min-h-[44px] px-4 text-sm"
                >
                  <Wrench className="h-4 w-4 shrink-0" />
                  {isMetadataRepairing
                    ? 'Refreshing...'
                    : 'Refresh all metadata'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default MetadataAuditModal;
