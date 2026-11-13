import identities from './curatedPackIdentities.json';

const PACKS = [
  {
    id: 'black-comedy-excellence',
    type: 'editorial-pack',
    version: 1,
    status: 'draft',
    title: 'Black Comedy Excellence',
    description:
      'Explore a selection of Black-led comedies and comedy-adjacent stories, from familiar favorites to films worth revisiting.',
    credit: 'Curated by Black Comedy Excellence',
    chapters: [
      {
        id: 'roots-early-voices',
        title: 'Roots & Early Voices',
        description:
          'Browse films from a range of earlier periods and comic approaches.',
        films: [
          { id: 'cooley-high', title: 'Cooley High', year: 1975 },
          { id: 'hollywood-shuffle', title: 'Hollywood Shuffle', year: 1987 },
          { id: 'school-daze', title: 'School Daze', year: 1988 },
          { id: 'car-wash', title: 'Car Wash', year: 1976 },
          { id: 'stir-crazy', title: 'Stir Crazy', year: 1980 },
          {
            id: 'uptown-saturday-night',
            title: 'Uptown Saturday Night',
            year: 1974,
          },
          {
            id: 'breakin-2-electric-boogaloo',
            title: "Breakin' 2: Electric Boogaloo",
            year: 1984,
          },
          { id: 'lets-do-it-again', title: "Let's Do It Again", year: 1975 },
          { id: 'do-the-right-thing', title: 'Do the Right Thing', year: 1989 },
          { id: 'dolemite', title: 'Dolemite', year: 1975 },
        ],
      },
      {
        id: 'comic-icons-star-turns',
        title: 'Comic Icons & Star Turns',
        description:
          'Find performer-led films and showcases centered on comic personas.',
        films: [
          { id: 'coming-to-america', title: 'Coming to America', year: 1988 },
          { id: 'harlem-nights', title: 'Harlem Nights', year: 1989 },
          { id: 'life', title: 'Life', year: 1999 },
          {
            id: 'the-nutty-professor',
            title: 'The Nutty Professor',
            year: 1996,
          },
          { id: 'soul-plane', title: 'Soul Plane', year: 2004 },
          { id: 'baps', title: 'B.A.P.S.', year: 1997 },
          {
            id: 'the-original-kings-of-comedy',
            title: 'The Original Kings of Comedy',
            year: 2000,
          },
          { id: 'big-mommas-house', title: "Big Momma's House", year: 2000 },
          {
            id: 'dolemite-is-my-name',
            title: 'Dolemite Is My Name',
            year: 2019,
          },
          { id: 'how-high', title: 'How High', year: 2001 },
        ],
      },
      {
        id: 'friends-family-community',
        title: 'Friends, Family & Community',
        description:
          'Explore stories organized around friendship, family, and ensemble dynamics.',
        films: [
          { id: 'friday', title: 'Friday', year: 1995 },
          { id: 'house-party', title: 'House Party', year: 1990 },
          { id: 'barbershop', title: 'Barbershop', year: 2002 },
          { id: 'girls-trip', title: 'Girls Trip', year: 2017 },
          { id: 'the-wood', title: 'The Wood', year: 1999 },
          { id: 'next-friday', title: 'Next Friday', year: 2000 },
          { id: 'set-it-off', title: 'Set It Off', year: 1996 },
          { id: 'dope', title: 'Dope', year: 2015 },
          {
            id: 'welcome-home-roscoe-jenkins',
            title: 'Welcome Home Roscoe Jenkins',
            year: 2008,
          },
        ],
      },
      {
        id: 'spoofs-satire',
        title: 'Spoofs & Satire',
        description:
          'Browse parody, spoof, satirical, and genre-referential films.',
        films: [
          { id: 'white-chicks', title: 'White Chicks', year: 2004 },
          { id: 'undercover-brother', title: 'Undercover Brother', year: 2002 },
          {
            id: 'sorry-to-bother-you',
            title: 'Sorry to Bother You',
            year: 2018,
          },
          {
            id: 'im-gonna-git-you-sucka',
            title: "I'm Gonna Git You Sucka",
            year: 1988,
          },
          {
            id: 'dont-be-a-menace',
            title:
              "Don't Be a Menace to South Central While Drinking Your Juice in the Hood",
            year: 1996,
          },
          { id: 'pootie-tang', title: 'Pootie Tang', year: 2001 },
          { id: 'dear-white-people', title: 'Dear White People', year: 2014 },
          { id: 'black-dynamite', title: 'Black Dynamite', year: 2009 },
        ],
      },
      {
        id: 'love-relationships',
        title: 'Love & Relationships',
        description:
          'Find romantic comedies and adjacent stories centered on relationships.',
        films: [
          { id: 'boomerang', title: 'Boomerang', year: 1992 },
          { id: 'think-like-a-man', title: 'Think Like a Man', year: 2012 },
          {
            id: 'a-thin-line-between-love-and-hate',
            title: 'A Thin Line Between Love and Hate',
            year: 1996,
          },
          { id: 'booty-call', title: 'Booty Call', year: 1997 },
          {
            id: 'diary-of-a-mad-black-woman',
            title: 'Diary of a Mad Black Woman',
            year: 2005,
          },
          { id: 'the-best-man', title: 'The Best Man', year: 1999 },
          { id: 'waiting-to-exhale', title: 'Waiting to Exhale', year: 1995 },
          { id: 'poetic-justice', title: 'Poetic Justice', year: 1993 },
        ],
      },
      {
        id: 'action-buddy-comedy',
        title: 'Action & Buddy Comedy',
        description:
          'Explore action comedies and stories pairing characters in buddy adventures.',
        films: [
          { id: 'bad-boys', title: 'Bad Boys', year: 1995 },
          { id: 'blue-streak', title: 'Blue Streak', year: 1999 },
          { id: 'ride-along', title: 'Ride Along', year: 2014 },
          { id: 'national-security', title: 'National Security', year: 2003 },
          { id: 'rush-hour', title: 'Rush Hour', year: 1998 },
        ],
      },
    ],
    featuredIds: [
      'coming-to-america',
      'friday',
      'house-party',
      'hollywood-shuffle',
      'girls-trip',
      'black-dynamite',
    ],
  },
];

const ART_ROOT = '/assets/packs';

// Artwork is optional: each file is looked up at these paths and the UI falls
// back to a placeholder (or plain text) until the file exists.
const withIdentityAndArt = (pack) => {
  const base = `${ART_ROOT}/${pack.id}`;
  return {
    ...pack,
    art: { card: `${base}/card.webp`, hero: `${base}/hero.webp` },
    chapters: pack.chapters.map((chapter) => ({
      ...chapter,
      art: `${base}/chapters/${chapter.id}.webp`,
      heroArt: `${base}/chapters/${chapter.id}-hero.webp`,
      films: chapter.films.map((film) => ({
        ...film,
        tmdbId: identities.films[film.id]?.tmdbId ?? null,
      })),
    })),
  };
};

export const CURATED_PACKS = PACKS.map(withIdentityAndArt);

export function getCuratedPacks({ preview = false } = {}) {
  return preview
    ? CURATED_PACKS
    : CURATED_PACKS.filter((pack) => pack.status === 'published');
}
