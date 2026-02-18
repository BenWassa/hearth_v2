# TV Progress QA Checklist

## Scope
- Show details modal season targeting
- Show episode next-up behavior
- Show details action bar CTA visibility

## Test Matrix
1. Partial progress resume
- Precondition: show has S2E1-S2E10, watched through S2E8
- Steps: open show details modal
- Expected: season selector opens on Season 2 and Episode 9 is marked next up

2. Cross-show switching
- Precondition: Show A currently on Season 2, Show B has different progress
- Steps: open Show A details, close, open Show B details
- Expected: Show B opens using Show B progress target and does not inherit Show A season

3. Fully watched show
- Precondition: all episodes watched in all seasons
- Steps: open show details modal
- Expected: latest season opens; latest episode is selected as the fallback focus target

4. Show action bar CTA removal
- Steps: open any show details modal
- Expected: bottom "Mark Watched"/"Back to Shelf" CTA is not rendered

5. Movie action bar CTA preserved
- Steps: open movie details modal
- Expected: bottom action bar still renders and status toggle works

## Devices
- Desktop viewport
- Mobile viewport
