# Propvora Session Port Registry

**Purpose:** Tracks which dev server and Chrome MCP ports are claimed by each active Claude Code session.  
**Rule:** Read this file before starting any dev server or Chrome MCP. Never use a port already marked `active`.  
**Stale rule:** Entries older than 4 hours with no update are stale — remove and reclaim the port.

---

## Active Port Claims

| Session description | Dev port | Chrome port | Claimed at | Status |
|---|---|---|---|---|
| admin-dashboard-final-qa (session-adminfinalqa) | 3008 | 9222 | 2026-06-26 10:15 | active |
| master-todo-audit (session-wsqa2) | 3006 | 9223 | 2026-06-26 18:00 | active |
| automations-section7-audit (session-auto7) | 3010 | 9228 | 2026-06-26 19:00 | active |
| i18n-marketing-wire (session-i18nwire) | 3003 | 9229 | 2026-06-26 19:30 | active |
| marketing-finality-landing-features-seo (session-mktgfinal) | 3005 | 9226 | 2026-06-27 13:00 | active |

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
