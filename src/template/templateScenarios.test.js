import { describe, expect, it } from 'vitest';
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
      buildTemplateScenario('shows').filter((item) => item.status === 'watching'),
    ).toHaveLength(4);
    expect(buildTemplateScenario('busy').some((item) => item.status === 'watched')).toBe(
      true,
    );
    expect(buildTemplateScenario(DEFAULT_TEMPLATE_SCENARIO).length).toBeGreaterThan(
      buildTemplateScenario('few').length,
    );
  });
});
