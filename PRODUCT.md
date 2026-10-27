# Product

## Register

product

## Users

Couples and small shared households deciding what to watch together, usually in the evening, on a phone or tablet, in a dim living room. They already have a pile of titles they both half-want to see. The job is to turn that pile into one agreeable choice for tonight without a negotiation. Sessions are short and intentional; one person is often holding the device while both look at it.

## Product Purpose

Hearth is a calm, shared watchlist. It keeps a finite, human-curated shelf of movies and shows, tracks TV progress per episode, and offers a gentle decision helper that picks from the shelf without explaining an algorithm. It is not a streaming platform, not a recommendation engine, and has no social layer. Success is a couple choosing quickly and feeling good about it. A feature that raises engagement but does not reduce decision friction does not belong.

## Brand Personality

Cozy, cinematic, warm. The voice is quiet and human, closer to a friend setting out the evening than an app asking for attention. Poster and backdrop artwork carries the visual drama; the interface chrome stays low and lets it. Emotional goals: ease, shared anticipation, no pressure.

## Anti-references

- Gamified or social apps: streaks, badges, feeds, leaderboards, notification pressure.
- Generic dark SaaS dashboards: cold blue-grey panels, glass cards, gradient accents.
- Algorithmic recommenders: match percentages, "because you watched", ranked and explained suggestions.

Comparison point, not a model to copy: major streaming services share a cinematic, poster-forward language that users already read fluently, and Hearth can borrow that fluency. It must not borrow their engagement mechanics (endless rows, autoplay, infinite scroll).

## Design Principles

1. **Reduce friction, never add stimulation.** Every screen earns its place by making the decision easier. Calm over novelty.
2. **Let the artwork carry the drama.** Posters and backdrops are the visual event; controls, labels and containers recede.
3. **Finite and intentional.** A bounded shelf, a short Tonight tray, a single suggestion. Avoid endless lists, counters and pressure.
4. **Shared, not social.** Two people at one screen. Language and layout assume togetherness, with no audience.
5. **Warm and legible in the dark.** Designed for a dim room: comfortable contrast, no glare, a shell that blends into the device bezel.

## Accessibility & Inclusion

Target WCAG 2.1 AA for text contrast and focus visibility, with particular care for small muted text on dark surfaces. Honor `prefers-reduced-motion` (already done for card entrances). Touch targets at least 44px on mobile. Respect device safe areas. Do not rely on color alone for state (watched, in progress, selected).

## Collections

Tonight shows every World with something on the shelf in one finite horizontal brand rail after the first suggestion rail, so the household can enter a familiar brand, choose a saga and reach a film. The fixed editorial order is Pixar, Marvel, Star Wars, Wizarding World, Disney, DreamWorks, DC, Studio Ghibli; empty Worlds are skipped. Under a small uppercase Worlds label without an icon, 7:2 (3.5:1) tiles at `clamp(11rem, 56vw, 15rem)` wide (about 176 to 240px) show one tile and a clear peek of the next on a phone. Tiles are never shorter than 44px; at 176px wide, a tile is 50px tall. The roughly 4:1 cards crop only a sliver at the sides. The plain scroll-snap row supports native scrolling and arrow keys, with no looping, cloned tiles, autoplay or auto-advance, and no edge fade needed. Tiles use designer-made banner cards (`public/assets/worlds/<id>/card.webp`, about 780x190, roughly 4:1), with the World's logo baked into a rich tonal gradient and a soft corner highlight. Never overlay a separate logo or apply per-World wordmark width fractions, which would duplicate the name. Each tile is a button with the World name as its accessible name; the image is decorative with empty alt text (`alt=""`). A warm stone background sits under the image, and the serif World name shows if the image fails. Tonight's Collections row reads the same World list and excludes sagas belonging to those Worlds, so it effectively shows only sagas in no World and changes automatically with the rail. An All collections tile appears whenever any saga is left out of the row or more than three sagas are shown. World pages show hero art only, with a screen-reader `h1` that becomes the visible fallback if the image fails. Below are poster rails for sagas with the catalog's editorial `rail` flag and at least two owned films, with plain serif names and quiet right-aligned Details text buttons (44px targets), then a two-column index of backdrop tiles with serif saga names and no counts for every other saga with owned films. Flagged sagas with fewer than two owned films fall back to tiles. The index is headed 'More <World name>' when rails exist, otherwise 'Sagas'; Other films, Shorts & specials and TV series rails follow when present. A saga tile, a rail's Details button or a Tonight Collections saga card opens a saga page as a layered dialog, with a backdrop hero, serif title, owned films in a three-across poster grid in release order, then provider-listed films not on the shelf, then Shorts & specials. A plain list of every saga stays one tap away. World affiliation, editorial saga eligibility and activity relevance are separate decisions. Standalone films and shorts never become invented sagas, and shelf progress is distinct from franchise completion.
