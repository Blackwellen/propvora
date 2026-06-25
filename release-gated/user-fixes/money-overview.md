# Money Overview — Pending Manual / User Actions

Section: `/property-manager/money` · Audited 2026-06-24

## Status: NO outstanding Money-specific actions.

The full 8-viewport Chrome DevTools MCP visual pass was **completed** (authenticated,
live data, 0 console errors) after clearing a deadlocked MCP browser state — see
`release-gated/docs/money-overview.md` §9 and screenshots in
`release-gated/docs/screenshots/money-overview/`. All four defects found (loading
skeleton, tab-strip overlap, double header, and the owner-reported accounting
feature-flag dead links) are fixed in code and live-verified.

## Informational only (not a Money item, not blocking)

- A full `npm run build` currently fails on **4 TypeScript errors in
  `src/app/(app)/app/contacts/[id]/page.tsx`** — these belong to a *concurrent
  session's* in-flight Contacts work, not to Money. All Money / feature-flag files
  in this drop are `tsc`-clean (verified by filtering the type-check output). Re-run
  `npm run build` once the Contacts session lands its fix; no action needed from the
  Money side.

- Feature-flag dual-state: the flag-OFF state (`accountingGl` off) is live-verified.
  To eyeball the flag-ON state, set `NEXT_PUBLIC_QA_ALL_FLAGS=true` (or enable
  `accountingGl` for the workspace) and reload — the Accounting `ActionMenu` item,
  footer line, and right-rail card reappear. The code path is symmetric
  (`accountingEnabled && …`), so this is confirmation-only.
