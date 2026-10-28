# Issue 39: Recently removed

Only Shelf bulk deletion uses soft removal. Single-title deletion, memory removal
and space wiping permanently delete documents. Wipe enumerates the entire
watchlist, including removed documents. No rules changes.

Removal retains all household state and adds a server timestamp `removedAt`,
`removedBy`, and a hydrated `removedItem` display snapshot. The subscription
excludes removed documents before catalog reads and supplies them separately.
Pending timestamps use estimates for display only.

Either household member can restore within 24 hours by the viewing device's clock.
After 24 hours the title is hidden and cannot be restored. Cleanup permanently
deletes retained documents only after seven days, protecting against clocks up to
approximately six days ahead. Pending or estimated timestamps never trigger hard
deletion. Cleanup requires an online member; there is no server scheduler or
rules-enforced cleanup. Failed cleanup is retried on subscription load, list
opening and each minute.

Each remove, restore and purge uses its own transaction with per-title outcomes
and isolated failures. Restore clears removal markers on the current retained
document, preserving all current household state regardless of catalog churn.
It rejects missing, active or expired documents. Re-adding through Add or import
uses transactional restore and reports “Brought back from Recently removed”;
incoming notes, progress and ownership never overwrite retained state.

Template mode follows the same policies in memory and refuses restoration if an
active equivalent already exists. Refresh resets the template session.
Maintenance scripts skip removed watchlist documents. Tests mock Firebase; no
live credentials or emulator are required.
