// Editorial taxonomy v1. TMDB true-sequel collections, never company-name matching.
// Marvel includes recognizable Sony Marvel sagas; Disney means Disney Animation.
export const COLLECTION_WORLDS_VERSION = 1;
// Verified against TMDB collection/search API on 2026-10-25.
export const COLLECTION_WORLDS = [
  {
    id: 'marvel',
    name: 'Marvel',
    motif: 'orbit',
    cover: null,
    collectionIds: [
      '86311',
      '131292',
      '131295',
      '131296',
      '284433',
      '529892',
      '448150',
      '453993',
      '531241',
      '573436',
      '556',
      '125574',
      '748',
      '618529',
      '422834',
    ],
  },
  {
    id: 'star-wars',
    name: 'Star Wars',
    motif: 'stars',
    cover: null,
    collectionIds: ['10'],
  },
  {
    id: 'pixar',
    name: 'Pixar',
    motif: 'play',
    cover: null,
    collectionIds: ['10194', '87118', '137697', '468222', '137696', '1022790'],
  },
  {
    id: 'disney-animation',
    name: 'Disney Animation',
    motif: 'story',
    cover: null,
    collectionIds: [
      '386382',
      '404825',
      '94032',
      '87250',
      '136214',
      '86027',
      '33085',
    ],
  },
  {
    id: 'dreamworks',
    name: 'DreamWorks',
    motif: 'moon',
    cover: null,
    collectionIds: [
      '2150',
      '14740',
      '77816',
      '89137',
      '489724',
      '519457',
      '464577',
    ],
  },
];

export const worldForSaga = (saga) =>
  (saga.collection?.provider || 'tmdb') === 'tmdb'
    ? COLLECTION_WORLDS.find((world) =>
        world.collectionIds.includes(String(saga.collection?.providerId)),
      ) || null
    : null;
export const buildWorlds = (sagas) =>
  COLLECTION_WORLDS.map((world) => {
    const children = sagas.filter(
      (saga) => worldForSaga(saga)?.id === world.id,
    );
    return {
      ...world,
      sagas: children,
      ownedTotal: children.reduce((n, saga) => n + saga.totalCount, 0),
      unwatched: children.reduce(
        (n, saga) => n + saga.totalCount - saga.watchedCount,
        0,
      ),
      activity: Math.max(
        0,
        ...children.map((saga) => saga.activity?.lastActivityAt || 0),
      ),
    };
  })
    .filter((world) => world.sagas.length)
    .sort((a, b) => b.activity - a.activity || a.name.localeCompare(b.name));
