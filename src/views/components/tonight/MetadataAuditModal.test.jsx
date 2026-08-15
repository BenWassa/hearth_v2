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
});
