import React from 'react';
import Button from '../../components/ui/Button.jsx';

// Shared empty state with a single next action.
const ShelfEmptyState = ({ title, description, action, onAction }) => (
  <section className="flex min-h-[calc(100svh-15rem-var(--safe-top)-var(--safe-bottom))] w-full flex-col items-center justify-center py-8 text-center">
    <h2 className="font-serif text-2xl leading-tight tracking-tight text-stone-100">
      {title}
    </h2>
    <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-300">
      {description}
    </p>
    <Button
      type="button"
      onClick={onAction}
      className="mt-6 min-h-11 w-fit shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-4 focus-visible:ring-offset-stone-950"
    >
      {action}
    </Button>
  </section>
);

export default ShelfEmptyState;
