---
name: Hearth
description: A calm, shared watchlist for couples, lit like a living room at night.
colors:
  ember-amber: "#d97706"
  ember-amber-bright: "#f59e0b"
  glow-amber: "#fbbf24"
  hearth-ash: "#fde68a"
  shell-black: "#0c0a09"
  soot: "#1c1917"
  charcoal: "#292524"
  cinder: "#44403c"
  ash-grey: "#78716c"
  smoke: "#a8a29e"
  parchment: "#d6d3d1"
  bone: "#f5f5f4"
  energy-light: "#38bdf8"
  energy-focused: "#f87171"
typography:
  display:
    fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
    fontSize: "clamp(1.875rem, 4vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.35
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.1em"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ember-amber}"
    textColor: "{colors.soot}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.ember-amber-bright}"
  button-secondary:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-secondary-hover:
    backgroundColor: "{colors.cinder}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.parchment}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-ghost-hover:
    textColor: "{colors.glow-amber}"
  input-field:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.bone}"
    typography: "{typography.title}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: Hearth

## 1. Overview

**Creative North Star: "The Lamp-Lit Living Room"**

Hearth is a dark, warm room with one source of light. The shell is a near-black with a trace of brown (`shell-black`), and everything else is lit from within: poster and backdrop artwork supplies the drama, and a single amber accent plays the role of the lamp. The interface chrome stays low and quiet so two people on a couch can look at titles, not at controls. This is a product surface that serves one job, choosing tonight's watch, and the visual system exists to lower the friction of that choice.

Density is moderate and finite. A shelf, a short Tonight tray, one suggestion. Layering is tonal, built from the stone ramp (soot, charcoal, cinder) with translucent overlays where artwork sits behind text. Corners are soft and generous, presses give a small physical response, and serif titles give the app the feel of a film programme rather than a control panel. Streaming-service fluency is borrowed (poster-forward, cinematic backdrops, horizontal rails) but never its engagement machinery.

The system rejects what PRODUCT.md rejects: gamified or social apps, generic dark SaaS dashboards (cold blue-grey panels, glass cards, gradient accents), and algorithmic recommenders (match percentages, ranked and explained suggestions).

**Key Characteristics:**
- Near-black warm shell; amber as the only brand accent.
- Serif titles over a system sans body; tiny uppercase tracked labels for metadata.
- Soft, large radii (12px controls, 16px to 24px containers, full pills for chips).
- Artwork-first: posters and backdrops are the saturated element, chrome recedes.
- Tonal depth first, shadow second; blur only where text must sit on artwork.
- Dim-room comfort: no pure black, no pure white, no glare.

## 2. Colors

A restrained palette: tinted warm neutrals carry the surface and one amber voice carries action, progress and emphasis.

