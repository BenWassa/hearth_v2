import React from 'react';

const variants = {
  // Sits on a plain surface.
  plain: 'text-stone-300 hover:bg-stone-800 hover:text-stone-100',
  // Floats over poster or backdrop art, so it carries its own fill.
  overlay:
    'bg-stone-950/90 border border-stone-700 text-stone-100 hover:bg-stone-900',
};

/**
 * Icon-only control. `label` is required: it becomes the accessible name.
 * 44px minimum target, amber focus ring, press feedback that respects
 * prefers-reduced-motion.
 */
const IconButton = ({
  label,
  variant = 'plain',
  className = '',
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    aria-label={label}
    className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 motion-safe:active:scale-95 motion-reduce:active:scale-100 ${variants[variant]} ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export default IconButton;
