import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Play,
  Plus,
  Share2,
  Tv,
  X,
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_SHOW_DATA = {
  id: 1,
  title: 'Severance',
  year: 2022,
  director: 'Ben Stiller',
  type: 'show',
  backdrop: 'https://image.tmdb.org/t/p/original/lZ8cfE7u9P6c4K7r0Ff2j2.jpg',
  genres: ['Sci-Fi', 'Drama'],
  description:
    'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
  totalSeasons: 2,
  seasons: [
    {
      id: 's1',
      number: 1,
      episodes: [
        {
          id: 's1e1',
          number: 1,
          title: 'Good News About Hell',
          airDate: '2022-02-18',
          description:
            'Mark finds himself at the center of a workplace mystery when a colleague is fired.',
          watched: true,
        },
        {
          id: 's1e2',
          number: 2,
          title: 'Half Loop',
          airDate: '2022-02-18',
          description:
            'The team trains new hire Helly on macrodata refinement while Mark takes a personal day.',
          watched: true,
        },
        {
          id: 's1e3',
          number: 3,
          title: 'In Perpetuity',
          airDate: '2022-02-25',
          description:
            'Mark decides to take the team on a field trip to the Perpetuity Wing.',
          watched: false,
        },
        {
          id: 's1e4',
          number: 4,
          title: 'The You You Are',
          airDate: '2022-03-04',
          description: 'Irving finds an intriguing book at a wellness session.',
          watched: false,
        },
        {
          id: 's1e5',
          number: 5,
          title: 'The Grim Barbarity of Optics and Design',
          airDate: '2022-03-11',
          description: "Irving and Burt's friendship deepens.",
          watched: false,
        },
        {
          id: 's1e6',
          number: 6,
          title: 'Hide and Seek',
          airDate: '2022-03-18',
          description: 'Graner suspects Mark.',
          watched: false,
        },
      ],
    },
    {
      id: 's2',
      number: 2,
      episodes: [
        {
          id: 's2e1',
          number: 1,
          title: 'Everything is Revealed',
          airDate: '2024-01-15',
          description:
            'The aftermath of the gala brings chaos to Lumon industries.',
          watched: false,
        },
      ],
    },
  ],
};

// --- SUB-COMPONENTS ---