### Primary
- **Ember Amber** (#d97706, Tailwind amber-600): the primary action fill, paired with dark `soot` text. Used for the one main call to action on a surface.
- **Bright Ember** (#f59e0b, amber-500): hover state of primary, progress bars, timing numerals, active icons.
- **Glow Amber** (#fbbf24, amber-400): text-level emphasis, ghost button hover, the "balanced" energy chip, small highlights.
- **Hearth Ash** (#fde68a, amber-200): rare soft highlight text on dark amber-tinted panels. Amber also appears as translucent washes (`amber-500/10` to `/30`, `amber-900/20` to `/50`) for selected, focused and "currently watching" states.

### Secondary
- **Light Sky** (#38bdf8, sky-400): the "light" energy chip only.
- **Focused Red** (#f87171, red-400): the "focused" energy chip, and danger text and borders (`red-900/20` to `/40` fills).

### Neutral
- **Shell Black** (#0c0a09, stone-950): the app shell, `theme-color`, and everything behind the notch, home indicator and overscroll gutter. Also the end stop of backdrop vignettes.
- **Soot** (#1c1917, stone-900): panels, cards and modal surfaces, often at 40% to 90% opacity over artwork.
- **Charcoal** (#292524, stone-800): inputs, secondary buttons, raised chips.
- **Cinder** (#44403c, stone-700): borders, dividers, secondary-button hover.
- **Ash Grey** (#78716c, stone-500): tertiary text and inactive icons; the lowest allowed text contrast on Soot for non-essential metadata.
- **Smoke** (#a8a29e, stone-400): placeholder and secondary body text.
- **Parchment** (#d6d3d1, stone-300): default body and button text.
- **Bone** (#f5f5f4, stone-100): titles and input text; the brightest text in the app.

### Named Rules
**The One Lamp Rule.** Amber is the only brand hue. On any screen it marks the primary action and the current state, nothing else. Its rarity is what makes it read as warmth.

**The Warm Neutral Rule.** Every grey is a stone (warm-tinted). Pure `#000` and `#fff` are forbidden; text tops out at Bone and the floor is Shell Black.

**The Energy Code Rule.** Sky, amber and red appear together only as the light / balanced / focused energy indicator, always with a text label, never as color alone.

## 3. Typography

**Display Font:** the platform serif (`ui-serif`, Georgia, Cambria, Times) for all titles, names and the search input.
**Body Font:** the system sans stack (`-apple-system`, `BlinkMacSystemFont`, Segoe UI, Roboto, Helvetica Neue).
**Label/Mono Font:** the platform monospace, only for season and episode numerals and timing figures.

**Character:** A film programme set on a phone. Serif gives titles a human, literary warmth; the system sans keeps metadata and controls native and quiet. No webfonts are loaded, so type is instant and matches the device.

### Hierarchy
- **Display** (serif, 400, `clamp(1.875rem, 4vw, 3rem)`, 1.2, tracking -0.025em): the title block of a details modal over its backdrop.
- **Headline** (serif, 400, 1.5rem to 1.875rem, 1.2): collection and modal headings.
- **Title** (serif, 400, 1.125rem, 1.35): card titles, list rows, the search input.
- **Body** (sans, 400, 0.875rem, 1.5): descriptions and supporting copy; cap at 65ch to 75ch.
- **Label** (sans, 700, 0.625rem to 0.6875rem, tracking 0.1em to 0.15em, uppercase): metadata, status, section eyebrows. Mono at the same size for numerals.

### Named Rules
**The Serif Names Things Rule.** Serif is for things with names (titles, collections, the space). Sans is for things that describe or act (metadata, buttons, helper text).

**The Small Caps Eyebrow Rule.** Section eyebrows are 10px to 11px, bold, uppercase, widely tracked. They label; they never carry primary information. Anything a user must read to decide goes at 14px or larger.

## 4. Elevation

Depth is tonal first. Surfaces step up the stone ramp (Shell Black, Soot, Charcoal, Cinder) and rely on 1px borders in Cinder or translucent stone rather than heavy shadow. Shadows exist as warm ambient lift on the primary action and as deep, soft shadows under modals and floating artwork. Blur is permitted only where text or controls must stay legible over a poster or backdrop, and it is always paired with a dark translucent fill.

### Shadow Vocabulary
- **Lamp glow** (`box-shadow: 0 10px 15px -3px rgba(120, 53, 15, 0.2)`, amber-900 at 20%): under the primary button; a warm lift, not a drop.
- **Card lift** (`shadow-lg`, black-tinted): poster cards and rails.
- **Modal depth** (`shadow-2xl`, black-tinted): details modals and the space switcher.
- **Title scrim** (`drop-shadow(0 2px 10px rgba(0, 0, 0, 0.6))`): serif titles set directly over backdrop art.
- **Vignette** (radial gradient from transparent to `rgba(12, 10, 9, 0.8)` to Shell Black): backdrops fade into the shell instead of ending in an edge.

### Named Rules
**The Dim Room Rule.** Surfaces are flat at rest; lift and glow answer state or float above artwork. If a shadow is visible against Shell Black as a grey halo, it is too light; use black or warm amber-900 only.

**The Functional Blur Rule.** Backdrop blur is a legibility device over imagery, never decoration. A blurred panel on a plain Shell Black background is wrong.

## 5. Components

Soft and tactile: generous radii, a physical press, warm hover shifts. Nothing snaps; transitions run 200ms to 300ms with ease-out.

### Buttons
- **Shape:** gently curved (12px radius), 24px by 12px padding, label centered with 8px icon gap.
- **Primary:** Ember Amber fill, Soot text, warm Lamp glow shadow. Hover brightens to Bright Ember.
- **Secondary:** Charcoal fill, Parchment text, 1px Cinder border. Hover lifts to Cinder.
- **Ghost:** transparent, Parchment text; hover shifts text to Glow Amber.
- **Danger:** `red-900/20` fill, red-400 text, `red-900/30` border; hover deepens the fill.
- **Glass:** `stone-900/60` fill with backdrop blur and a Charcoal border, for controls floating over artwork only.
- **Press / Disabled:** `active:scale-95` on every variant; disabled drops to 50% opacity with a not-allowed cursor.

### Chips
- **Style:** full pill, 10px to 11px bold uppercase label, tracked.
- **State:** energy chips use a solid 400-level fill (sky, amber, red) with the matching 950 text; status and filter chips use translucent stone or amber washes. Selected = amber wash (`amber-500/10` to `/20`) with an amber border.

### Cards / Containers
- **Corner Style:** poster cards 12px; panels and modals 16px to 24px.
- **Background:** Soot at 40% to 90% opacity; poster art fills the card, with a bottom scrim for text.
- **Shadow Strategy:** Card lift at rest, Modal depth for overlays (see Elevation).
- **Border:** 1px Cinder or `stone-800/60`; none on poster art.
- **Internal Padding:** 16px to 24px, varied by content density.
- **Energy band:** a 4px band across the top of each poster in the energy color (sky, amber or red), always backed by an energy label elsewhere on the card.
- **Progress:** TV progress is a 6px Bright Ember bar with a soft amber glow along the poster base, on a translucent Shell Black track; watched titles gain a check, not a color change alone.

### Inputs / Fields
- **Style:** `stone-800/50` fill, 1px Cinder border, 12px radius, 16px padding, serif 18px text in Bone, placeholder in Smoke.
- **Focus:** no outline; a 2px `amber-900/50` ring plus an `amber-700/50` border. Warm, visible, never blue.
- **Error / Disabled:** errors use the danger red treatment with text; disabled follows the button rule.

### Navigation
- **Style:** a floating bottom dock (Add, Tonight, Library): centered, max 448px wide, 24px radius, `stone-900/40` fill with heavy backdrop blur, 1px `stone-700/50` border and a deep black shadow. It floats over scrolling posters, which is the legitimate use of blur. Each item is an icon over a 12px bold label; idle icons are Parchment/Smoke and shift to Glow Amber on hover. The current page is an inert amber wash (`amber-500/10` fill, `amber-500/20` border, amber-400 icon, amber-300 label).
- **Mobile treatment:** primary target. Controls reach 44px; the dock sits 24px plus `--safe-bottom` above the edge, and the shell paints black behind the notch and home indicator so the bezel reads as one surface.

### Tonight Hero (signature)
A rotating carousel of up to five cinematic backdrops fills the top of the Tonight view, vignetted into Shell Black, with the title (the title logo when one exists, otherwise serif type over a Title scrim) and a single primary action. Horizontal rails of poster cards sit beneath it. This is the one place the artwork is allowed to be large and loud.

### Motion
- Card entrances: 8px rise and fade, 420ms, `cubic-bezier(0.25, 1, 0.5, 1)`, staggered lightly.
- State transitions: 200ms to 300ms ease-out on color, opacity and transform; never on layout properties.
- `prefers-reduced-motion: reduce` removes entrance animation entirely.

## 6. Do's and Don'ts

### Do:
- **Do** let poster and backdrop artwork be the saturated element; keep chrome in stone neutrals.
- **Do** use Ember Amber (#d97706) for exactly one primary action per surface, with Soot (#1c1917) text.
- **Do** tint every neutral warm (the stone ramp); end at Bone (#f5f5f4) and Shell Black (#0c0a09).
- **Do** set titles in serif and metadata in sans; keep eyebrows uppercase and tracked, but never smaller than needed to stay legible.
- **Do** pair every color-coded state (energy, watched, in progress) with a label or icon.
- **Do** paint the shell Shell Black behind notches and overscroll, and add `--safe-*` insets to fixed bars.
- **Do** honor `prefers-reduced-motion` on any new animation, and animate transform and opacity only.

### Don't:
- **Don't** build a gamified or social app: no streaks, badges, feeds, leaderboards, counters that apply pressure, or notification nags.
- **Don't** drift into a generic dark SaaS dashboard: no cold blue-grey panels, no glass cards, no gradient accents or gradient text.
- **Don't** show algorithmic recommender patterns: no match percentages, no "because you watched", no ranked or explained suggestions.
- **Don't** use blur or translucency on plain backgrounds; it is only for legibility over artwork.
- **Don't** use `#000` or `#fff`, or introduce a second brand hue beside amber.
- **Don't** add `border-left` or `border-right` wider than 1px as a colored accent on cards, rows or callouts.
- **Don't** create endless rows, autoplay or infinite scroll; the shelf is finite on purpose.
- **Don't** nest cards inside cards, or wrap content in a container when spacing would do.
- **Don't** use em dashes in interface copy.
