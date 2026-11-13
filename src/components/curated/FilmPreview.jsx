import React, { useEffect, useState } from 'react';
import Dialog from '../ui/Dialog.jsx';
import IconButton from '../ui/IconButton.jsx';
import PackArt from './PackArt.jsx';
import { loadFilm } from './filmMedia.js';

export default function FilmPreview({ film, onClose }) {
  const [data, setData] = useState(undefined);
  useEffect(() => {
    let active = true;
    loadFilm(film).then((value) => {
      if (active) setData(value);
    });
    return () => {
      active = false;
    };
  }, [film]);
  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="curated-film-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-stone-950/85"
        onClick={onClose}
      />
      <section className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-700 bg-stone-900 p-5 shadow-2xl">
        <div className="flex justify-end">
          <IconButton label="Close film details" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </IconButton>
        </div>
        <div className="mx-auto aspect-[2/3] w-36 overflow-hidden rounded-lg bg-stone-800">
          <PackArt
            src={data?.posterUrl}
            placeholder={
              <span className="flex h-full items-center p-3 font-serif text-stone-300">
                {film.year}
                <br />
                {film.title}
              </span>
            }
            className="h-full w-full object-cover"
          />
        </div>
        <h2
          id="curated-film-title"
          className="mt-5 font-serif text-2xl text-stone-100"
        >
          {film.title}
        </h2>
        <p className="mt-2 text-sm text-stone-400">
          {film.year}
          {data?.runtimeMinutes ? ` · ${data.runtimeMinutes} min` : ''}
        </p>
        {data?.genres?.length > 0 && (
          <p className="mt-2 text-sm text-stone-300">
            {data.genres.join(' · ')}
          </p>
        )}
        <p
          role="status"
          className="mt-4 text-sm leading-relaxed text-stone-300"
        >
          {data === undefined
            ? 'Loading film details…'
            : data?.overview || 'Film details are unavailable right now.'}
        </p>
      </section>
    </Dialog>
  );
}
