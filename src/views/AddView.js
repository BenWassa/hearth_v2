import React, { useMemo, useState } from 'react';
import { Clock, Film, MessageSquare, Tv } from 'lucide-react';
import { ENERGIES, VIBES } from '../config/constants.js';
import Button from '../components/ui/Button.js';
import Input from '../components/ui/Input.js';
import TextArea from '../components/ui/TextArea.js';
import { getMediaDetails } from '../services/mediaApi/client.js';
import { hydrateShowData } from '../services/mediaApi/showData.js';
import { useMediaSearch } from './hooks/useMediaSearch.js';

const AddView = ({ onBack, onSubmit, allowManualEntry = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('movie');
  const [vibe, setVibe] = useState('');
  const [energy, setEnergy] = useState('');
  const [runtimeMinutes, setRuntimeMinutes] = useState('');
  const [note, setNote] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [enrichedPayload, setEnrichedPayload] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const { results, loading, error, hasQuery } = useMediaSearch({
    query: searchQuery,
    type,
  });

  const visibleResults = useMemo(() => results.slice(0, 5), [results]);

  const handleSelectResult = async (result) => {
    setSelectedResult(result);
    setTitle(result.title || '');
    setYear(result.year || '');
    setSubmitError('');
    setType(result.type === 'show' ? 'show' : 'movie');
    setRuntimeMinutes('');
    setEnrichError('');
    setIsEnriching(true);

    try {
      const details = await getMediaDetails({
        provider: result.provider,
        providerId: result.providerId,
        type: result.type,
      });

      const nextType = details.type === 'show' ? 'show' : 'movie';
      setType(nextType);
      if (details.year) {
        setYear(String(details.year));
      }
      if (Number.isFinite(details.runtimeMinutes)) {
        setRuntimeMinutes(String(details.runtimeMinutes));
      }

      const showData =
        nextType === 'show'
          ? await hydrateShowData({
              provider: result.provider,
              providerId: result.providerId,
            })
          : null;

      setEnrichedPayload({
        source: {
          provider: result.provider,
          providerId: result.providerId,
          fetchedAt: Date.now(),
          locale: 'en-US',
        },
        media: {
          ...details,
          poster: details.posterUrl || '',
          backdrop: details.backdropUrl || '',
          logo: details.logoUrl || '',
        },
        showData,
      });
    } catch (err) {
      setEnrichedPayload(null);
      setEnrichError(err?.message || 'Could not load metadata right now.');
    } finally {
      setIsEnriching(false);
    }
  };

  const clearSelectedResult = () => {
    setSelectedResult(null);
    setEnrichedPayload(null);
    setEnrichError('');
    setSubmitError('');
    setTitle('');
    setYear('');
  };

  const handleSubmit = () => {
    const manualTitle = title.trim() || searchQuery.trim();
    if (!allowManualEntry && !selectedResult) {
      setSubmitError('Select a movie or show from Live Search before saving.');
      return;
    }
    if (allowManualEntry && !selectedResult && !manualTitle) {
      setSubmitError('Add a title before saving.');
      return;
    }
    if (isEnriching) {
      setSubmitError('Wait for metadata to finish loading before saving.');
      return;
    }
    if (
      !allowManualEntry &&
      (!enrichedPayload?.source?.providerId || !enrichedPayload?.media)
    ) {
      setSubmitError(
        'Could not verify this title metadata. Re-select the title and try again.',
      );
      return;
    }
    setSubmitError('');

    const payload = {
      title: selectedResult ? title.trim() : manualTitle,
      type,
      vibe,
      energy,
      note: note.trim(),
      status: 'unwatched',
      year: year.trim(),
    };

    if (enrichedPayload?.media && selectedResult) {
      const runtimeOverride = Number.parseInt(runtimeMinutes, 10);
      const runtime = Number.isFinite(runtimeOverride)
        ? runtimeOverride
        : enrichedPayload.media.runtimeMinutes;

      payload.schemaVersion = 2;
      payload.source = {
        ...enrichedPayload.source,
      };
      payload.media = {
        ...enrichedPayload.media,
        type,
        title: payload.title,
        runtimeMinutes: Number.isFinite(runtime) ? runtime : null,
        poster: enrichedPayload.media.poster || '',
        backdrop: enrichedPayload.media.backdrop || '',
        logo: enrichedPayload.media.logo || '',
      };
      payload.showData =
        type === 'show'
          ? enrichedPayload.showData || { seasonCount: 0, seasons: [] }
          : { seasonCount: null, seasons: [] };
      payload.userState = {
        status: 'unwatched',
        vibe,
        energy,
        note: payload.note,
        episodeProgress: {},
      };
      payload.poster = payload.media.poster;
      payload.backdrop = payload.media.backdrop;
      payload.logo = payload.media.logo;
      if (payload.media.year) payload.year = payload.media.year;
      if (Array.isArray(payload.media.genres) && payload.media.genres.length) {
        payload.genres = payload.media.genres;
      }
      if (Array.isArray(payload.media.cast) && payload.media.cast.length) {
        payload.actors = payload.media.cast;
      }
      if (Number.isFinite(payload.media.runtimeMinutes)) {
        payload.runtimeMinutes = payload.media.runtimeMinutes;
      }
      if (type === 'show' && payload.showData?.seasonCount) {
        payload.totalSeasons = payload.showData.seasonCount;
      }
      if (type === 'show' && Array.isArray(payload.showData?.seasons)) {
        payload.seasons = payload.showData.seasons;
      }
    }

    if (type === 'movie') {
      const parsedRuntime = Number.parseInt(runtimeMinutes, 10);
      if (Number.isFinite(parsedRuntime) && parsedRuntime > 0) {
        payload.runtimeMinutes = parsedRuntime;
      }
    }
    onSubmit(payload);
  };

  return (
    <div className="flex-1 flex flex-col bg-stone-950 animate-in slide-in-from-bottom duration-300 w-full">
      <div className="p-6 flex items-center justify-between border-b border-stone-900">
        <button
          onClick={onBack}
          className="text-stone-400 hover:text-stone-200 text-sm font-medium"
        >
          Cancel
        </button>
        <span className="font-serif text-stone-200">Save for Us</span>
        <div className="w-12" /> {/* Spacer */}
      </div>

      <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        {/* Live Search */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-stone-400">
            Title
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movie or show title..."
            data-testid="live-search-input"
          />
          {loading && (
            <div className="text-xs text-stone-500">Searching catalog...</div>
          )}
          {error && <div className="text-xs text-red-400">{error}</div>}
          {!selectedResult &&
            hasQuery &&
            !loading &&
            visibleResults.length > 0 && (
              <div className="rounded-xl border border-stone-800 bg-stone-900/40 divide-y divide-stone-800">
                {visibleResults.map((result) => (
                  <button
                    key={`${result.provider}-${result.providerId}`}
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left px-3 py-3 hover:bg-stone-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded border border-stone-700 bg-stone-800">
                        <div className="absolute inset-0 flex items-center justify-center text-stone-500">
                          {result.type === 'show' ? (
                            <Tv className="h-4 w-4" />
                          ) : (
                            <Film className="h-4 w-4" />
                          )}
                        </div>
                        {result.posterUrl ? (
                          <img
                            src={result.posterUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base text-stone-200">
                          {result.title}
                        </div>
                        <div className="mt-0.5 text-xs text-stone-500 uppercase tracking-wider">
                          {result.type} {result.year ? `• ${result.year}` : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          {selectedResult && (
            <div className="rounded-lg border border-amber-900/40 bg-amber-900/10 px-3 py-2 text-xs text-amber-200 flex items-center justify-between gap-3">
              <span>
                Selected: {selectedResult.title}
                {isEnriching ? ' (loading metadata...)' : ''}
              </span>
              <button
                className="text-amber-300 hover:text-amber-100"
                onClick={clearSelectedResult}
                type="button"
              >
                Clear
              </button>
            </div>
          )}
          {enrichError && (
            <div className="text-xs text-red-400">{enrichError}</div>
          )}
          {submitError && (
            <div className="text-xs text-red-400">{submitError}</div>
          )}
          {allowManualEntry && (
            <div className="text-xs text-stone-500">
              Template mode: pick from search or type any title and save.
            </div>
          )}
        </div>

        {allowManualEntry && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-stone-400">
              Title for save
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Or type your own title..."
            />
          </div>
        )}

        {/* Type */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-stone-400">
            Type
          </div>
          <div className="flex gap-2">
            {['movie', 'show'].map((t) => {
              const isSelected = type === t;
              const TypeIcon = t === 'movie' ? Film : Tv;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    if (t === 'show') setRuntimeMinutes('');
                  }}
                  className={`flex-1 py-2 rounded-lg border text-xs uppercase tracking-widest transition-all ${
                    isSelected
                      ? 'bg-stone-800 border-stone-700 text-stone-200'
                      : 'border-stone-800 text-stone-400 hover:bg-stone-900'
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <TypeIcon className="w-3.5 h-3.5" />
                    {t}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vibe */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-stone-400">
            Vibe
          </div>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => {
              const isSelected = vibe === v.id;
              const VibeIcon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setVibe(v.id)}
                  className={`px-3 py-1.5 rounded-full border text-xs uppercase tracking-widest transition-all ${
                    isSelected
                      ? 'bg-stone-800 border-stone-700 text-stone-200'
                      : 'border-stone-800 text-stone-500 hover:bg-stone-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <VibeIcon className="w-3.5 h-3.5" />
                    {v.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Energy */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-stone-400">
            Energy
          </div>
          <div className="flex flex-wrap gap-2">
            {ENERGIES.map((e) => {
              const isSelected = energy === e.id;
              const EnergyIcon = e.icon;
              return (
                <button
                  key={e.id}
                  onClick={() => setEnergy(e.id)}
                  className={`px-3 py-1.5 rounded-full border text-xs uppercase tracking-widest transition-all ${
                    isSelected
                      ? 'bg-stone-800 border-stone-700 text-stone-200'
                      : 'border-stone-800 text-stone-500 hover:bg-stone-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <EnergyIcon className="w-3.5 h-3.5" />
                    {e.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Runtime */}
        {type === 'movie' && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400">
              <Clock className="w-3 h-3" />
              Runtime{' '}
              <span className="text-stone-700 font-normal normal-case">
                (Minutes, optional)
              </span>
            </label>
            <Input
              value={runtimeMinutes}
              onChange={(e) => setRuntimeMinutes(e.target.value)}
              placeholder="e.g. 97"
              type="number"
              min="1"
              inputMode="numeric"
            />
          </div>
        )}

        {/* Year */}
        {allowManualEntry && (
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-stone-400">
              Year (Optional)
            </label>
            <Input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2019"
              maxLength={4}
              inputMode="numeric"
            />
          </div>
        )}

        {/* Note */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400">
            <MessageSquare className="w-3 h-3" />
            Why this?{' '}
            <span className="text-stone-700 font-normal normal-case">
              (Optional)
            </span>
          </label>
          <TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Heard it's funny, Good for a rainy day..."
          />
        </div>
      </div>

      <div className="p-6 border-t border-stone-900 bg-stone-950/95 backdrop-blur">
        <Button
          onClick={handleSubmit}
          disabled={
            !(title.trim() || searchQuery.trim()) ||
            isEnriching ||
            (!allowManualEntry &&
              (!selectedResult || !enrichedPayload?.source?.providerId))
          }
          className="w-full"
        >
          {isEnriching ? 'Loading Metadata...' : 'Put on Shelf'}
        </Button>
      </div>
    </div>
  );
};

export default AddView;
