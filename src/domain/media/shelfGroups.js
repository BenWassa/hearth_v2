import {
  getEffectiveClassification,
  tagProvenance,
} from './classification.mjs';
import { primaryTheme } from './tonightClassification.js';

export const FALLBACK_SHELF_GROUP = 'ungrouped';

const vibeByTheme = {
  comfort: 'comfort',
  comedy: 'easy',
  hooked: 'gripping',
  focused: 'gripping',
  visual: 'visual',
  classic: 'classic',
};

const energyByDemand = {
  low: 'light',
  medium: 'balanced',
  high: 'focused',
};

export const getEffectiveShelfVibe = (item = {}) => {
  const provenance = tagProvenance(item);
  const vibe = item.userState?.vibe || item.vibe;
  if (provenance.vibe !== 'automatic' && vibe) return vibe;
  return vibeByTheme[primaryTheme(item)] || FALLBACK_SHELF_GROUP;
};

export const getEffectiveShelfEnergy = (item = {}) => {
  const provenance = tagProvenance(item);
  const energy = item.userState?.energy || item.energy;
  if (provenance.energy !== 'automatic' && energy) return energy;
  const { attributes } = getEffectiveClassification(item);
  return (
    energyByDemand[attributes.attentionDemand.value] || FALLBACK_SHELF_GROUP
  );
};
