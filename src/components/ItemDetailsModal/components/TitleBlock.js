import React from 'react';

const TitleBlock = ({ item, metadataChips, genres }) => {
  return (
    <div className="space-y-3">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-100 leading-tight tracking-tight">
        {item.title}
      </h2>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-400">
        {metadataChips.map((chip, index) => (
          <React.Fragment key={chip.label}>
            {index > 0 && (
              <span className="w-1 h-1 rounded-full bg-stone-700/60" />
            )}
            <div className="flex items-center gap-1.5" title={chip.label}>
              <chip.icon className="w-3.5 h-3.5 opacity-60" />
              <span className={chip.isPlaceholder ? 'opacity-50 italic' : ''}>
                {chip.value}
              </span>
            </div>
          </React.Fragment>
        ))}
        {genres.length > 0 && (
          <>
            <span className="w-1 h-1 rounded-full bg-stone-700/60" />
            <span>{genres.slice(0, 3).join(', ')}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default TitleBlock;
