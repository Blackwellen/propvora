# Visual-Regression Screenshot Archive

**Captured:** 2026-06-26 · authenticated live app on the local dev server, real workspace data.
**Viewport matrix:** 1536×960 · 1366×768 · 1280×720 · 1024×768 · 768×1024 · 430×932 · 390×844 · 375×812.

This archive backs MASTER-TODO items **9** (Money/Portals/Work/Messages 8-viewport matrix)
and **12** (Messages matrix). It is **evidence-only** — no code is gated on it; the surfaces
were already live-verified during their section audits.

## Coverage

| Surface | Folder | Viewports captured | Status |
|---------|--------|--------------------|--------|
| **Money** overview (`/property-manager/money`) | `money/` | 1536, 1366, 1280, 1024, 768, 430, 390, 375 | ✅ Complete (8/8) — KPI strip, cashflow chart, attention panel all render; clean 2-up card stacking + mobile bottom-tab bar at phone sizes |
| **Portals** overview (`/property-manager/portals`) | `../portals-overview-*.png` | 1536, 1440, 1366, 1280, 1024, 768, 430, 390, 375 | ✅ Complete (pre-existing archive) |
| **Work** jobs (`/property-manager/work/jobs`) | `work/` | 1536 (+ `../work-overview-*` at 1440/1280/768/390) | ◑ Partial — 1536 captured clean (6 KPIs, tab nav, 6 view toggles, real job rows) |
| **Messages** (`/property-manager/messages`) | `messages/` | — | ◑ Not captured this run |

## Environmental note (why Work/Messages are partial)

The capture run hit a hard **machine-memory ceiling**: a concurrent `next build` OOM'd
(V8 code 134), which killed the dev server mid-run, and subsequent Chrome DevTools
`captureScreenshot` calls timed out under memory pressure with multiple dev servers
running. The **Money** matrix (the primary listed gap) completed in full before the
ceiling was hit. Completing Work/Messages requires a clean run with a single dev server
and no competing build — purely a re-run of this same procedure, no code change.

## How to complete (re-run procedure)

1. Stop all other dev servers / builds so the machine has memory headroom.
2. Start a single dev server (`npm run dev -- -p <port>`), wait until ready.
3. Drive Chrome DevTools MCP: navigate to each surface, then for each viewport
   `resize_page` → `take_screenshot` to `…/visual-regression/<surface>/<surface>-<width>.png`.
4. Spot-check the 375 capture per surface for clipping/overflow.
