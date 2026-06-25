# Manual actions — New Event Wizard

All wizard code fixes are applied, build-clean, DB-validated, and Chrome-MCP verified across all 8 viewports (see `release-gated/docs/wizards/new-event.md`). **No outstanding manual actions for this wizard.**

## Out of scope (separate RLS-tightening pass — not a blocker for this wizard)
`calendar_events` has two permissive INSERT policies that are OR'd: `calendar_events_workspace_insert` lets **any** workspace member insert, which bypasses the owner/admin/manager restriction in `calendar_events_insert`. Decide the intended create-permission for calendar events and drop/merge the looser policy. This does not affect this wizard's correctness or its release decision; logged here so it isn't lost.
