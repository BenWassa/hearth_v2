import React from 'react';
import { Users } from 'lucide-react';

const CastSection = ({ actors }) => {
  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
        <Users className="w-3 h-3" />
        <span>Starring</span>
      </div>
      {actors.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actors.slice(0, 5).map((actor) => (
            <span
              key={actor}
              className="text-xs font-medium text-stone-400 bg-stone-900/60 px-2.5 py-1.5 rounded-md border border-stone-800/60"
            >
              {actor}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-xs text-stone-500 italic">[add actors]</div>
      )}
    </div>
  );
};

export default CastSection;
