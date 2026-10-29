// Synthetic household activity layered over the checked-in metadata snapshot.
// Fixed timestamps keep screenshots and scenario resets reproducible.
export const DEMO_ACTIVITY_TIME = Date.UTC(2026, 9, 28, 20);
const DAY = 86400000;

const ACTIVITY = {
  346648: { note: 'Save for a rainy Sunday with hot chocolate.' },
  257211: {
    status: 'watched',
    note: 'A lovely low-key evening. Would watch again.',
  },
  286217: { note: 'For a night when we have time for a longer film.' },
  8835: { status: 'watched', note: 'Our go-to pick after a long week.' },
  1584: { note: 'Next family movie night — everyone gets a turn picking.' },
  546554: { note: 'No spoilers! We want to guess the culprit together.' },
  161: { status: 'watching', note: 'Paused halfway through. Finish together.' },
  210577: { note: 'Save for a thriller night.' },
  155: { status: 'watched', note: 'The opening scene still holds up.' },
  324857: { note: 'Turn the sound up for this one.' },
  120467: { status: 'watched', note: 'Loved the colours and miniature sets.' },
  335984: { note: 'Lights off, phones away. A proper big-screen evening.' },
  804: { note: 'Start our classic-film weekend here.' },
  289: { status: 'watched', note: 'Worth revisiting together.' },
  238: { note: 'Keep a whole evening free.' },
  97546: {
    episodes: 12,
    note: 'Two episodes into season two. Our weeknight comfort watch.',
  },
  4586: { episodes: 5, note: 'One episode with dinner, no watching ahead.' },
  4278: { note: 'Recommended by a friend — try the pilot together.' },
  125935: { episodes: 3, note: 'Short episodes for nights when we are tired.' },
  48891: { note: 'Keep this for an easy comedy night.' },
  34549: { note: 'Weekend baking inspiration.' },
  107113: {
    episodes: 9,
    note: 'One episode left in season one. Avoid spoilers.',
  },
  66732: { episodes: 8, note: 'Season one finished. Start season two next.' },
  95396: { episodes: 2, note: 'Watch closely — we keep comparing theories.' },
  68595: {
    status: 'watched',
    note: 'Finished together. The island episode was a favourite.',
  },
  65494: { note: 'A slower drama for when we want to settle in.' },
  94605: {
    episodes: 9,
    note: 'Season one complete. Save the next season for the weekend.',
  },
  2730: { note: 'Try a classic sitcom alongside our newer shows.' },
  6357: { note: 'An anthology pick when we only want one episode.' },
  1438: { note: 'Start when we can commit to a longer series.' },
};

export const withDemoActivity = (item, index) => {
  const activity = ACTIVITY[String(item.source?.providerId)] || {};
  return withDemoWatchState(item, {
    status: activity.episodes ? 'watching' : activity.status || 'unwatched',
    watchedEpisodes: activity.episodes,
    note: activity.note || '',
    index,
  });
};

export const withDemoWatchState = (
  item,
  {
    status = 'unwatched',
    watchedEpisodes = 3,
    note = item.note || '',
    index = 0,
  } = {},
) => {
  const episodes = (item.seasons || []).flatMap(
    (season) => season.episodes || [],
  );
  const watched =
    item.type === 'show'
      ? status === 'watched'
        ? episodes
        : status === 'watching'
        ? episodes.slice(
            0,
            Math.min(watchedEpisodes, Math.max(0, episodes.length - 1)),
          )
        : []
      : [];
  const createdAt = DEMO_ACTIVITY_TIME - (index * 3 + 7) * DAY;
  const startedAt = status === 'unwatched' ? null : createdAt + DAY;
  const episodeProgress = Object.fromEntries(
    watched.map((episode) => [
      String(
        episode.id ||
          `s${episode.seasonNumber}e${episode.episodeNumber || episode.number}`,
      ),
      true,
    ]),
  );
  const state = {
    status,
    note,
    episodeProgress,
    startedAt,
    markedWatchedAt: status === 'watched' ? createdAt + 3 * DAY : null,
  };
  return {
    ...item,
    ...state,
    createdAt,
    updatedAt: state.markedWatchedAt || startedAt || createdAt,
    additionOrigin: index % 5 === 0 ? 'import' : 'manual',
    addedBy: index % 2 ? 'demo-member-alex' : 'demo-member-sam',
    ...(item.userState ? { userState: { ...item.userState, ...state } } : {}),
  };
};
