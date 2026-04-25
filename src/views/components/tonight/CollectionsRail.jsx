import React from 'react';
import { Clapperboard } from 'lucide-react';
import CollectionCardLandscape from '../../../components/cards/CollectionCardLandscape.jsx';

const CollectionsRail = ({ collections, onOpenCollection }) => {
  if (!Array.isArray(collections) || collections.length === 0) return null;

  return (
    <div className="space-y-2 flex flex-col shrink-0">
      <div className="flex items-center gap-1.5 px-1">
        <Clapperboard className="w-4 h-4 text-stone-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
          Collections
        </h3>
      </div>
      <div className="relative px-1">
        <div
          className="pb-1 overflow-x-auto overflow-y-hidden no-scrollbar"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex gap-2.5 min-w-max">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="w-[clamp(14rem,36vw,20rem)] shrink-0"
                style={{ scrollSnapAlign: 'start' }}
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
    </div>
  );
};

export default CollectionsRail;
