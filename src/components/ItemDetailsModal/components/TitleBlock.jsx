import React from 'react';

const TitleBlock = ({ item, metadataChips, genres, titleId }) => {
  return (
    <div className="space-y-3">
      <h2
        id={titleId}
        className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-100 leading-tight tracking-tight"
      >
        {item.title || 'Untitled'}
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
              <span>{chip.value}</span>
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

      {item.overview ? (
        <p className="mt-4 max-w-prose text-base leading-[1.7] text-stone-300">
          {item.overview}
        </p>
      ) : null}
    </div>
  );
};

export default TitleBlock;
