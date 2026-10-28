import { buildTemplateSeedItems } from './seedLibrary.js';

export const TEMPLATE_SCENARIOS = [
  {
    id: 'empty',
    label: 'Empty shelf',
    description: 'A clean first-use state for testing onboarding and adding.',
  },
  {
    id: 'few',
    label: 'A few favorites',
    description: 'A compact mixed shelf with six easy-to-scan titles.',
  },
  {
    id: 'movies',
    label: 'Movie night',
    description: 'A movie-heavy shelf with varied moods and runtimes.',
  },
  {
    id: 'shows',
    label: 'Shows in progress',
    description: 'Shows with watch progress for the Currently Watching rail.',
  },
  {
    id: 'full',
    label: 'Full library',
    description: 'The complete curated demo library.',
  },
  {
    id: 'busy',
    label: 'Busy household',
    description: 'A dense mixed shelf with watched and active titles.',
  },
];

export const DEFAULT_TEMPLATE_SCENARIO = 'full';

const byProviderIds = (items, ids) => {
  const wanted = new Set(ids);
  return items.filter((item) => wanted.has(String(item?.source?.providerId)));
};

const withStatuses = (items, statuses) =>
  items.map((item, index) => ({
    ...item,
    status: statuses[index % statuses.length],
    ...(statuses[index % statuses.length] === 'watching'
      ? { startedAt: item.startedAt || item.createdAt }
      : {}),
  }));

export const buildTemplateScenario = (
  scenarioId = DEFAULT_TEMPLATE_SCENARIO,
) => {
  const seed = buildTemplateSeedItems();
  const movies = seed.filter((item) => item.type === 'movie');
  const shows = seed.filter((item) => item.type === 'show');

  switch (scenarioId) {
    case 'empty':
      return [];
    case 'few':
      return byProviderIds(seed, ['346648', '97546', '8835', '125935', '804', '4278']);
    case 'movies':
      return byProviderIds(movies, [
        '346648',
        '257211',
        '286217',
        '546554',
        '324857',
        '120467',
        '804',
        '238',
      ]);
    case 'shows':
      return shows.slice(0, 6).map((item, index) => ({
        ...item,
        status: index < 4 ? 'watching' : 'unwatched',
        startedAt: index < 4 ? item.createdAt : null,
        episodeProgress:
          index < 4
            ? {
                [item.seasons?.[0]?.episodes?.[0]?.id || `${item.id}-s1e1`]: true,
                ...(index % 2
                  ? {}
                  : {
                      [item.seasons?.[0]?.episodes?.[1]?.id ||
                      `${item.id}-s1e2`]: true,
                    }),
              }
            : {},
      }));
    case 'busy':
      return withStatuses(seed, ['unwatched', 'watching', 'watched']);
    case 'full':
    default:
      return seed;
  }
};

export const getTemplateScenario = (scenarioId) =>
  TEMPLATE_SCENARIOS.find((scenario) => scenario.id === scenarioId) ||
  TEMPLATE_SCENARIOS.find(
    (scenario) => scenario.id === DEFAULT_TEMPLATE_SCENARIO,
  );
