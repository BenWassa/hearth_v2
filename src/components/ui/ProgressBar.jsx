import React from 'react';

/**
 * Flat progress bar. The fill is full width and scaled with transform, so
 * changing `value` animates on the compositor instead of the layout.
 *
 * `heightClassName` sets the track height (default 6px); `square` drops the
 * pill rounding (poster-base bars). `value` is 0-100. `min` keeps a sliver visible for started items.
 * Pass `label` only when the bar stands alone (it becomes a progressbar role);
 * decorative bars next to a text count stay aria-hidden.
 */
const ProgressBar = ({
  value = 0,
  min = 0,
  label,
  square = false,
  heightClassName = 'h-1.5',
  className = '',
  trackClassName = 'bg-stone-800',
  barClassName = 'bg-amber-500',
}) => {
  const clamped = Math.min(100, Math.max(Number(value) || 0, 0));
  const shown = clamped > 0 ? Math.max(clamped, min) : 0;
  const a11y = label
    ? {
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': Math.round(clamped),
      }
    : { 'aria-hidden': true };

  return (
    <div
      className={`${heightClassName} w-full overflow-hidden ${
        square ? '' : 'rounded-full'
      } ${trackClassName} ${className}`}
      {...a11y}
    >
      <div
        className={`h-full w-full origin-left motion-safe:transition-transform duration-500 ease-out ${
          square ? '' : 'rounded-full'
        } ${barClassName}`}
        style={{ transform: `scaleX(${shown / 100})` }}
      />
    </div>
  );
};

export default ProgressBar;
