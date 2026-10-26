// One source for energy colour (DESIGN.md, Energy Code Rule): light is sky,
// balanced is amber, focused is red. Always paired with a text label.
//
//   bg / text / label  solid badge and top band on poster cards
//   icon               tint for the energy icon on a dark chip
//   ring               focus ring in the energy colour
//   selected           selected state of an energy chip
export const ENERGY_STYLES = {
  light: {
    bg: 'bg-sky-400',
    text: 'text-sky-950',
    label: 'Light',
    icon: 'text-sky-400',
    selected: 'border-sky-400 bg-sky-400 text-sky-950',
  },
  balanced: {
    bg: 'bg-amber-400',
    text: 'text-amber-950',
    label: 'Balanced',
    icon: 'text-amber-400',
    selected: 'border-amber-400 bg-amber-400 text-amber-950',
  },
  focused: {
    bg: 'bg-red-400',
    text: 'text-red-950',
    label: 'Focused',
    icon: 'text-red-400',
    selected: 'border-red-400 bg-red-400 text-red-950',
  },
};

// Falls back to balanced. Surfaces that must show nothing for an unknown
// energy (the poster band and badge) index ENERGY_STYLES directly instead.
export const getEnergyStyle = (energyId) =>
  ENERGY_STYLES[energyId] || ENERGY_STYLES.balanced;
