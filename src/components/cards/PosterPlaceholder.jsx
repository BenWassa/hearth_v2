import React from 'react';
import { Film, Tv } from 'lucide-react';

const PosterPlaceholder = ({ title, type }) => {
  const TypeIcon = type === 'movie' ? Film : Tv;

  return (
    <div className="h-full w-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 flex flex-col items-center justify-center text-stone-500">
      <TypeIcon className="w-8 h-8" />
      <span className="text-[10px] uppercase tracking-widest mt-2">
        Poster pending
      </span>
      {title && (
        <span className="text-[9px] uppercase tracking-widest text-stone-400 mt-1">
          {title.length > 18 ? `${title.slice(0, 18)}...` : title}
        </span>
      )}
    </div>
  );
};

export default PosterPlaceholder;
