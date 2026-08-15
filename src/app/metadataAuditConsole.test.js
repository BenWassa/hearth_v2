import { vi } from 'vitest';
import { logMetadataAuditSummary } from './metadataAuditConsole.js';

describe('logMetadataAuditSummary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a structured audit summary and gap tables', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const group = vi
      .spyOn(console, 'groupCollapsed')
      .mockImplementation(() => {});
    const table = vi.spyOn(console, 'table').mockImplementation(() => {});
    const groupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    const output = logMetadataAuditSummary(
      {
        generatedAt: Date.parse('2026-08-15T12:00:00Z'),
        totalItems: 4,
        completeItems: 2,
        itemsWithGaps: 2,
        missingEpisodeDescriptions: 3,
        gapCounts: { poster: 0, showDescription: 1, episodeDescriptions: 1 },
        missingRows: [
          {
            title: 'Show',
            type: 'show',
            gaps: ['showDescription', 'episodeDescriptions'],
            missingEpisodeDescriptions: [{}, {}, {}],
          },
        ],
      },
      { source: 'manual' },
    );

    expect(output.summary).toMatchObject({
      source: 'manual',
      totalTitles: 4,
      completeTitles: 2,
      titlesWithGaps: 2,
      missingEpisodeDescriptions: 3,
    });
    expect(info).toHaveBeenCalledWith(
      '[metadata-audit] Summary',
      output.summary,
    );
    expect(group).toHaveBeenCalledOnce();
    expect(table).toHaveBeenCalledTimes(2);
    expect(groupEnd).toHaveBeenCalledOnce();
  });
});
