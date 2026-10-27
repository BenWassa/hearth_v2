// Editorial catalog v2, approved Issue #6 decisions. Canonical provider IDs only.
// Verified with TMDB collection/search APIs on 2026-10-26. Membership is metadata;
// defaultVisible is a separate editorial decision, never a film-count heuristic.
export const COLLECTION_CATALOG_VERSION = 2;

// Editorial: big sagas that get their own poster rail on their World page.
// Every other saga appears as a tile. Ranking and ownership still apply, so a
// flagged saga with fewer than two owned films falls back to a tile.
const RAIL_PROVIDER_IDS = new Set([
  '86311', // The Avengers
  '131296', // Thor
  '748', // X-Men
  '1241', // Harry Potter
  '10', // Star Wars / Skywalker Saga
  '10194', // Toy Story
  '2150', // Shrek
  '77816', // Kung Fu Panda
]);

const entries = [
  ['86311', 'The Avengers', 'marvel'],
  ['131292', 'Iron Man', 'marvel'],
  ['131295', 'Captain America', 'marvel'],
  ['131296', 'Thor', 'marvel'],
  ['284433', 'Guardians of the Galaxy', 'marvel'],
  ['529892', 'Black Panther', 'marvel'],
  ['448150', 'Deadpool', 'marvel'],
  ['453993', 'The Wolverine', 'marvel'],
  ['531241', 'Spider-Man (MCU)', 'marvel'],
  ['573436', 'Spider-Man: Spider-Verse', 'marvel'],
  ['556', 'Spider-Man', 'marvel'],
  ['125574', 'The Amazing Spider-Man', 'marvel'],
  ['748', 'X-Men', 'marvel'],
  ['618529', 'Doctor Strange', 'marvel'],
  ['422834', 'Ant-Man', 'marvel'],
  ['1241', 'Harry Potter', 'wizarding-world'],
  ['435259', 'Fantastic Beasts', 'wizarding-world'],
  ['10', 'Star Wars / Skywalker Saga', 'star-wars'],
  ['10194', 'Toy Story', 'pixar'],
  ['87118', 'Cars', 'pixar'],
  ['137697', 'Finding Nemo', 'pixar'],
  ['468222', 'The Incredibles', 'pixar'],
  ['137696', 'Monsters, Inc.', 'pixar'],
  ['1022790', 'Inside Out', 'pixar'],
  ['386382', 'Frozen', 'disney-animation'],
  ['404825', 'Wreck-It Ralph', 'disney-animation'],
  ['94032', 'The Lion King (animated)', 'disney-animation'],
  ['87250', 'Bambi', 'disney-animation'],
  ['136214', 'Pocahontas', 'disney-animation'],
  ['86027', 'Aladdin (animated)', 'disney-animation'],
  ['33085', 'The Little Mermaid (animated)', 'disney-animation'],
  ['263', 'The Dark Knight Trilogy', 'dc'],
  ['468552', 'Wonder Woman', 'dc'],
  ['573693', 'Aquaman', 'dc'],
  ['2150', 'Shrek', 'dreamworks'],
  ['14740', 'Madagascar', 'dreamworks'],
  ['77816', 'Kung Fu Panda', 'dreamworks'],
  ['89137', 'How to Train Your Dragon (animated)', 'dreamworks'],
  ['489724', 'Trolls', 'dreamworks'],
  ['519457', 'The Boss Baby', 'dreamworks'],
  ['464577', 'The Croods', 'dreamworks'],
  ['115575', 'Star Trek reboot trilogy', null],
  ['420', 'The Chronicles of Narnia', null],
  ['722971', 'Knives Out', null],
  ['726871', 'Dune (2021 continuity)', null],
  ['645', 'James Bond', null, true, 'anthology'],
  ['9485', 'Fast & Furious', null],
  ['264', 'Back to the Future Trilogy', null],
  ['230', 'The Godfather', null],
  ['119', 'The Lord of the Rings', null],
  // Explicit approved exclusions, even when several feature films are owned.
  ['488924', 'Paddington', null, false],
  ['2980', 'Ghostbusters', null, false],
];

export const COLLECTION_CATALOG = Object.fromEntries(
  entries.map(
    ([
      providerId,
      name,
      worldId,
      defaultVisible = true,
      sequenceMode = 'linear',
    ]) => [
      `tmdb:${providerId}`,
      {
        provider: 'tmdb',
        providerId,
        name,
        worldId,
        defaultVisible,
        sequenceMode,
        rail: RAIL_PROVIDER_IDS.has(providerId),
      },
    ],
  ),
);
