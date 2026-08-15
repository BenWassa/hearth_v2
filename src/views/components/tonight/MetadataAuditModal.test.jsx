import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import MetadataAuditModal from './MetadataAuditModal.jsx';

const auditReport = {
  totalItems: 2,
  completeItems: 2,
  itemsWithGaps: 0,
  gapCounts: {},
  byType: { movie: { total: 1, withGaps: 0 }, show: { total: 1, withGaps: 0 } },
  missingRows: [],
};

describe('MetadataAuditModal', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('offers a full refresh even when the audit reports no gaps', async () => {
    const onMetadataRefreshAll = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MetadataAuditModal
          isOpen
          onClose={() => {}}
          auditReport={auditReport}
          onMetadataRefreshAll={onMetadataRefreshAll}
        />,
      );
    });

    const button = Array.from(container.querySelectorAll('button')).find(
      (entry) => entry.textContent.includes('Refresh all metadata'),
    );
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
    });
    expect(onMetadataRefreshAll).toHaveBeenCalledOnce();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('shows show-level and episode-level description gaps', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MetadataAuditModal
          isOpen
          onClose={() => {}}
          auditReport={{
            totalItems: 1,
            completeItems: 0,
            itemsWithGaps: 1,
            gapCounts: { showDescription: 1, episodeDescriptions: 1 },
            missingEpisodeDescriptions: 2,
            byType: {
              movie: { total: 0, withGaps: 0 },
              show: { total: 1, withGaps: 1 },
            },
            missingRows: [
              {
                id: 'show-1',
                title: 'Show',
                type: 'show',
                gaps: ['showDescription', 'episodeDescriptions'],
                missingEpisodeDescriptions: [
                  {
                    seasonNumber: 1,
                    episodeNumber: 2,
                    title: 'Second',
                  },
                  {
                    seasonNumber: 2,
                    episodeNumber: 1,
                    title: 'Return',
                  },
                ],
              },
            ],
          }}
          onMetadataRefreshAll={() => {}}
        />,
      );
    });

    expect(container.textContent).toContain('Show descriptions: 1');
    expect(container.textContent).toContain('Episode descriptions: 2');
    expect(container.textContent).toContain('S1E2 Second');
    expect(container.textContent).toContain('S2E1 Return');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
