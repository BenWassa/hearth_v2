export const buildTonightTray = (unwatched, rng = Math.random) => {
  if (unwatched.length === 0) return [];

  const light = unwatched.filter((i) => i.energy === 'light');
  const balanced = unwatched.filter((i) => i.energy === 'balanced');
  const focused = unwatched.filter((i) => i.energy === 'focused');

  const pick = (arr) =>
    arr.length > 0 ? arr[Math.floor(rng() * arr.length)] : null;

  const tray = [pick(light), pick(balanced), pick(focused)].filter(Boolean);

  while (tray.length < 3 && unwatched.length > tray.length) {
    const remaining = unwatched.filter((i) => !tray.includes(i));
    if (remaining.length === 0) break;
    tray.push(pick(remaining));
  }

  return tray;
};