const EpisodeItem = ({
  ep,
  isNextUp,
  isExpanded,
  onToggleExpand,
  onToggleWatched,
}) => {
  const isWatched = ep.watched;

  return (
    <div
      className={`
        relative group rounded-xl border transition-all duration-200 overflow-hidden mb-2
        ${
          isNextUp
            ? 'bg-stone-800/60 border-amber-900/40 ring-1 ring-amber-500/20 shadow-lg shadow-black/20'
            : 'bg-transparent border-transparent active:bg-stone-900/40'
        }
      `}
    >
      {/* Main Row Content - Taller tap target for mobile */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        {/* Leading Action Button */}
        <div className="flex-shrink-0 relative z-10">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggleWatched();
            }}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
              ${
                isWatched
                  ? 'bg-stone-800 text-stone-500 border border-stone-700 active:text-amber-500 active:border-amber-500/50'
                  : isNextUp
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 active:scale-95'
                  : 'bg-stone-900/50 text-stone-600 border border-stone-800 active:border-stone-500 active:text-stone-400'
              }
            `}
          >
            {isWatched ? (
              <Check className="w-5 h-5" />
            ) : isNextUp ? (
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            ) : (
              <span className="text-xs font-bold font-mono">{ep.number}</span>
            )}
          </button>
        </div>

        {/* Text Content */}
        <div
          className={`flex-1 min-w-0 transition-opacity ${
            isWatched ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isNextUp && (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                Next
              </span>
            )}
            <h3
              className={`font-medium text-base leading-tight truncate ${
                isWatched ? 'decoration-stone-700' : 'text-stone-200'
              }`}
            >
              {ep.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>{new Date(ep.airDate).getFullYear()}</span>
          </div>
        </div>

        {/* Expand Chevron */}
        <div className="text-stone-600 px-1">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </div>

      {/* Expanded Details Panel */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out bg-stone-950/40
          ${isExpanded ? 'max-h-48 border-t border-stone-800/30' : 'max-h-0'}
        `}
      >
        <div className="p-4 pl-[4.5rem] pr-6">
          <p
            className={`text-sm leading-relaxed ${
              !isWatched && !isNextUp
                ? 'blur-[3px] active:blur-none transition-all duration-300 select-none'
                : 'text-stone-400'
            }`}
          >
            {ep.description}
          </p>
          {!isWatched && !isNextUp && (
            <div className="mt-3 text-[10px] uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5" />
              Spoiler Protected (Tap to reveal)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN MOCKUP COMPONENT ---

const SeasonTrackerMockup = ({ onClose }) => {
  const [activeSeasonNum, setActiveSeasonNum] = useState(1);
  const [seasonsData, setSeasonsData] = useState(MOCK_SHOW_DATA.seasons);
  const [expandedEpisodeId, setExpandedEpisodeId] = useState(null);
  const seasonScrollRef = useRef(null);
  const [seasonScrollState, setSeasonScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  const activeSeason = useMemo(() => {
    if (!seasonsData.length) return { id: '', number: 0, episodes: [] };
    return (
      seasonsData.find((season) => season.number === activeSeasonNum) ||
      seasonsData[0]
    );
  }, [seasonsData, activeSeasonNum]);

  const stats = useMemo(() => {
    const total = activeSeason.episodes.length;
    const watched = activeSeason.episodes.filter((ep) => ep.watched).length;
    const progress = total === 0 ? 0 : Math.round((watched / total) * 100);
    const nextUpIndex = activeSeason.episodes.findIndex((ep) => !ep.watched);
    const nextUpId =
      nextUpIndex !== -1 ? activeSeason.episodes[nextUpIndex].id : null;
    return { total, watched, progress, nextUpId };
  }, [activeSeason]);
  const seasonProgress = useMemo(() => {
    return seasonsData.map((season) => {
      const total = season.episodes.length;
      const watched = season.episodes.filter((ep) => ep.watched).length;
      const progress = total === 0 ? 0 : Math.round((watched / total) * 100);
      return { season, progress, total };
    });
  }, [seasonsData]);

  const toggleEpisode = (seasonId, episodeId) => {
    setSeasonsData((prev) =>
      prev.map((season) => {
        if (season.id !== seasonId) return season;
        return {
          ...season,
          episodes: season.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return { ...ep, watched: !ep.watched };
          }),
        };
      }),
    );
  };

  const handleSeasonKeyDown = (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const currentIndex = seasonsData.findIndex(
      (season) => season.number === activeSeasonNum,
    );
    if (currentIndex === -1) return;
    const nextIndex =
      event.key === 'ArrowRight'
        ? Math.min(currentIndex + 1, seasonsData.length - 1)
        : Math.max(currentIndex - 1, 0);
    const nextSeason = seasonsData[nextIndex];
    if (!nextSeason) return;
    setActiveSeasonNum(nextSeason.number);
    const scrollEl = seasonScrollRef.current;
    if (!scrollEl) return;
    const targetButton = scrollEl.querySelector(
      `[data-season-number="${nextSeason.number}"]`,
    );
    targetButton?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  };

  useEffect(() => {
    const scrollEl = seasonScrollRef.current;
    if (!scrollEl) return undefined;
    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollEl;
      const maxScrollLeft = scrollWidth - clientWidth;
      setSeasonScrollState({
        canScrollLeft: scrollLeft > 4,
        canScrollRight: maxScrollLeft - scrollLeft > 4,
      });
    };
    updateScrollState();
    scrollEl.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      scrollEl.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [seasonsData.length, activeSeasonNum]);

  return (
    // FULL SCREEN WRAPPER (Mobile First)
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black font-sans">
      {/* Mobile Backdrop Image Layer */}
      <div className="absolute inset-0 z-0 h-[50vh] w-full">
        <img
          src={MOCK_SHOW_DATA.backdrop}
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
        {/* Gradient to blend into content */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/20 via-stone-950/60 to-stone-950" />
      </div>

      {/* Floating Close Button (Mobile Top Right) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/90 active:scale-95 transition-transform border border-white/10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Card Container */}
      <div className="relative w-full max-w-2xl bg-stone-950 sm:border border-stone-800 sm:rounded-2xl shadow-2xl flex flex-col h-[95dvh] sm:h-[85vh] sm:mt-0 z-10 transition-transform">
        {/* Mobile Header / Content Sheet Start */}
        <div className="flex-1 flex flex-col min-w-0 bg-stone-950 relative rounded-t-[2rem] overflow-hidden sm:rounded-none">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Content Padding */}
            <div className="px-5 pt-8 pb-32 sm:p-8">
              {/* Show Metadata Header */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-500/80 font-bold">
                  <Tv className="w-3.5 h-3.5" />
                  <span>TV Series</span>
                </div>
                <h2 className="text-3xl font-serif text-stone-100 leading-none">
                  {MOCK_SHOW_DATA.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400 mt-2">
                  <span>{MOCK_SHOW_DATA.year}</span>
                  <span className="w-0.5 h-0.5 bg-stone-600 rounded-full" />
                  <span>{MOCK_SHOW_DATA.genres.join(', ')}</span>
                  <span className="w-0.5 h-0.5 bg-stone-600 rounded-full" />
                  <span>{MOCK_SHOW_DATA.totalSeasons} Seasons</span>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed pt-2 line-clamp-3">
                  {MOCK_SHOW_DATA.description}
                </p>
              </div>

              {/* --- SEASON TRACKER UI --- */}
              <div className="mt-8">
                {/* Control Bar: Seasons & Progress */}
                <div className="bg-stone-900/40 rounded-2xl p-4 border border-stone-800/50 mb-6 backdrop-blur-sm sticky top-0 z-20 shadow-xl shadow-stone-950/50">
                  {/* Season Selector - Swipeable on mobile */}
                  <div className="relative">
                    <div
                      className="flex overflow-x-auto no-scrollbar gap-2 pb-3 border-b border-stone-800/50 -mx-1 px-1 focus:outline-none scroll-smooth shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]"
                      ref={seasonScrollRef}
                      onKeyDown={handleSeasonKeyDown}
                      tabIndex={0}
                      aria-label="Season selector"
                    >
                      {seasonProgress.map(({ season, progress, total }) => (
                        <div
                          key={season.id}
                          className="flex-shrink-0 flex flex-col gap-2"
                        >
                          <button
                            data-season-number={season.number}
                            onClick={() => setActiveSeasonNum(season.number)}
                            className={`
                              w-full px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border
                              ${
                                activeSeasonNum === season.number
                                  ? 'bg-stone-800 text-stone-100 border-stone-700 shadow-sm'
                                  : 'bg-transparent text-stone-500 border-transparent hover:bg-stone-800/30'
                              }
                            `}
                          >
                            Season {season.number}
                          </button>
                          <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                total > 0
                                  ? 'bg-amber-600/80'
                                  : 'bg-stone-700/60'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-stone-950 to-transparent transition-opacity ${
                        seasonScrollState.canScrollLeft
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-stone-950 to-transparent transition-opacity ${
                        seasonScrollState.canScrollRight
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    />
                  </div>

                  {/* Stats Row */}
                  <div className="pt-3 flex items-center justify-between gap-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Progress
                    </div>
                    <div className="flex-1 max-w-[120px] flex flex-col items-end">
                      <div className="text-[10px] font-bold text-stone-400 mb-1.5">
                        <span
                          className={
                            stats.progress === 100
                              ? 'text-amber-500'
                              : 'text-stone-200'
                          }
                        >
                          {stats.progress}%
                        </span>
                        <span className="text-stone-600 mx-1">/</span>
                        <span>
                          {stats.watched} of {stats.total}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full transition-all duration-500"
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Episodes List */}
                <div className="space-y-1 min-h-[300px]">
                  {activeSeason.episodes.map((ep) => (
                    <EpisodeItem
                      key={ep.id}
                      ep={ep}
                      isNextUp={ep.id === stats.nextUpId}
                      isExpanded={expandedEpisodeId === ep.id}
                      onToggleExpand={() =>
                        setExpandedEpisodeId(
                          expandedEpisodeId === ep.id ? null : ep.id,
                        )
                      }
                      onToggleWatched={() =>
                        toggleEpisode(activeSeason.id, ep.id)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar (Fixed) */}
          <div className="p-4 bg-stone-950 border-t border-stone-900 grid grid-cols-[1fr,auto] gap-3 safe-area-bottom z-30">
            <button className="h-12 flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-600 text-white shadow-lg shadow-amber-900/20 active:scale-95 transition-transform">
              <Plus className="w-4 h-4" /> Add to List
            </button>
            <button className="h-12 w-12 flex items-center justify-center rounded-xl bg-stone-900 text-stone-400 border border-stone-800 active:bg-stone-800 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonTrackerMockup;
