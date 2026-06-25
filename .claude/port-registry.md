# Propvora Session Port Registry

**Purpose:** Tracks which dev server and Chrome MCP ports are claimed by each active Claude Code session.  
**Rule:** Read this file before starting any dev server or Chrome MCP. Never use a port already marked `active`.  
**Stale rule:** Entries older than 4 hours with no update are stale — remove and reclaim the port.

---

## Active Port Claims

| Session description | Dev port | Chrome port | Claimed at | Status |
|---|---|---|---|---|
| money-detail-qa (invoice/bill/arrears/deposit/dispute) | 3004 | 9222 | 2026-06-25 | active |
| automations-section-qa | 3004 (shared) | 9225 | 2026-06-25 | active |
| compliance-wizards-qa | 3004 (shared) | 9226 | 2026-06-25 | active |

---

## Port Ranges

| Resource | Range | Default (if registry empty) |
|---|---|---|
| `next dev` server | 3001 – 3019 | 3001 |
| Chrome MCP `--remote-debugging-port` | 9222 – 9240 | 9222 |

---

## How to add your entry (start of session)

1. Read this file.
2. Pick the lowest unclaimed port in each range.
3. Replace the `_(no active sessions)_` row (or add a new row) with your claim.
4. Start servers on your claimed ports.

Example row:
```
| qa-audit-planning (session xyz) | 3002 | 9223 | 2026-06-23 15:00 | active |
```

## How to remove your entry (end of session)

Delete your row. If the table is now empty, restore the placeholder row:
```
| _(no active sessions)_ | — | — | — | — |
```
