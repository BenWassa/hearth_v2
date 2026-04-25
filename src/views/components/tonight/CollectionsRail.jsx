import React from 'react';
import CollectionCardLandscape from '../../../components/cards/CollectionCardLandscape.jsx';

const CollectionsRail = ({ collections, onOpenCollection }) => {
  if (!Array.isArray(collections) || collections.length === 0) return null;

  return (
    <section className="space-y-3 flex flex-col shrink-0">
      <header className="px-1">
        <div className="flex items-center gap-2">
          <div className="h-px w-6 bg-amber-500/40" />
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">
            Curated
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-3">
          <h3 className="font-serif text-[1.35rem] leading-tight text-stone-100">
            Collections
          </h3>
          <span className="text-[11px] font-medium text-stone-500">
            {collections.length} {collections.length === 1 ? 'saga' : 'sagas'}
          </span>
        </div>
      </header>

      <div className="relative px-1">
        <div
          className="pt-1 pb-3 overflow-x-auto overflow-y-hidden no-scrollbar"
          style={{
            scrollSnapType: 'x mandatory',
            scrollPaddingInlineStart: '0.25rem',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex gap-4 min-w-max">
            {collections.map((collection, index) => (
              <div
                key={collection.id}
                className="collection-card-enter w-[clamp(15rem,38vw,21rem)] shrink-0"
                style={{
                  scrollSnapAlign: 'start',
                  animationDelay: `${Math.min(index * 60, 360)}ms`,
                }}
              >
                <CollectionCardLandscape
                  collection={collection}
                  onOpenCollection={onOpenCollection}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollectionsRail;
