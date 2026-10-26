import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ShowSeasonsSection from './ShowSeasonsSection.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const episode = {
  id: 's1e1',
  number: 1,
  title: 'Pilot',
  description: 'First.',
  watched: true,
};
const season = { id: 's1', number: 1, episodes: [episode], episodeCount: 1 };

const Harness = ({ onConfirm }) => {
  const [open, setOpen] = useState(true);
  return (
    <ShowSeasonsSection
      seasons={[season]}
      totalSeasons={1}
      seasonScrollRef={{ current: null }}
      handleSeasonKeyDown={() => {}}
      seasonProgress={[{ season, total: 1, watched: 1, progress: 100 }]}
      entireShowProgress={{ percent: 100, watched: 1, total: 1 }}
      activeSeason={season}
      setActiveSeasonNum={() => {}}
      scrollToSeason={() => {}}
      seasonScrollState={{ canScrollLeft: false, canScrollRight: false }}
      handleToggleSeasonWatched={() => setOpen(true)}
      isActiveSeasonWatched
      episodesWithState={[episode]}
      episodeStats={{ total: 1, watched: 1, progress: 100, nextUpId: null }}
      expandedEpisodeId={null}
      setExpandedEpisodeId={() => {}}
      revealedEpisodeIds={{}}
      handleToggleEpisode={() => {}}
      setRevealedEpisodeIds={() => {}}
      episodeMapStatus="ready"
      handleRetryEpisodeFetch={() => {}}
      isSeasonResetConfirmOpen={open}
      setIsSeasonResetConfirmOpen={setOpen}
      handleConfirmSeasonReset={onConfirm}
    />
  );
};

describe('ShowSeasonsSection', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows a labelled reset dialog that Escape dismisses', () => {
    act(() => root.render(<Harness onConfirm={vi.fn()} />));
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(
      container.querySelector(`#${dialog.getAttribute('aria-labelledby')}`)
        .textContent,
    ).toBe('Mark season unwatched?');

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('marks the selected season with aria-pressed on real buttons', () => {
    act(() => root.render(<Harness onConfirm={vi.fn()} />));
    const button = container.querySelector('[data-season-number="1"]');
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
});
