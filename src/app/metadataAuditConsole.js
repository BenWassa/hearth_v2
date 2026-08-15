const toGapRows = (gapCounts = {}) =>
  Object.entries(gapCounts)
    .filter(([, count]) => Number(count) > 0)
    .map(([gap, count]) => ({ gap, affectedTitles: Number(count) }));

const toMissingRows = (rows = []) =>
  rows.map((row) => ({
    title: row?.title || '[untitled]',
    type: row?.type || 'unknown',
    missing: Array.isArray(row?.gaps) ? row.gaps.join(', ') : '',
    missingEpisodeDescriptions: row?.missingEpisodeDescriptions?.length || 0,
  }));

export const logMetadataAuditSummary = (
  report = {},
  { source = 'manual' } = {},
) => {
  const summary = {
    source,
    generatedAt: new Date(report.generatedAt || Date.now()).toISOString(),
    totalTitles: Number(report.totalItems || 0),
    completeTitles: Number(report.completeItems || 0),
    titlesWithGaps: Number(report.itemsWithGaps || 0),
    missingEpisodeDescriptions: Number(report.missingEpisodeDescriptions || 0),
  };
  const gapRows = toGapRows(report.gapCounts);
  const missingRows = toMissingRows(report.missingRows);

  console.info('[metadata-audit] Summary', summary);
  if (typeof console.groupCollapsed === 'function') {
    console.groupCollapsed(
      `[metadata-audit] ${summary.titlesWithGaps}/${summary.totalTitles} title(s) with gaps`,
    );
  }
  if (gapRows.length && typeof console.table === 'function') {
    console.table(gapRows);
  }
  if (missingRows.length && typeof console.table === 'function') {
    console.table(missingRows);
  }
  if (typeof console.groupEnd === 'function') {
    console.groupEnd();
  }

  return { summary, gapRows, missingRows };
};
