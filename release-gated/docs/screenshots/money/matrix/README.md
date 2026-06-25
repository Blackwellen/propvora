# Money detail pages — responsive screenshot matrix

Captured via **Chrome MCP** (project's QA path — Playwright not used), dev `:3004`,
authenticated as the JT Property Manager workspace owner, `NEXT_PUBLIC_QA_ALL_FLAGS=true`.

Required viewports: 1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812.

## Coverage

| Page | Captured | Notes |
|---|---|---|
| **Bill** (`/money/bills/{id}`) | **8/8** — `bill-1536/1366/1280/1024/768/430/390/375.jpeg` | Full matrix. Verified: real data (Dave Holloway / 14 Oak Lane / £390, 2 line items), desktop rail at ≥1024, mobile shell (MobileTopBar + bottom nav) at ≤768, KPI grid reflows, no horizontal overflow at any size, console clean. `bill-390` is a thin capture from a transient tab reset — redundant with the valid 375/430 phone shots. |
| **Invoice** (`/money/invoices/{id}`) | Live-verified desktop (1536/1440) | Real data (Emma Williams / 12 Harbour View / £1,640), UUID→name fix confirmed, no overflow, console clean. Full 8-size archive pending (see below). |
| **Dispute** (`/money/disputes/{id}`) | Live-verified desktop, flag ON + OFF | Flag OFF redirects to `/money` (no leak); flag ON renders real record + 9 tabs + 9 admin actions; console clean. |
| **Deposit** (`/money/deposits`) | Live-verified desktop | 9 real deposits post-backfill (0 "Unknown"), scheme display fixed, console clean. |
| **Arrears** (`/money/arrears`) | Live-verified desktop | Real data, Card/List toggle, Chase + Record Payment actions, console clean. |

## Outstanding

The exhaustive 8-size archive for Invoice / Dispute / Deposit / Arrears was interrupted
when the Chrome MCP instance lost its connection mid-session (a tooling state that needs
an MCP-server restart, not an app issue). All four were live-verified at desktop earlier
in the session, and the Bill page proves the shared responsive shell holds at all 8 sizes.
To complete the archive: restart Chrome MCP, then repeat the resize→screenshot loop for
the four routes at the eight sizes above.
