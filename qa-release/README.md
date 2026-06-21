# Propvora Release QA System

This directory is the **single source of truth** for all release QA, browser testing, implementation tracking, scoring and release readiness decisions for Propvora.

## Rule

**No route, page, component, wizard, upload or section is release-ready until it has a row in the relevant section score file with a score of 5 or a documented external blocker.**

Every code change must update the matching file here.

## Files

| File | Purpose |
|---|---|
| `README.md` | This file — orientation and rules |
| `master-scoreboard.md` | Overall scores by product area |
| `route-registry.md` | Every discovered route with auth/role/workspace metadata |
| `task-list-atomic-600.md` | 600+ atomic checkbox tasks covering every finite surface |
| `pwa-pages.md` | PWA/mobile-specific issues and rebuild requirements |
| `seed-data-log.md` | All seed data added and where |
| `browser-qa-log.md` | Running browser test log across all screen sizes |
| `implementation-fix-log.md` | All bugs found and fixed |
| `security-qa-log.md` | Security checks and results |
| `upload-qa-log.md` | All upload flows tested |
| `wizard-qa-log.md` | All wizards completed and tested |
| `duplicated-redundant-surfaces.md` | Duplicate/redundant UI surfaces |
| `release-blockers.md` | All P0/P1/P2 release blockers |
| `release-readiness-final-report.md` | Final go/no-go release report |
| `sections/01-property-manager-workspace.md` | PM workspace detailed score matrix |
| `sections/02-supplier-solo-workspace.md` | Supplier solo workspace score matrix |
| `sections/03-supplier-team-workspace.md` | Supplier team workspace score matrix |
| `sections/04-customer-section-dashboard.md` | Customer workspace score matrix |
| `sections/05-tenant-portal.md` | Tenant portal score matrix |
| `sections/06-landlord-portal.md` | Landlord portal score matrix |
| `sections/07-supplier-portal.md` | Supplier portal score matrix |
| `sections/08-platform-admin-dashboard.md` | Admin dashboard score matrix |
| `sections/09-auth.md` | Auth flows score matrix |
| `sections/10-onboarding.md` | Onboarding score matrix |
| `sections/11-marketing-pages.md` | Marketing pages score matrix |

## Scoring System

| Score | Meaning |
|---|---|
| 5 | Release-grade / premium / no issue |
| 4 | Good but minor polish needed |
| 3 | Usable but not premium or responsive issues |
| 2 | Broken or incomplete but recoverable |
| 1 | Severe release blocker |
| 0 | Not built / inaccessible / cannot test |
| N/A | Genuinely not applicable |

## Status Values

- `PASS` — meets release bar
- `FIXED` — was broken, now fixed
- `NEEDS_FIX` — issue found, not yet fixed
- `PWA_REBUILD` — requires full mobile/PWA component rebuild
- `SECURITY_BLOCKER` — security issue blocking release
- `DATA_NEEDED` — requires seed data before testing
- `DUPLICATE_REMOVE_OR_MERGE` — redundant surface
- `REDUNDANT_REVIEW` — needs review for removal
- `BLOCKED_EXTERNAL` — blocked on founder/external action

## Screen Sizes

| Label | Viewport |
|---|---|
| LG Desktop | 1536×960 |
| Laptop | 1366×768 |
| SM Laptop | 1280×720 |
| Tablet L | 1024×768 |
| Tablet P | 768×1024 |
| Phone L | 430×932 |
| Phone M | 390×844 |
| Phone S | 375×812 |
| PWA | 390×844 standalone |

## Last Updated

2026-06-20 — Initial structure created. Route discovery and QA execution in progress.

---

## Addendum QA Categories

| File | Category | Description |
|------|----------|-------------|
| design-consistency-qa-log.md | Design | Shell width, header, breadcrumb, button, card, kanban, table, form consistency |
| ai-qa-log.md | AI | NVIDIA NIM, chat, streaming, caps, security, audit logs per workspace |
| automation-qa-log.md | Automations | All nodes: trigger/logic/action/AI/integration per workspace |
| settings-account-billing-profile-qa-log.md | Settings | Account, profile, workspace, billing for all workspace types |
| internationalization-currency-qa-log.md | i18n | Currency packs, locale packs, legal context, date/money formatting |
