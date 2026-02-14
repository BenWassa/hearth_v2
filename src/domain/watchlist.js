const ENERGY_IDS = ['light', 'balanced', 'focused'];

const normalizeEnergy = (energy) => {
  if (typeof energy !== 'string') return '';
  const normalized = energy.trim().toLowerCase();
  return ENERGY_IDS.includes(normalized) ? normalized : '';
};

const pickAndRemove = (items, rng = Math.random) => {
  if (!items.length) return null;
  const value = Number.isFinite(rng()) ? rng() : 0;
  const bounded = Math.max(0, Math.min(value, 0.999999999999));
  const index = Math.floor(bounded * items.length);
  const [picked] = items.splice(index, 1);
  return picked || null;
};

export const buildTonightTray = (unwatched, rng = Math.random) => {
  if (!Array.isArray(unwatched) || unwatched.length === 0) return [];

  const remaining = [...unwatched];
  const tray = [];

  ENERGY_IDS.forEach((energy) => {
    const candidates = remaining.filter(
      (item) => normalizeEnergy(item?.energy) === energy,
    );
    if (candidates.length === 0) return;
    const picked = pickAndRemove(candidates, rng);
    if (!picked) return;
    const indexInRemaining = remaining.indexOf(picked);
    if (indexInRemaining >= 0) remaining.splice(indexInRemaining, 1);
    tray.push(picked);
  });

  while (tray.length < 3 && remaining.length > 0) {
    const picked = pickAndRemove(remaining, rng);
    if (!picked) break;
    tray.push(picked);
  }

  return tray;
};

export const isTonightTrayValidForPool = (pool, tray) => {
  if (!Array.isArray(pool) || !Array.isArray(tray)) return false;
  const targetSize = Math.min(3, pool.length);
  if (tray.length !== targetSize) return false;
  if (tray.some((item) => !pool.includes(item))) return false;
  if (new Set(tray).size !== tray.length) return false;

  return ENERGY_IDS.every((energy) => {
    const energyExists = pool.some(
      (item) => normalizeEnergy(item?.energy) === energy,
    );
    if (!energyExists) return true;
    return tray.some((item) => normalizeEnergy(item?.energy) === energy);
  });
};
