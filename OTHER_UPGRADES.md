# Other Upgrades

This file captures the broader upgrade ideas for the app beyond collections. See `COLLECTIONS_REDESIGN.md` for the collection redesign work and how it connects to these higher-level ideas.

## 1. Currently Watching UX

- Add a very specific hide/show control for items in `Currently Watching`.
- The button should only appear when the user is inside `TonightView`, not in a library or other view.
- Use a minimal eye icon (open/closed) to indicate visibility.
- Include a short label next to it to make the action clear, such as:
  - `visible in currently watching`
  - or `click to hide` depending on the final wording choice.
- The label should reflect the current state of the icon: open eye means visible, closed eye means hidden.
- This should feel lightweight and stay focused on the current watching experience.

## 2. Row categorization and duplicate handling

- We need better logic for row selection and deduplication.
- Some rows should not repeat across the interface:
  - `Deep Dives`
  - `Need a Laugh`
  - `Spectacles`
  - `The Classics`
- Other rows such as `Quick Bites`, `Easy and Comforting`, and `Need a Laugh` may have more flexible overlap, but duplicates still need control.
- `Quick Bites` should focus on shorter content, ideally under 30 minutes.
- `Deep Dives` should represent the strongest vibe, longer runtime, and more gripping or focused titles.
- `Easy and Comforting` is currently generic and may need refinement or clearer definition.
- We should avoid one super-long row for all gripping content and instead break gripping/focused content into more useful splits.

## 3. Dynamic row strategy

- We should think in terms of multiple dimensions, not just one row type.
- Suggested axes:
  - energy vs vibe
  - genre (primary, possibly secondary)
- Gathering data about natural groupings will help us decide which rows should appear together.
- Existing meaningful categories should remain, especially:
  - `Deep Dives`
  - `Need a Laugh`
- `Deep Dives` is a strong concept and should remain a priority because it conveys mood and expectation.
- Consider using runtime, tone, and genre together to create clearer, more intuitive playlist rows.

## 4. Tonight View card sizing and layout

- Re-evaluate card sizes across `TonightView`, `Library`, and `Memories`.
- `Currently Watching` size feels right and should likely stay as-is, fitting three cards comfortably.
- `Deep Dives`, `Spectacles`, and `Classics` may not need to be super large.
- Showing three cards per row feels like a good balance between visual clarity and information density.
- Consider smaller card layouts for collections, potentially using landscape cover cards to break up the visual flow.
- The library and memories sections are currently too large; those should follow the same compact sizing strategy.
- This is a strategic evaluation item, not a quick one-off fix.

## 5. Accessibility and contrast

- Review text contrast throughout the app.
- Some copy does not have strong enough contrast and could be cleaned up for better readability.
- This should be part of a broader accessibility pass.

## 6. Naming and branding for TonightView

- Reconsider whether `TonightView` is the best name.
- The current concept works well with a dark mode, evening vibe, and the notion of watching later.
- But it may feel limiting if users want to watch in the afternoon or at other times.
- Evaluate whether the name should stay, evolve, or be replaced for better clarity.

## 7. Bottom menu actions and iconography

- Re-evaluate the icons for `Add to Night` and `Library`.
- Ask whether the bottom menu is the best interface for these actions.
- Consider whether a fully immersive mode without a persistent bottom menu could work better.
- The current up/down scroll inside `TonightView` is a useful navigation pattern and seems worth keeping.

## 8. Swipe gestures and mobile interactions

- Explore swipe gestures for Pixel and Android-style devices.
- Potential gestures:
  - swipe from `TonightView` to the sides to open `Add` or `Library`
  - swipe within modals for back navigation
- Need to investigate how side-swipe behavior interacts with native device navigation gestures.
- This may require platform-specific engineering and careful gesture handling.

## 9. Splash screen and icon polish

- Improve the app splash experience with a dark-mode splash and icon.
- The current splash feels too light compared to the app's dark UI.
- Consider creating a richer animated splash or dark-mode branded entrance.
- Possible idea: use an image generation or animation tool to create a polished splash video or motion graphic.

## 10. Relationship to collections work

- Reference `COLLECTIONS_REDESIGN.md` for collection-specific research and layout improvements.
- The work in this file should complement collection redesign efforts with broader UX, layout, naming, and interaction strategy.

---

### Notes

- This file is intended as a planning and strategy document.
- It is a companion to `COLLECTIONS_REDESIGN.md`, not a replacement.
- The goal is to keep upgrades organized, actionable, and easy to revisit.
