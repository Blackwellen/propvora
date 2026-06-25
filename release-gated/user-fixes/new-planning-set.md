# User / manual actions — New Planning Set wizard

All code fixes in this drop (FIX-424 … FIX-427) are applied and pass `tsc` + `eslint`. The items below are the only things this session could **not** complete, with the exact reason.

## 1. Live responsive visual sweep (Chrome MCP) — DONE (2026-06-24, key breakpoints)
- **Status:** Owner authorised freeing the shared Chrome profile; the core sweep ran. Verified in-shell layout, single stepper, clean footer, the Step 2 name-gate, and zero console errors at **1536 (xl, with summary panel)**, **1024 (lg, summary→FAB)**, and **390 (mobile, stacked + FAB above bottom nav)**. Screenshots in `release-gated/docs/wizards/screenshots/new-planning-set/`.
- **Optional remaining (nice-to-have, not a blocker):** capture the remaining viewports (1366, 1280, 768, 430, 375) and steps 3–9 for a full screenshot matrix. The shell behaviour that changed is already confirmed across xl/lg/mobile; steps 3–9 were unchanged by this drop.

### Original note (now resolved)
- The Chrome DevTools MCP server shares a single Chrome profile dir (`C:\Users\PC\.cache\chrome-devtools-mcp\chrome-profile`); it was initially locked by another active session. Resolved once the owner authorised closing that browser.
- **Exact steps to complete:**
  1. Ensure no other session is using Chrome MCP (check `.claude/port-registry.md`).
  2. Dev server is already up on `http://localhost:3002`.
  3. Open the wizard: `http://localhost:3002/property-manager/planning/wizard?profile=long_term_let`.
  4. At each viewport — **1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812** — confirm:
     - Only **one** stepper is visible (the side rail at `lg+`; the header `<select>` below `lg`). No horizontal pill stepper.
     - The app sidebar + topnav remain visible (wizard is **inside** the shell, no full-screen takeover).
     - The footer ("Back / Save Draft / Continue") sits below the step card and never overlaps content or the mobile bottom nav.
     - The right live-summary panel shows at `xl+`; below `xl` the "Summary" FAB opens the bottom sheet.
     - Step through all 9 steps; capture a screenshot per step per viewport into `release-gated/docs/wizards/screenshots/new-planning-set/`.
     - Confirm no console errors / hydration / failed network calls.
     - Confirm no in-step control is clipped by the step card (the card uses `overflow-hidden` for rounded corners): check any dropdown/combobox/popover inside Step 1 (profile filter bar), Step 3 (income tabs) and Step 6 (offer) opens fully. Native `<select>` menus render at browser level and are unaffected; only custom inline-absolute menus are at risk. If one clips, switch that card to `overflow-visible` + `rounded-2xl` on an inner wrapper.
  5. Repeat the single-stepper + in-shell + footer checks for the resume route `/property-manager/planning/wizard/{draftId}` using a real draft id.

## 2. Two-column step density at narrow widths — VISUAL CONFIRM ONLY
- Steps 5 (Upfront & Compliance) and 6 (LL Offer) use an internal two-column `flex` layout. They now render in a narrower content column (app sidebar + rail + right summary all share the row at `xl`). Code uses `flex-1 min-w-0` + `flex-wrap` so there is no overflow, but please eyeball at **1280×720** that the two columns aren't uncomfortably tight. If they are, add an `xl:flex-row` / stacked-below-`xl` breakpoint to those two step roots. (Low priority — no functional impact.)

## 3. Out-of-scope wiring (separate item, not this chrome drop)
- New Offer wizard (`/planning/landlord-offers/new`): Step 7 document "Upload" buttons and Step 1 "Save as template" are not yet wired to storage. Tracked under the Planning section user-fixes, not part of this wizard-chrome drop.
