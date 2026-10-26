import React from 'react';
import LazyMediaImage from '../media/LazyMediaImage.jsx';
import { getPosterSrc } from '../../utils/poster.js';

// Widths leave the next poster partly visible at 320px so a shelf reads as
// scrollable. A shelf with a real next action gets the larger size.
const POSTER_WIDTH = { large: 'w-[132px]', regular: 'w-[108px]' };

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400';

// Arrow keys move between posters in a row; Tab still works natively.
const moveWithArrows = (event) => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  const buttons = [...event.currentTarget.querySelectorAll('button')];
  const index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  const next = buttons[index + (event.key === 'ArrowRight' ? 1 : -1)];
  if (!next) return;
  event.preventDefault();
  next.focus();
};

const PosterButton = ({ film, onOpen }) => {
  const watched = film.status === 'watched';
  return (
    <button
      type="button"
      onClick={(event) => {
        event.currentTarget.focus({ preventScroll: true });
        onOpen?.(film);
      }}
      className={`relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-stone-800 ${focusRing}`}
    >
      <LazyMediaImage
        src={getPosterSrc(film)}
        alt=""
        className="h-full w-full object-cover"
        fallback={
          <span
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center p-2 text-center font-serif text-sm leading-snug text-stone-300"
          >
            {film.title}
          </span>
        }
      />
      {watched && (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-950/80 text-[11px] text-amber-300"
        >
          ✓
        </span>
      )}
      <span className="sr-only">
        {film.title}
        {watched ? ', watched' : ''}
      </span>
    </button>
  );
};

// One labelled shelf: a heading (a button when it opens details) above a
// horizontal scroll-snap row of 2:3 posters.
export const PosterShelf = ({
  id,
  title,
  srDetail,
  reason = '',
  headingHidden = false,
  films,
  size = 'regular',
  onOpenHeading,
  onOpenFilm,
}) => (
  <section aria-label={title} data-shelf={id} className="mt-5">
    {headingHidden ? (
      <>
        <h2 className="sr-only">{title}</h2>
        {onOpenHeading && (
          <button
            type="button"
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true });
              onOpenHeading();
            }}
            aria-label={`${title} details`}
            className={`min-h-[44px] rounded-lg text-sm text-stone-400 ${focusRing}`}
          >
            Saga details
            <span aria-hidden="true" className="ml-1">
              ›
            </span>
          </button>
        )}
      </>
    ) : (
      <h2 className="font-serif text-xl leading-snug text-stone-100">
        {onOpenHeading ? (
          <button
            type="button"
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true });
              onOpenHeading();
            }}
            className={`min-h-[44px] max-w-full rounded-lg text-left ${focusRing}`}
          >
            {title}
            <span aria-hidden="true" className="ml-1 text-stone-400">
              ›
            </span>
          </button>
        ) : (
          title
        )}
      </h2>
    )}
    {reason && <p className="text-sm text-stone-400">{reason}</p>}
    {srDetail && <p className="sr-only">{srDetail}</p>}
    <ul
      role="list"
      className="shelf-scroll -mx-4 mt-2 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2"
      onKeyDown={moveWithArrows}
    >
      {films.map((film) => (
        <li
          key={film.id || film.mediaId}
          className={`shrink-0 snap-start ${POSTER_WIDTH[size]}`}
        >
          <PosterButton film={film} onOpen={onOpenFilm} />
        </li>
      ))}
    </ul>
  </section>
);
