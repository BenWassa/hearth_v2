import React from 'react';
import { X } from 'lucide-react';
import PosterPlaceholder from '../../cards/PosterPlaceholder.jsx';
import LazyMediaImage from '../../media/LazyMediaImage.jsx';
import IconButton from '../../ui/IconButton.jsx';

const ModalHeader = ({
  backdropSrc,
  backdropMissing,
  setBackdropMissing,
  item,
  mobileBackdropStyle,
  onClose,
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
      <IconButton
        label="Close details"
        variant="overlay"
        onClick={onClose}
        className="absolute right-[calc(1rem+var(--safe-right))] top-[max(1rem,calc(var(--safe-top)+0.5rem))] z-50 sm:hidden"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </IconButton>

      {/* Poster Section */}
      <div className="sm:w-72 bg-stone-950 sm:bg-stone-900 flex-shrink-0 sm:border-r border-stone-800 relative z-10">
        {/* On mobile the art is framed by chrome on both edges: the app shell's
            cutout strip paints over the top var(--safe-top), and the content
            sheet's -mt-12 rides over the bottom 3rem. Reserving both as padding
            gives the backdrop its own untouched 16:9 box instead of letting a
            third of it disappear under the notch and the sheet. */}
        <div className="w-full pt-safe-t pb-12 sm:h-full sm:p-0">
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
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent via-stone-950/5 to-stone-950/20 pointer-events-none" />
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalHeader;
