import { describe, expect, it } from 'vitest';
import {
  getEffectiveShelfEnergy,
  getEffectiveShelfVibe,
  FALLBACK_SHELF_GROUP,
} from './shelfGroups.js';
import { classifyMedia } from './classification.mjs';

describe('effective Shelf groups', () => {
  it('maps automatic primary themes to the existing vibe groups', () => {
    expect(
      getEffectiveShelfVibe({
        type: 'movie',
        classification: classifyMedia({ type: 'movie' }),
        media: {
          classification: {
            ...classifyMedia({ type: 'movie' }),
            attributes: {
              ...classifyMedia({ type: 'movie' }).attributes,
              comfort: { value: 'high', confidence: 'medium' },
            },
          },
        },
      }),
    ).toBe('comfort');
  });

  it('maps Get Hooked to gripping', () => {
    expect(
      getEffectiveShelfVibe({
        media: {
          classificationOverride: {
            attributes: {
              plotMomentum: 'high',
              narrativeComplexity: 'medium',
              attentionDemand: 'low',
            },
          },
        },
      }),
    ).toBe('gripping');
  });

  it('preserves explicit and legacy vibe tags', () => {
    expect(getEffectiveShelfVibe({ vibe: 'visual' })).toBe('visual');
    expect(
      getEffectiveShelfVibe({
        vibe: 'gripping',
        tagProvenance: { vibe: 'user' },
      }),
    ).toBe('gripping');
  });

  it('maps attention demand and preserves explicit energy tags', () => {
    expect(
      getEffectiveShelfEnergy({
        media: {
          classification: {
            ...classifyMedia({ type: 'movie' }),
            attributes: {
              ...classifyMedia({ type: 'movie' }).attributes,
              attentionDemand: { value: 'low', confidence: 'medium' },
            },
          },
        },
      }),
    ).toBe('light');
    expect(getEffectiveShelfEnergy({ energy: 'focused' })).toBe('focused');
  });

  it('uses the fallback for unknown classifications', () => {
    expect(getEffectiveShelfVibe({ title: 'Unknown' })).toBe(
      FALLBACK_SHELF_GROUP,
    );
    expect(getEffectiveShelfEnergy({ title: 'Unknown' })).toBe(
      FALLBACK_SHELF_GROUP,
    );
  });
});
