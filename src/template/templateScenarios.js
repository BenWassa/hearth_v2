import { buildTemplateSeedItems } from './seedLibrary.js';
import { DEMO_ACTIVITY_TIME, withDemoWatchState } from './demoActivity.js';
import { buildCollectionFixture } from './collectionFixtures.js';

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
    id: 'completed',
    label: 'Finished favourites',
    description:
      'Completed films and shows with fully watched episode histories.',
  },
  {
    id: 'collections',
    label: 'Film collections',
    description:
      'Five film series with a mix of completed and remaining films.',
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
      return byProviderIds(seed, [
        '346648',
        '97546',
        '8835',
        '125935',
        '804',
        '4278',
      ]);
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
      return shows.slice(0, 6).map((item, index) =>
        withDemoWatchState(item, {
          status: index < 4 ? 'watching' : 'unwatched',
          watchedEpisodes: [2, 5, 22, 12][index],
          index,
        }),
      );
    case 'completed':
      return [...movies.slice(0, 4), ...shows.slice(0, 2)].map((item, index) =>
        withDemoWatchState(item, { status: 'watched', index }),
      );
    case 'collections':
      return buildCollectionFixture({ count: 5, now: DEMO_ACTIVITY_TIME });
    case 'busy':
      return [
        ...seed.map((item, index) =>
          withDemoWatchState(item, {
            status: ['unwatched', 'watching', 'watched'][index % 3],
            watchedEpisodes: index + 1,
            index,
          }),
        ),
        ...buildCollectionFixture({ count: 5, now: DEMO_ACTIVITY_TIME }),
      ];
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
