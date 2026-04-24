# Collections Redesign Specification

## Overview
Collections are moving from the Library (Shelf view) to become a **special, curated section in the Tonight view** with a custom landscape-style card design and dedicated modal.

## Core Concept

### Philosophy
Collections are fundamentally different from typical library organization. They represent intentional groupings (e.g., "Star Wars saga", "Marvel Cinematic Universe") and deserve special treatment as a discovery mechanism, not just another way to organize watched/unwatched content.

### Visual Hierarchy
- **Tonight View**: Collections get their own dedicated row/section (e.g., between Hero and Currently Watching)
- **Card Format**: Landscape-style cards (wider, shorter) instead of portrait-style
- **Interaction**: Click → Opens modal with full collection details
- **Scope**: Collections appear **only** in Tonight view; removed from Library/Shelf view

## Design Details

### Collections Row in Tonight View
- **Position**: Dedicated row/section in the Tonight view grid
- **Title**: "Collections" or "Featured Collections" (TBD)
- **Layout**: Horizontal scrollable rail with landscape cards
- **Card Size**: Landscape aspect ratio (approx 16:9 or similar, TBD after design)
- **Content per card**:
  - Collection poster/backdrop (hero image)
  - Collection title
  - Item count badge (e.g., "5 films")
  - Optional: Year range (e.g., "1977–2024")
  - Optional: Progress indicator or watched count (minimal, defer design)
- **Behavior**: Hover/active states for selection and click feedback

### Collection Details Modal
- **Trigger**: Clicking a landscape collection card
- **Modal Content**:
  - Collection title and metadata (year range, total count)
  - Full list of items in the collection (all movies, in sort order)
  - Each item displayed as a compact card or list row
  - Watched status indicator (minimal or optional for MVP)
  - Click on any item → Opens item details modal (existing ItemDetailsModal)
- **Modal Type**: Similar to ItemDetailsModal pattern; could be a new CollectionDetailsModal component
- **Dismissal**: Close button, background click, ESC key

## Implementation Approach

### Data Flow
1. **buildCollectionRollups** (collections.js) - Already correctly calculates watched/total counts
2. **Tonight View** - Render new Collections section using existing collection data
3. **New Component**: Create landscape-style CollectionCardLandscape component
4. **New Modal**: Create or adapt CollectionDetailsModal to show full collection contents
5. **Shelf View** - Remove collection cards from Library/Shelf view entirely

### Components to Create/Modify
- `CollectionCardLandscape.jsx` - Landscape card for the row
- `CollectionDetailsModal.jsx` - Modal showing full collection with items
- `TonightView.jsx` - Add Collections section/row
- `ShelfView.jsx` - Remove collection display
- `collections.js` - No changes needed (logic is correct)

### Styling Considerations
- Use landscape aspect ratio (wider than tall)
- Maintain visual consistency with Tonight view aesthetic
- Include backdrop/poster as hero image with gradient overlay
- Title and metadata overlay (bottom or top)
- Ensure readability and touch target sizing (minimum 44x44px for buttons)

## Open Questions / Deferred Decisions
- Exact landscape aspect ratio (16:9, 2:1, 3:1?)
- Card size and spacing in the row
- Title of the row ("Collections", "Featured Collections", "Curated Collections"?)
- Watched status indicator style (checkmark, progress bar, text, omitted?)
- Sort order of collections (by date added, alphabetical, custom?)
- Should collections be pinned/ordered, or auto-generated?
- How many collections to show in the row (all vs. first N)?

## Benefits
- **Visual Clarity**: Collections are special, not buried in Library
- **Discovery**: Makes collections a prominent, curated experience
- **Reduced Cognitive Load**: Library focuses on watched/unwatched/later; Collections are separate
- **Better UX**: Landscape cards are better for browsing at a glance vs. portrait cards
- **Intentional Design**: Collections become a featured, intentional part of the Tonight discovery flow

## Migration Path
1. Build CollectionCardLandscape component and test
2. Build CollectionDetailsModal
3. Add Collections row to TonightView
4. Remove collections from ShelfView
5. QA full flow end-to-end
6. Consider: Collection pinning/ordering UI if needed
