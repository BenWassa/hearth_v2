import React, { useEffect, useRef, useState } from 'react';
import { findByFilmId, toWatchlistPayload } from './watchlistFilm.js';
import Button from '../ui/Button.jsx';
import Dialog from '../ui/Dialog.jsx';
import IconButton from '../ui/IconButton.jsx';
import PackArt from './PackArt.jsx';
import { loadFilm } from './filmMedia.js';

export default function FilmPreview({
  film,
  onClose,
  items = [],
  removedItems = [],
  onAddItem,
  onOpenItem,
  onOpenRemoved,
}) {
  const [data, setData] = useState(undefined);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const savingRef = useRef(false);
  const owned = findByFilmId(items, film.tmdbId);
  const removed =
    findByFilmId(removedItems, film.tmdbId) || result === 'removed';
  const saved = ['added', 'exists', 'restored'].includes(result);
  const verified =
    data?.provider === 'tmdb' &&
    String(data.providerId) === String(film.tmdbId) &&
    (!data.type || data.type === 'movie');
  const save = async () => {
    if (savingRef.current || owned || removed || saved || !verified) return;
    savingRef.current = true;
    setSaving(true);
    setResult('');
    try {
      const outcome = await onAddItem(toWatchlistPayload(data), {
        allowRestore: false,
      });
      setResult(
        ['added', 'exists', 'restored', 'removed'].includes(outcome?.status)
          ? outcome.status
          : 'failed',
      );
    } catch {
      setResult('failed');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  const notices = {
    added: 'Added to your Library.',
    exists: 'Already in your Library.',
    restored: 'Restored to your Library.',
    failed: 'Could not confirm the save. Check your Library and try again.',
  };
  useEffect(() => {
    let active = true;
    setData(undefined);
    loadFilm(film).then((value) => {
      if (active) setData(value);
    });
    return () => {
      active = false;
    };
  }, [film, retry]);
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
        {data === null && (
          <Button
            variant="ghost"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </Button>
        )}
        <div className="mt-6 text-sm text-stone-300">
          {owned || saved ? (
            <p>
              {(owned?.userState?.status || owned?.status) === 'watched'
                ? 'Watched'
                : 'In Library'}
            </p>
          ) : removed ? (
            <>
              <p>
                This title is in Recently removed. Restore it there to preserve
                your previous details.
              </p>
              {onOpenRemoved && (
                <Button variant="ghost" onClick={onOpenRemoved}>
                  Open Recently removed
                </Button>
              )}
            </>
          ) : verified ? (
            <Button
              disabled={saving || typeof onAddItem !== 'function'}
              onClick={save}
            >
              {saving
                ? 'Saving…'
                : result === 'failed'
                ? 'Retry Add to Library'
                : 'Add to Library'}
            </Button>
          ) : null}
          {owned && onOpenItem && (
            <Button variant="ghost" onClick={() => onOpenItem(owned)}>
              Open Hearth details
            </Button>
          )}
          {notices[result] && (
            <p role="status" className="mt-3">
              {notices[result]}
            </p>
          )}
        </div>
      </section>
    </Dialog>
  );
}
