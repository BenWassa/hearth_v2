import React from 'react';
import PackArt from './PackArt.jsx';

// Full-bleed chapter hero: portrait artwork edge to edge with the live title
// over a soft, feathered dark fade that melts into the page. Falls back to the
// older 16:9 banner, then to a text-only header while artwork is missing.
const HERO_SLOT = 'Chapter hero artwork 4:5 · 1600×2000';

export default function ChapterHero({ chapter, showSlot }) {
  const textOnly = showSlot ? (
    <div
      aria-hidden="true"
      className="absolute inset-x-4 top-4 flex h-24 items-center justify-center border border-dashed border-stone-700 text-center text-xs text-stone-500"
    >
      {HERO_SLOT}
    </div>
  ) : null;
  return (
    <div className="relative -mx-5 mb-3 min-h-[11rem] overflow-hidden bg-stone-900">
      <PackArt
        src={chapter.heroArt}
        className="block aspect-[4/5] w-full object-cover"
        placeholder={
          <PackArt
            src={chapter.art}
            className="block aspect-[16/9] w-full object-cover"
            placeholder={textOnly}
          />
        }
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 backdrop-blur-sm [mask-image:linear-gradient(to_top,black,transparent)] [-webkit-mask-image:linear-gradient(to_top,black,transparent)]"
      />
      <h2
        id={`chapter-${chapter.id}`}
        className="absolute inset-x-5 bottom-3 max-w-[85%] font-serif text-3xl leading-tight tracking-tight text-stone-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
      >
        {chapter.title}
      </h2>
    </div>
  );
}
