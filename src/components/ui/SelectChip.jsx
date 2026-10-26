import React from 'react';

/**
 * Pill toggle for picking one value from a short set (vibe, energy, type).
 * State is carried by aria-pressed and the amber wash, never color alone:
 * pass an icon or a text label. 44px minimum target.
 *
 * `selectedClassName` overrides the amber wash when the value has its own
 * meaning (the energy colors, DESIGN.md Energy Code Rule).
 */
const SelectChip = ({
  selected = false,
  icon: Icon,
  children,
  className = '',
  selectedClassName = 'bg-amber-500/15 border-amber-500/35 text-amber-200',
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    aria-pressed={selected}
    className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 ${
      selected
        ? selectedClassName
        : 'border-stone-800 text-stone-400 hover:bg-stone-900 hover:text-stone-200'
    } ${className}`}
    {...rest}
  >
    {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
    <span
      className={selected ? 'underline decoration-2 underline-offset-4' : ''}
    >
      {children}
    </span>
  </button>
);

export default SelectChip;
