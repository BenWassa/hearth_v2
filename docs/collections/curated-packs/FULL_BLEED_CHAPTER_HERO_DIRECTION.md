# Black Comedy Excellence — full-bleed chapter hero direction

**Creative direction approved:** 2026-11-13, after 390px mobile comparison of *Friends, Family & Community* (long title) and *Comic Icons* (short title).
**Workstream:** asset production/review in ChatGPT under [#62](https://github.com/BenWassa/hearth_v2/issues/62); integration and implementation later in Workspace under [#55](https://github.com/BenWassa/hearth_v2/issues/55).
**Phase:** approved art/UX **direction**, **not** six individually approved final replacements, implemented UI, or cleared/licensed production assets.

## Decision

Replace the current chapter-page banner concept (16:9 collage with an artificially empty forest-green block occupying about 35–45% at left) with a **character-led, full-bleed cinematic hero** for **all six Black Comedy Excellence chapters**. Put each chapter's **live text directly over the hero**, using a **soft localized dark blur/fade** behind the words to preserve legibility and visual depth.

**No decorative lines.** No horizontal dividers, underlines, strokes, rules, bars or ornamental marks near the heading. Organic torn-paper seams **inside the actual film collage** remain part of the chosen Print Heritage aesthetic; these are *not* title decoration.

The latest side-by-side 390px visual test showed:
- *Friends, Family & Community*: a two-line cream serif title anchored over the darkened lower hero image, readable despite its length.
- *Comic Icons*: the same title treatment with shorter copy.
- Both use prominent full-bleed character artwork, without a large empty green left panel; bottom of the image blends into the near-black Hearth page.
- The mockup is a **style/layout reference only**, not factual film/cast/poster data or a finished UI. It repeats incorrect film-poster samples between chapters; **do not reproduce those samples or invent editorial entries**.

The latest mockup is retained in the ChatGPT asset-studio conversation as `a_polished_ui_mockup_showing_two_side_by_side_mobi.png` (image generation ID `0e72893f-477b-468c-a35e-877f5fe3f849`). **No screenshot binary has been committed with this document.** Source image(s) must be transferred separately when the final artwork ZIP is handed to Workspace.

## Master visual and layout contract

### Image generation: ChatGPT asset studio
1. **No empty left text panel.** Recompose the films and people into a genuinely full-bleed poster collage occupying the entire hero surface. Use the image's width for expressive imagery; leave faces away from the lower heading zone when possible.
2. Preserve the original **Print Heritage** look: forest green `#173B2B`, burnt red `#B23A24`, muted ochre `#E8A11C`, cream `#F3D9A7`, charcoal `#201B17`; matte vintage screen-print/editorial finish, restrained grain/halftone, irregular organic paper tears, period-correct faces, poses and costume.
3. **New hero assets must be text-free** and free of baked shadows, CSS-style title blur, nav controls or film poster shelves. Generate the visual field; let Hearth render the text and responsive fade. Keep naturally darker/less-important detail toward the lower area where helpful.
4. Target a **mobile portrait-oriented hero source and crop** instead of assuming old 16:9 banners can be stretched. **Provisional** source framing: roughly 4:5 or 3:4 with safe composition for 320/360/390/448px widths; validate against the actual future page treatment before finalizing pixel export sizes. Preserve any 16:9 original for historical/archive or possible wide responsive use.
5. No excessive orange glow, glossy action-poster faces, perfect bright seams, artificial rays, fake graphic icons, cut-off faces, or extra performers. Use real film references for likeness/costume accuracy. Avoid adding people simply to fill the wider image.
6. Generate and review **one chapter at a time**. Start with longest-title *Friends, Family & Community*, then *Comic Icons* for a short-heading stress test; apply the accepted shared composition strategy to the other four.

### Intended live UI treatment: later Workspace, **not to implement now**
1. Chapter title **on the artwork**, not in a detached text card or separate strip. Cream serif from the existing Hearth type scale, aligned toward the lower-left with responsive padding. Title remains accessible selectable text, never embedded into the PNG.
2. Apply a **soft, feathered local darkening/blur** behind the heading and, if needed, description. This should merge with Hearth's near-black page background at the hero bottom. Do **not** obscure the entire image with opaque panels.
3. **No lines** beneath title or between image and the next section. Avoid visible hard boundaries between hero and content.
4. For longer headings, allow a natural two- or three-line wrap rather than compressing to tiny text or requiring special per-chapter green negative space. Protect faces, readable contrast and the first viewport's content density.
5. Validate on actual 320/360/390/448px widths and Pixel/browser behavior; check text contrast, long-name wrapping, overflow, poster shelf visibility and transition into content. Honor reduced motion; no animation required to achieve the aesthetic.
6. No app implementation, new chapter navigation, data model, poster set or copy change is approved by this art-direction decision. Product/film selection remains under #55.

## Six chapter artwork remake queue

| Order | Chapter | Carry forward from earlier approved reference | Key image/heading concern |
| --- | --- | --- | --- |
| 1 | **Friends, Family & Community** | #10 original: *Friday* (Craig and Smokey), *House Party* (Kid 'n Play cover-inspired pose), *Barbershop* | Longest title. Build full-bleed ensemble portrait framing; test title at 320/390. Preserve source #10 unchanged. |
| 2 | **Comic Icons** | Existing locked microphone identity and five creatively selected performer portraits | Short title. The new page-hero treatment should respect the microphone-led chapter system; do **not** replace it with an arbitrary celebrity collage. Independently review whether the mic or approved performer art leads the hero. |
| 3 | **Spoofs & Satire** | Recently selected collage: Shawn/Marlon Wayans (*Don't Be a Menace*), Keenen Ivory Wayans/Jack Spade (*I'm Gonna Git You Sucka*), Michael Jai White (*Black Dynamite*) | Source version received “Good next”; don't silently call it a separately final-locked export. Verify faces/props, then recompose full bleed. |
| 4 | **Love & Relationships** | Most recently explicitly **LOCKED** three-couple banner: *Boomerang* Eddie Murphy/Halle Berry, *Martin & Gina*, *Love & Basketball* Omar Epps/Sanaa Lathan | Explicit creative lock applies to the **old source banner**. Keep it unmodified; produce a **new full-bleed derivative** for separate approval. The film/TV visual references do not automatically alter the provisional 50-film content list. |
| 5 | **Action & Buddy Comedy** | #17 selected *Undercover Brother B* artwork | Keep approved actor identities/image reference; do not silently substitute the tentative action-film list. Validate long title with blur. |
| 6 | **Roots & Early Voices** | #23 selected Sidney Poitier / Robert Townsend / *Car Wash* composition | Maintain historical/film accuracy; no fake extra period subjects. Validate title and face-safe lower fade. |

**Other assets:** The collection's 2:3 cover (B primary, A alternate), full-page collection hero, five Comic Icons portraits, and other non-chapter assets are **preserved**. Review their visual fit after the six chapter heroes are remade; do not automatically replace them based only on this chapter-hero decision.

## Approval / packaging rules

- This direction **supersedes the old requirement for a green left-side title-safe region for new chapter-page hero variants**. The old 29-image and later creative approvals remain valid as historical source/reference, **not as final approved full-bleed replacements**.
- Each new image needs explicit owner review for composition, likenesses, full-bleed treatment, readable live-heading concept, mobile crop, and overall fit among the other chapters. Never claim that a UI mockup alone proves app contrast or layout quality.
- Keep historical approved PNGs pristine and separately identified; use new filenames/version IDs for full-bleed editions.
- Make incremental delta ZIPs containing **new and changed files only**, each **under 25 MB**, with a manifest, hashes, dimensions and decision status. Do not repack rejected or old variants unnecessarily.
- Once all new artworks are approved, create a final Workspace-ready manifest mapping the chapter identifiers to **exact approved source images** and listing unresolved rights/attribution and editorial mapping questions. No code, runtime integration, PR merge or deployment in this artwork phase.

## Related records
- [Artwork-only issue #62](https://github.com/BenWassa/hearth_v2/issues/62)
- [Art-studio historical status and previous decisions](ARTWORK_STUDIO_STATUS.md)
- [Original artwork prompts and Print Heritage style](ASSET_GENERATION_PROMPTS.md)
- [Full-page product design / content blueprint](BLACK_COMEDY_EXCELLENCE_BLUEPRINT.md)
- [Future Workspace implementation #55](https://github.com/BenWassa/hearth_v2/issues/55)
