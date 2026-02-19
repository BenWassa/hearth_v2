import seedMediaMap from './seed-media-map.json';

const MOVIE_SEEDS = [
  {
    title: 'Paddington 2',
    providerId: '346648',
    year: '2017',
    vibe: 'comfort',
    energy: 'light',
    runtimeMinutes: 103,
    genres: ['Family', 'Comedy'],
  },
  {
    title: 'The Intern',
    providerId: '257211',
    year: '2015',
    vibe: 'comfort',
    energy: 'balanced',
    runtimeMinutes: 121,
    genres: ['Comedy', 'Drama'],
  },
  {
    title: 'The Martian',
    providerId: '286217',
    year: '2015',
    vibe: 'comfort',
    energy: 'focused',
    runtimeMinutes: 144,
    genres: ['Sci-Fi', 'Adventure'],
  },
  {
    title: 'Legally Blonde',
    providerId: '8835',
    year: '2001',
    vibe: 'easy',
    energy: 'light',
    runtimeMinutes: 96,
    genres: ['Comedy'],
  },
  {
    title: 'School of Rock',
    providerId: '1584',
    year: '2003',
    vibe: 'easy',
    energy: 'balanced',
    runtimeMinutes: 109,
    genres: ['Comedy', 'Music'],
  },
  {
    title: 'Knives Out',
    providerId: '546554',
    year: '2019',
    vibe: 'easy',
    energy: 'focused',
    runtimeMinutes: 130,
    genres: ['Mystery', 'Comedy'],
  },
  {
    title: "Ocean's Eleven",
    providerId: '161',
    year: '2001',
    vibe: 'gripping',
    energy: 'light',
    runtimeMinutes: 116,
    genres: ['Crime', 'Thriller'],
  },
  {
    title: 'Gone Girl',
    providerId: '210577',
    year: '2014',
    vibe: 'gripping',
    energy: 'balanced',
    runtimeMinutes: 149,
    genres: ['Thriller', 'Mystery'],
  },
  {
    title: 'The Dark Knight',
    providerId: '155',
    year: '2008',
    vibe: 'gripping',
    energy: 'focused',
    runtimeMinutes: 152,
    genres: ['Action', 'Crime'],
  },
  {
    title: 'Spider-Man: Into the Spider-Verse',
    providerId: '324857',
    year: '2018',
    vibe: 'visual',
    energy: 'light',
    runtimeMinutes: 117,
    genres: ['Animation', 'Action'],
  },
  {
    title: 'The Grand Budapest Hotel',
    providerId: '120467',
    year: '2014',
    vibe: 'visual',
    energy: 'balanced',
    runtimeMinutes: 100,
    genres: ['Comedy', 'Drama'],
  },
  {
    title: 'Blade Runner 2049',
    providerId: '335984',
    year: '2017',
    vibe: 'visual',
    energy: 'focused',
    runtimeMinutes: 164,
    genres: ['Sci-Fi', 'Drama'],
  },
  {
    title: 'Roman Holiday',
    providerId: '804',
    year: '1953',
    vibe: 'classic',
    energy: 'light',
    runtimeMinutes: 119,
    genres: ['Romance', 'Comedy'],
  },
  {
    title: 'Casablanca',
    providerId: '289',
    year: '1942',
    vibe: 'classic',
    energy: 'balanced',
    runtimeMinutes: 102,
    genres: ['Romance', 'Drama'],
  },
  {
    title: 'The Godfather',
    providerId: '238',
    year: '1972',
    vibe: 'classic',
    energy: 'focused',
    runtimeMinutes: 175,
    genres: ['Crime', 'Drama'],
  },
];

const SHOW_SEEDS = [
  {
    title: 'Ted Lasso',
    providerId: '97546',
    year: '2020',
    vibe: 'comfort',
    energy: 'light',
  },
  {
    title: 'Gilmore Girls',
    providerId: '4586',
    year: '2000',
    vibe: 'comfort',
    energy: 'balanced',
  },
  {
    title: 'Friday Night Lights',
    providerId: '4278',
    year: '2006',
    vibe: 'comfort',
    energy: 'focused',
  },
  {
    title: 'Abbott Elementary',
    providerId: '125935',
    year: '2021',
    vibe: 'easy',
    energy: 'light',
  },
  {
    title: 'Brooklyn Nine-Nine',
    providerId: '48891',
    year: '2013',
    vibe: 'easy',
    energy: 'balanced',
  },
  {
    title: 'The Great British Bake Off',
    providerId: '34549',
    year: '2010',
    vibe: 'easy',
    energy: 'focused',
  },
  {
    title: 'Only Murders in the Building',
    providerId: '107113',
    year: '2021',
    vibe: 'gripping',
    energy: 'light',
  },
  {
    title: 'Stranger Things',
    providerId: '66732',
    year: '2016',
    vibe: 'gripping',
    energy: 'balanced',
  },
  {
    title: 'Severance',
    providerId: '95396',
    year: '2022',
    vibe: 'gripping',
    energy: 'focused',
  },
  {
    title: 'Planet Earth II',
    providerId: '68595',
    year: '2016',
    vibe: 'visual',
    energy: 'light',
  },
  {
    title: 'The Crown',
    providerId: '65494',
    year: '2016',
    vibe: 'visual',
    energy: 'balanced',
  },
  {
    title: 'Arcane',
    providerId: '94605',
    year: '2021',
    vibe: 'visual',
    energy: 'focused',
  },
  {
    title: 'I Love Lucy',
    providerId: '2730',
    year: '1951',
    vibe: 'classic',
    energy: 'light',
  },
  {
    title: 'The Twilight Zone',
    providerId: '6357',
    year: '1959',
    vibe: 'classic',
    energy: 'balanced',
  },
  {
    title: 'The Wire',
    providerId: '1438',
    year: '2002',
    vibe: 'classic',
    energy: 'focused',
  },
];

