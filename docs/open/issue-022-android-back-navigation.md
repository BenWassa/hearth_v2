# Issue #22 — Android / Pixel back navigation

## Status

Implementation in progress on `fix/android-back-navigation`.

## Problem

Hearth currently changes top-level screens with React state only. Android/Pixel system back therefore has no Hearth history entry to consume and can leave the installed PWA/browser immediately.

## Intended behavior

- Back from Add, Shelf, or Decision returns to the previous Hearth screen.
- Multi-screen navigation unwinds in order.
- Once Hearth reaches its root screen (Tonight, or Onboarding when signed out), another system back is left to the browser/OS so the app can exit normally.
- Existing in-app Back/Close controls use the same history stack.
- Demo/template mode and the Firebase-backed app behave consistently.

## Implementation

A shared `useViewHistory` hook wraps Hearth's existing `view` state:

- `history.replaceState` establishes the root entry.
- `history.pushState` records non-root screen transitions.
- `popstate` synchronizes React state when Android/browser back occurs.
- Returning programmatically to a root view collapses Hearth's internal history.
- Restoring a non-root view creates a root entry behind it when no Hearth history state exists.
- `goBack()` is used by top-level Back/Close controls.

This keeps the current architecture and avoids introducing React Router solely for four top-level screens.

## Scope delivered

- Tonight
- Shelf
- Add
- Decision
- Firebase-backed state
- Template/demo state
- Unit coverage for baseline, push, pop, and back delegation

## Deferred / follow-up assessment

Modal-specific back behavior remains separate from this issue unless manual QA shows it is required for a coherent Pixel experience. Candidates include Import, Space Switcher, Item Details, and nested sheets.

## Manual QA

Verify on a Pixel or Android emulator/device using gesture navigation:

1. Launch on Tonight.
2. Open Shelf, then Add.
3. Swipe back: Add → Shelf.
4. Swipe back: Shelf → Tonight.
5. Swipe back once more: Hearth should not trap the event; the OS/browser may leave/exit.
6. Open Decision from Tonight and swipe back to Tonight.
7. Repeat using visible in-app Back/Close controls.
8. Reload while on a non-root screen and confirm the first back returns to Tonight.
9. Repeat in demo/template mode.
