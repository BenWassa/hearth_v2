import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { TEMPLATE_SCENARIOS } from './templateScenarios.js';

export default function TemplateScenarioModal({
  activeScenario,
  onSelect,
  onClose,
}) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-stone-950/75 px-3 pb-safe-b pt-8 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-scenario-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[min(80dvh,38rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-800 bg-stone-950 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-label font-bold uppercase tracking-widest text-amber-400/80">
              Demo data
            </p>
            <h2
              id="template-scenario-title"
              className="mt-1 font-serif text-2xl text-stone-100"
            >
              Choose a starting shelf
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-stone-400 hover:bg-stone-900 hover:text-stone-100 focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Close demo data chooser"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {TEMPLATE_SCENARIOS.map((scenario) => {
            const selected = scenario.id === activeScenario;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSelect(scenario.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  selected
                    ? 'border-amber-700/70 bg-amber-950/25'
                    : 'border-stone-800 bg-stone-900/40 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-700">
                  {selected && <Check className="h-3.5 w-3.5 text-amber-300" />}
                </span>
                <span>
                  <span className="block text-sm font-medium text-stone-100">
                    {scenario.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-stone-400">
                    {scenario.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-stone-500">
          Your changes reset when you refresh the demo.
        </p>
      </div>
    </div>
  );
}
