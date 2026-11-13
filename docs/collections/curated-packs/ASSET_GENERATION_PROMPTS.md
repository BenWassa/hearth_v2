# Black Comedy Excellence — Artwork generation prompts

> **Current status (2026-11-13):** This file is a historical prompt handoff. Artwork production and approvals are now occurring in the ChatGPT asset-studio conversation under [#62](https://github.com/BenWassa/hearth_v2/issues/62), **not** in Workspace. The latest 29-image selections, unfinished Spoofs/Love variants, palette, and handoff gate are recorded in [ARTWORK_STUDIO_STATUS.md](ARTWORK_STUDIO_STATUS.md). Older statements below such as “next artwork round: Friends” are superseded. No UI implementation or images have been merged.


**Status:** External-generation handoff, design concepts approved in conversation; **no generated image here is a final production asset**  
**Last updated:** 2026-11-10  
**Issue:** https://github.com/BenWassa/hearth_v2/issues/55  
**Scope:** Hearth > Tonight > Collections rail > Black Comedy Excellence full page > Comic Icons chapter  
**Rule:** **One asset type per generation round**. Produce 2–3 controlled variations within that type, review, then move to the next type. Do not simultaneously generate the entire UI.

## A. Shared art direction (include with every prompt)

> Art direction: Original **Print Heritage** editorial illustration inspired by vintage screen printing, retro film-programme typography and aged paper, without recreating an existing poster. Restrained palette: deep forest green (#173B2B approx.), burnt red (#B23A24), muted ochre (#E8A11C), warm cream (#F3D9A7), charcoal (#201B17). Subtle worn paper edge, tactile ink, fine halftone shading, deliberate large colour fields. Clear silhouettes, compelling composition and readable at 390px mobile UI. Use visually accurate, relevant Black performers when specifically named/approved; do not invent celebrity-like faces. Avoid generic cinema props, popcorn, clapboards, royal crowns, excessive sunsets/palms/city skylines, sparkle/shine marks, starburst rays, action or radiating lines, decorative underline strokes, clutter, text artifacts and fake icon marks. No logos or copyright marks. Do not add unrelated subjects or text.

**Approved visual references:** Existing 2:3 Black Comedy Excellence rail-cover concept (smiling Black man, cream lettering, green/red/ochre) and preferred 16:9 full-page hero (large smiling Black man on right, green open space on left). Treat those as visual guides, not as subjects to crop or replicate on every chapter. Attach the approved reference images when using an external generator.

**Rendering rules:** Generate artwork separately from UI. Hearth supplies back controls, chapter links, live headings, performer names and film grids. Do not paint navigation controls into any image. Image sizes below are *target aspect ratios* for generation; export validated lossless source and optimized web runtime versions separately after acceptance.

## B. Comic Icons — locked editorial-hybrid page structure

**Concept locked, NOT individual faces:** microphone-led chapter header; one featured performer artwork; three supporting performer portraits; existing verified movie posters below. Actual identities, artist likeness approvals and person-level editorial pages remain undecided. Do not use an unapproved random famous-looking face.

**Proposed content hierarchy (native UI):**
1. Chapter heading \`Comic Icons\` with restrained vintage microphone header art.
2. Featured icon: one prominent illustrated portrait with live name and relevant BE film credits.
3. More icons: three consistent smaller portraits, each with live name.
4. Films: use verified, licensed provider images; never generate movie posters or reinterpret actual film stills.

**Reference dimensions:** UI target ~390 CSS pixels. Source art targets: chapter background 1600 × 900 px (16:9); featured portrait 1200 × 1500 px (4:5), supporting portraits 1024 × 1024 px (1:1). Safe crop: no faces or important artwork against the image edges; check compact 320–448px layouts. Aspect ratio/format can be revised after production UI layout test.

### Prompt 01 — Comic Icons chapter header background (no baked-in text)

> Create **one 16:9 landscape chapter-header illustration** for a curated Black film-comedy page called “Comic Icons.” Follow the attached Print Heritage reference. Use a substantial **vintage broadcast microphone** in cream-and-charcoal halftone, anchored on the right, with deep forest-green open negative space on the left for a **live HTML “Comic Icons” heading**. Keep red and muted ochre as restrained broad background shapes; slight distressed paper grain only. No person in this version. **DO NOT include any text at all** in the image. No radiating rays, shiny marks, action strokes, underline decorations, film reels, crowns, popcorn or clapboards. The microphone should remain identifiable when viewed at 160px wide. Three variations should change only microphone framing and colour-field balance, not the concept.

**Existing approved reference:** the illustrated microphone / title-wide banner. For implementation, the final image should omit baked lettering; native Hearth typography will draw it.

### Prompt 02 — Featured performer artwork (one subject only)

> Create a **4:5 portrait editorial illustration** for the “Comic Icons” featured performer card in a Black film-comedy collection. **SUBJECT: [EXACT PERSON APPROVED BY EDITOR — DO NOT GENERATE UNTIL FILLED].** Use an attached reference photo of this specific performer to maintain recognizable adult facial identity and era-appropriate styling. Translate to original Print Heritage screen-print aesthetic, tactile halftone and cream/charcoal shadow structure; warm ochre, forest green and burnt-red colour fields. Use one compelling expression and a composed shoulder/upper-body crop; allow breathing space for the app's separate live heading/film credits. No added props or fake crowns, no additional people, no text, no radiating lines, no spotlight gimmicks. Produce only that person's portrait; three controlled poses/framing options when the editor chooses the person.

**Note:** The BE collection features films associated with Eddie Murphy, Richard Pryor, Martin Lawrence and others, but **no featured performer has been approved**. Naming a candidate in ideation is not a production identity lock.

### Prompt 03 — Supporting portrait #1

> Create a **1:1 square standalone editorial portrait** of **[APPROVED PERFORMER 1]**. Use a verified source photo as explicit identity reference; do not substitute a similar-looking celebrity. Same Print Heritage palette, halftone density, cream/charcoal shadows, slightly weathered print surface and consistent 3/4 portrait framing as the featured card. Give the subject a distinctive natural expression and appropriate clothing; no title, labels, stickers, stars, underline, rays, props or extra people. The portrait must read at 80–120px square.

### Prompt 04 — Supporting portrait #2

> Create a **1:1 square standalone editorial portrait** of **[APPROVED PERFORMER 2]**, referencing the approved individual's photo. Match supporting portrait #1 exactly in artwork scale, halftone density, tonal contrast, soft paper wear, background complexity and visual weight, but distinguish the subject through their real face, hairstyle and expression. No text, generic icons, sparkle effects, crowns or additional people.

### Prompt 05 — Supporting portrait #3

> Create a **1:1 square standalone editorial portrait** of **[APPROVED PERFORMER 3]**, using verified photographic identity reference and the *same style contract* as #1 and #2. Preserve variation in real appearance rather than forcing every subject into the same hairstyle, clothing or era. Keep halftone details legible at phone size. No text, fake photography, extra faces, action lines or decorative flourishes.

**Important:** Generate each supporting portrait separately with the same accepted reference palette and art-style master, then review them together at the rendered tile size. This helps prevent multi-person-generation errors and makes reordering possible.

### Optional alternative — Microphone-only icon card

> Create a **single compact vintage microphone motif** against forest green with restrained ochre and burnt red geometric fields in the Print Heritage style, legible at small sizes. **No title or other text**; no performer. Use as the static chapter cover if performer portraits are used only inside the page. Not a stand-up-specific claim about all films.

## C. Next artwork round — Friends, Family & Community

**Status:** Prompts prepared for external use, no designs approved yet. **Generate exactly one prompt per image.** Every prompt below is self-contained, explicitly bans real celebrity portraits, and requests **16:9 landscape** artwork only. Attach the approved Print Heritage reference and compare these outputs at the same size. UI text is rendered natively by Hearth; **no baked-in chapter title**.

### Prompt 06 — Neighbourhood ensemble

> Create a **single horizontal 16:9, text-free chapter artwork** for a mobile movie collection titled “Friends, Family & Community.” Artwork only, not a phone UI mockup. Depict **three fictional adult Black friends** of distinct appearances, natural expressions and ages, gathered on an urban residential front stoop in a candid shared laugh. Compose the figures in the **right-hand 60%**, with believable interpersonal gestures, varied clothing and an understated neighbourhood architectural context. Keep the **left 40% as quiet negative space** for Hearth's separately rendered heading. The style is **vintage 1970s-inspired editorial screen print**, high-quality hand-inked halftone, subtle worn paper texture, deep forest green #173B2B, burnt red #B23A24, muted ochre #E8A11C, warm cream #F3D9A7 and charcoal. Feel warm, social and filmic without looking like a stock photo or a frozen film still. Keep each face legible at a phone-sized card. **No celebrity or real-person likenesses, no text, no logos, no title, no microphone, no clapperboard, no rays, sparkles, underlines, crowns, or duplicate-looking faces.** Do not create separate portrait tiles; render one unified single scene.

### Prompt 07 — Family gathering

> Create **one horizontal 16:9, text-free editorial chapter illustration** for “Friends, Family & Community,” not a UI screen. Show **a fictional multigenerational Black family** in a lively but natural kitchen/dining room moment, with distinct adults and an older relative interacting across a table, one subtle playful reaction or shared laugh, genuine body language and grounded everyday objects. Avoid posed smiling-at-camera faces and exaggerated stereotypes. Arrange the main human interaction on the **right two-thirds** of the image, leaving legible **negative space in the left third** for a live UI title. Render as tactile **vintage screen print**, graphic shapes, high-quality 2–3-tone halftone faces, muted forest green/burnt red/ochre/cream palette and restrained paper grain. Treat the dining room with simplified graphical detail rather than photorealistic clutter. **No specific movie or celebrity likeness, no baked text, no quotation marks, no heart icons, no starburst/action strokes, no rays, no microphone, no popcorn, no film reels.** One image; 16:9 format.

### Prompt 08 — Friends in motion

> Generate **one widescreen 16:9 original editorial illustration**, text-free, for the Hearth film collection chapter “Friends, Family & Community.” Show **two or three fictional Black adult friends** in a lively spontaneous comic interaction, perhaps reacting to a funny story while walking outside a neighbourhood shop, with body language and different expressions that convey rapport. **Prioritize action within the scene, not decorative motion lines.** Use a composed side-to-side arrangement, with the group mostly on the **right half** and broad deep forest-green negative space on the left for UI typography. Visual style: heritage film-programme **screen print**, hand-inked crosshatch/halftone, aged but refined paper, bold cream/charcoal contours, burnt-red and muted ochre accent planes, visually consistent with Hearth's approved Black Comedy Excellence cover. Distinct fictional characters with no recognizable celebrity likenesses or references to particular films. **No title or other lettering, no rays, sparkle marks, fake speed/action streaks, microphones, crowns, or clapperboards.** Avoid collage; show a single cohesive moment.

**Decision test:** We are comparing the chapter's *narrative/visual motif*, not its title treatment. Review how each works as a shallow banner at **~320–448px screen width**, with a live heading over the open area. The selected idea may then be rendered at production resolution. Until chosen, keep all three exploratory images outside the production artwork directory.

## D. Validation / handoff checklist

- [ ] A specific asset type was selected first and concept variations are compared side by side.
- [ ] The rendered aspect ratio is correct (2:3 cover, 16:9 wide banner, 4:5 featured portrait, 1:1 supporting portrait).
- [ ] All text is live Hearth UI except the previously approved **2:3 cover** with baked title.
- [ ] Performer identity was explicitly selected and visually checked where real likenesses are intended.
- [ ] No generic celebrity-like face or unintended/irrelevant non-Black performer.
- [ ] Artwork remains expressive but simple, with no rays, action strokes, sparkle bursts or routine underline decoration.
- [ ] Subjects are safe to crop at phone widths; title area has adequate contrast.
- [ ] Source image/references, generation date, tool, prompt, consent/rights and export sizes documented in the asset provenance record.
- [ ] Film posters come from approved providers (e.g. TMDB), not generated in this workflow.
- [ ] Visual/UI concepts are not treated as production approval until reviewed in a 390px Hearth screen.

## E. Status

- **Approved direction:** Print Heritage colour/print style; 2:3 collection cover concept; original preferred text-free 16:9 hero composition; Comic Icons **editorial-hybrid page structure**.
- **Approved/fallback graphic:** microphone-led \`Comic Icons\` chapter identity.
- **Not decided:** exact people, final page fit, image copyright/provenance, film-level editorial content, all other chapters.
- **Next image round:** \`Friends, Family & Community\` chapter banners, three controlled concepts, and no other asset type.
