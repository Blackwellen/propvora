# Work Section — Manual QA Items
**Date:** 2026-06-24

These items require a human to verify in a browser session since Chrome MCP was occupied by another concurrent session.

## Required Manual Checks

1. **Board drag-and-drop feel** — Open `/property-manager/work/board` on desktop and mobile. Drag a card between columns. Confirm movement is smooth and snappy (no jitter). Confirm the card snaps cleanly on drop. Confirm the ghost placeholder shows correctly in the source column.

2. **Tasks "Select All" removed** — Open `/property-manager/work/tasks`. Confirm there is NO standalone "Select All" button in the header action bar. Confirm the table header checkbox still selects all filtered tasks when ticked.

3. **PPM tab nav cleaned up** — Open `/property-manager/work/ppm/overview`. Confirm the PPM sub-tab nav shows exactly 3 tabs: Overview, Schedules, Timeline. Confirm "Suppliers" and "Reports" tabs are GONE. Confirm clicking all 3 tabs navigates correctly without 404.

4. **Suppliers "Generate Job" button** — Open `/property-manager/work/suppliers/preferred`. Confirm each supplier card shows "Generate Job" button (not "Assign to Job"). Confirm clicking it navigates to the job creation wizard pre-filled with the supplier ID. Confirm the right-rail panel shows a blue "Generate Job" CTA at the top.

5. **PPM view types** — Confirm PPM Schedules and Timeline pages load without errors and their content is correct.

6. **Tasks view types** — Switch through List → Card → Kanban → Calendar → Gantt → Map view types. Confirm each loads without page navigation (they are tab-internal views, not route changes).

## Not Blockers — Log Only

- Gantt view drag-to-reschedule not yet implemented (scope for V1.5)
- PPM Suppliers and Reports pages not yet built — removed from nav to avoid 404s
- Productivity Insights panel in Tasks right rail shows "—" until 7+ tasks are completed (by design)