const TEMPLATE_BASE_TIME = Date.UTC(2025, 0, 1, 20, 0, 0);
export const TEMPLATE_SPACE_NAME = 'Template Demo';
export const TEMPLATE_SPACE_ID = 'template-demo-space';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildShowSeasons = (slug) => {
  const episodes = [1, 2, 3].map((episodeNumber) => ({
    id: `${slug}-s1e${episodeNumber}`,
    number: episodeNumber,
    episodeNumber,
    seasonNumber: 1,
    name: `Episode ${episodeNumber}`,
    title: `Episode ${episodeNumber}`,
    runtimeMinutes: 45,
  }));

  return [
    {
      number: 1,
      seasonNumber: 1,
      name: 'Season 1',
      episodeCount: episodes.length,
      episodes,
    },
  ];
};

const createTemplateItem = (seed, index, type) => {
  const createdAt = TEMPLATE_BASE_TIME - index * 60 * 1000;
  const slug = slugify(`${seed.title}-${seed.year}-${type}`);
  const isShow = type === 'show';
  const seasons = isShow ? buildShowSeasons(slug) : [];

  return {
    id: `template-${slug}`,
    title: seed.title,
    type,
    year: seed.year,
    vibe: seed.vibe,
    energy: seed.energy,
    status: 'unwatched',
    note: '',
    runtimeMinutes: Number.isFinite(seed.runtimeMinutes)
      ? seed.runtimeMinutes
      : null,
    overview: '',
    genres: Array.isArray(seed.genres) ? [...seed.genres] : [],
    actors: [],
    director: '',
    poster: '',
    backdrop: '',
    logo: '',
    createdAt,
    updatedAt: createdAt,
    startedAt: null,
    totalSeasons: isShow ? 1 : null,
    seasons,
    episodeProgress: {},
    source: seed.providerId
      ? {
          provider: 'tmdb',
          providerId: String(seed.providerId),
          fetchedAt: createdAt,
          locale: 'en-US',
        }
      : {},
  };
};

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const SEED_MEDIA_ITEMS = asArray(asObject(seedMediaMap).items);
const SEED_MEDIA_BY_ID = new Map(
  SEED_MEDIA_ITEMS.map((item) => [String(item?.id || ''), asObject(item)]),
);
const SEED_MEDIA_BY_PROVIDER_KEY = new Map(
  SEED_MEDIA_ITEMS.map((item) => {
    const source = asObject(item?.source);
    const provider = String(source.provider || '').toLowerCase();
    const providerId = String(source.providerId || '');
    return [`${provider}:${providerId}`, asObject(item)];
  }),
);

const getMappedMedia = (baseItem) => {
  const byId = SEED_MEDIA_BY_ID.get(String(baseItem?.id || ''));
  if (byId) return byId;

  const source = asObject(baseItem?.source);
  const provider = String(source.provider || '').toLowerCase();
  const providerId = String(source.providerId || '');
  return SEED_MEDIA_BY_PROVIDER_KEY.get(`${provider}:${providerId}`) || null;
};

const mergeSeedWithMappedMedia = (baseItem) => {
  const mapped = getMappedMedia(baseItem);
  if (!mapped) return baseItem;

  return {
    ...baseItem,
    ...mapped,
    id: baseItem.id,
    type: baseItem.type,
    vibe: baseItem.vibe,
    energy: baseItem.energy,
    status: baseItem.status,
    note: baseItem.note,
    createdAt: baseItem.createdAt,
    updatedAt: baseItem.updatedAt,
    startedAt: baseItem.startedAt,
    episodeProgress: baseItem.episodeProgress,
  };
};

const TEMPLATE_SEED_ITEMS = [
  ...MOVIE_SEEDS.map((seed, index) => createTemplateItem(seed, index, 'movie')),
  ...SHOW_SEEDS.map((seed, index) =>
    createTemplateItem(seed, MOVIE_SEEDS.length + index, 'show'),
  ),
];

const TEMPLATE_SEED_ITEMS_WITH_MEDIA = TEMPLATE_SEED_ITEMS.map((item) =>
  mergeSeedWithMappedMedia(item),
);

export const buildTemplateSeedItems = () =>
  cloneDeep(TEMPLATE_SEED_ITEMS_WITH_MEDIA);
