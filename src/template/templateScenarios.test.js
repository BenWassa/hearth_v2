import { describe, expect, it } from 'vitest';
import { buildTemplateSeedItems } from './seedLibrary.js';
import { getShowWatchStatus } from '../components/ItemDetailsModal/utils/showProgress.js';
import {
  buildTemplateScenario,
  DEFAULT_TEMPLATE_SCENARIO,
  TEMPLATE_SCENARIOS,
} from './templateScenarios.js';

describe('template scenarios', () => {
  it('provides deterministic shelves for every profile', () => {
    for (const scenario of TEMPLATE_SCENARIOS) {
      const first = buildTemplateScenario(scenario.id);
      const second = buildTemplateScenario(scenario.id);
      expect(first).toEqual(second);
    }
  });

  it('covers the intended data situations', () => {
    expect(buildTemplateScenario('empty')).toHaveLength(0);
    expect(
      buildTemplateScenario('movies').every((item) => item.type === 'movie'),
    ).toBe(true);
    expect(
      buildTemplateScenario('shows').filter(
        (item) => item.status === 'watching',
      ),
    ).toHaveLength(4);
    expect(
      buildTemplateScenario('busy').some((item) => item.status === 'watched'),
    ).toBe(true);
    expect(
      buildTemplateScenario(DEFAULT_TEMPLATE_SCENARIO).length,
    ).toBeGreaterThan(buildTemplateScenario('few').length);
  });
});

describe('demo data integrity', () => {
  it('makes the default household useful immediately', () => {
    const items = buildTemplateSeedItems();
    expect(items).toHaveLength(30);
    expect(new Set(items.map((item) => item.status))).toEqual(
      new Set(['unwatched', 'watching', 'watched']),
    );
    expect(items.every((item) => item.note.trim().length > 0)).toBe(true);
    const activeShows = items.filter(
      (item) => item.type === 'show' && item.status === 'watching',
    );
    expect(activeShows.length).toBeGreaterThanOrEqual(6);
    // Include both a mid-season stop and a season boundary.
    expect(activeShows.some((item) => item.episodeProgress.s2e2)).toBe(true);
    expect(
      activeShows.some(
        (item) => item.episodeProgress.s1e8 && !item.episodeProgress.s2e1,
      ),
    ).toBe(true);
  });

  it('keeps status, progress, dates and identity consistent in every scenario', () => {
    for (const scenario of TEMPLATE_SCENARIOS) {
      const items = buildTemplateScenario(scenario.id);
      expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
      const identities = items.map(
        (item) => `${item.type}:${item.source.providerId}`,
      );
      expect(new Set(identities).size).toBe(items.length);
      for (const item of items) {
        if (item.type === 'show') {
          expect(
            getShowWatchStatus(item),
            `${scenario.id}: ${item.title}`,
          ).toBe(item.status);
          const episodeIds = new Set(
            item.seasons.flatMap((season) =>
              season.episodes.map((episode) => String(episode.id)),
            ),
          );
          expect(
            Object.keys(item.episodeProgress).every((id) => episodeIds.has(id)),
          ).toBe(true);
        }
        if (item.startedAt)
          expect(item.startedAt).toBeGreaterThanOrEqual(item.createdAt);
        if (item.markedWatchedAt)
          expect(item.markedWatchedAt).toBeGreaterThanOrEqual(item.createdAt);
      }
    }
  });

  it('provides completed histories and genuine collection groups', () => {
    expect(
      buildTemplateScenario('completed').every(
        (item) => item.status === 'watched',
      ),
    ).toBe(true);
    const collections = buildTemplateScenario('collections');
    expect(
      new Set(collections.map((item) => item.collection.providerId)).size,
    ).toBe(5);
    expect(collections.some((item) => item.status === 'watched')).toBe(true);
    expect(collections.some((item) => item.status === 'unwatched')).toBe(true);
    expect(buildTemplateScenario('busy').length).toBeGreaterThan(30);
  });

  it('isolates edits from future resets, including nested episode data', () => {
    const first = buildTemplateSeedItems();
    const show = first.find((item) => item.type === 'show');
    show.seasons[0].episodes[0].name = 'Changed';
    show.episodeProgress.injected = true;
    first[0].note = 'Changed';
    const reset = buildTemplateSeedItems();
    expect(reset[0].note).not.toBe('Changed');
    const resetShow = reset.find((item) => item.id === show.id);
    expect(resetShow.seasons[0].episodes[0].name).not.toBe('Changed');
    expect(resetShow.episodeProgress.injected).toBeUndefined();
  });
});
