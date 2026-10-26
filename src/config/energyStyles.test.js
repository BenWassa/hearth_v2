import { ENERGIES } from './constants.js';
import { ENERGY_STYLES, getEnergyStyle } from './energyStyles.js';

describe('energyStyles', () => {
  it('covers every energy with all fields', () => {
    ENERGIES.forEach(({ id }) => {
      expect(Object.keys(ENERGY_STYLES[id]).sort()).toEqual([
        'bg',
        'icon',
        'label',
        'selected',
        'text',
      ]);
    });
  });

  it('falls back to balanced for unknown energy', () => {
    expect(getEnergyStyle('focused')).toBe(ENERGY_STYLES.focused);
    expect(getEnergyStyle('nope')).toBe(ENERGY_STYLES.balanced);
    expect(getEnergyStyle(undefined)).toBe(ENERGY_STYLES.balanced);
  });
});
