import React from 'react';
import { Film, Tv } from 'lucide-react';

const PosterPlaceholder = ({ title, type }) => {
  const TypeIcon = type === 'movie' ? Film : Tv;

  return (
    <div className="h-full w-full bg-stone-900 flex flex-col items-center justify-center text-stone-400">
      <TypeIcon className="w-8 h-8" />
      <span className="text-label uppercase tracking-widest mt-2">
        Poster pending
      </span>
      {title && (
        <span className="text-label uppercase tracking-widest text-stone-400 mt-1">
          {title.length > 18 ? `${title.slice(0, 18)}...` : title}
        </span>
      )}
    </div>
  );
};

export default PosterPlaceholder;
