import React from 'react';
import { X } from 'lucide-react';
import PosterPlaceholder from '../../cards/PosterPlaceholder.js';
import LazyMediaImage from '../../media/LazyMediaImage.js';

const ModalHeader = ({
  backdropSrc,
  backdropMissing,
  setBackdropMissing,
  item,
  mobileBackdropStyle,
  onClose,
  vibeDef,
  energyDef,
}) => {
  return (
    <>
      {/* Backdrop Background */}
      <div className="absolute inset-0 z-0">
        {backdropSrc && !backdropMissing ? (
          <>
            <LazyMediaImage
              src={backdropSrc}
              alt=""
              className="w-full h-full object-cover object-top opacity-90"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              onError={() => setBackdropMissing(true)}
              fallback={<div className="absolute inset-0 bg-stone-950" />}
            />
            <div className="absolute inset-0 bg-stone-950/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-stone-950" />
        )}
      </div>

      {/* Mobile Close Button (Floating) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 backdrop-blur-md rounded-full text-white/90 sm:hidden active:scale-95 transition-transform"
        aria-label="Close details"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Poster Section */}
      <div className="sm:w-72 bg-stone-900 flex-shrink-0 sm:border-r border-stone-800 relative z-10">
        <div className="w-full aspect-[16/9] sm:aspect-auto sm:h-full relative overflow-hidden group">
          {backdropSrc && !backdropMissing ? (
            <LazyMediaImage
              src={backdropSrc}
              alt={`${item.title} backdrop`}
              className="absolute inset-0 w-full h-full object-cover object-top"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              onError={() => setBackdropMissing(true)}
            />
          ) : null}
          <div
            className={`absolute inset-0 w-full h-full bg-stone-800 items-center justify-center ${
              backdropSrc && !backdropMissing ? 'hidden' : 'flex'
            }`}
          >
            <PosterPlaceholder title={item.title} type={item.type} />
          </div>

          {/* Gradients for text readability if needed or smooth transition */}
          <div
            className="absolute inset-0 sm:hidden opacity-100"
            style={mobileBackdropStyle}
          />

          {/* Bottom gradient for blending with content */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent via-black/5 to-black/20 pointer-events-none" />

          {/* Vibe & Energy Badges */}
          <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-3 z-20">
            {vibeDef && (
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/90 text-sm font-bold text-white uppercase tracking-wider border-2 border-white/20 shadow-2xl backdrop-blur-xl">
                <vibeDef.icon className="w-4 h-4 text-amber-400 drop-shadow-lg" />
                <span className="drop-shadow-lg">{vibeDef.label}</span>
              </span>
            )}
            {energyDef && (
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/90 text-sm font-bold text-white uppercase tracking-wider border-2 border-white/20 shadow-2xl backdrop-blur-xl">
                <energyDef.icon className="w-4 h-4 text-sky-400 drop-shadow-lg" />
                <span className="drop-shadow-lg">{energyDef.label}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalHeader;
