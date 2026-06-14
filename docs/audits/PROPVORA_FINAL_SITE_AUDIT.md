# PROPVORA — FINAL SITE AUDIT (master tracker)

**Owner:** Blackwellen Ltd (Propvora) · **Started:** 2026-06-14
**Scope:** real, browser-driven + code-backed final audit & completion across marketing,
auth, onboarding, /app, /admin, /portals, AI Copilot, settings, billing, uploads, mobile/
tablet, data alignment, security, DR, docs, tests. (Master prompt: "Final Audit, Release
Completion, Mobile/Tablet Rebuild & Full Click-Through QA".)

**Status key:** Not Started · In Progress · Built · Tested · Passed · Blocked(ext)
**This is layered ON TOP of the MAX-RELEASE programme** (`../release/PROP-VORA-MAX-RELEASE-TODO.md`),
much of which is already done — those items are not repeated here, only cross-referenced.

## Already done (carry-over from MAX-RELEASE — build-green, evidence on file)
Schema audit 0 · RLS 241/241 + isolation/IDOR test 20/20 · subscription gates 31/31 ·
webhook sig+idempotency+full events · security headers · upload hardening · app-side rate
limiting · audit-log coverage · cookie consent · maintenance mode + safe error pages ·
account deletion + SAR + erasure worker (gated) · account security + TOTP MFA · entitlement
service · changelog + announcements · newsletter · supplier ratings + tenant complaints ·
bug-catcher · admin ops views · WCAG first pass · legal entity corrected · SEO/robots/llms ·
Stripe Connect scaffold (flagged) · compliance pack (11 docs) · /api/health + /api/ready.

## Phase backlog (this programme)

| # | Phase | Section(s) | Sev | Status |
|---|-------|-----------|-----|--------|
| P1 | **Route / component / button / form inventory** → the 6 inventory docs | 1, 4, 7, 13 | High | Not Started |
| P2 | **Mobile/tablet responsive rebuild** — atom audit, responsive shells, card-lists, detail layouts, mobile nav + bottom nav, AI-bubble repositioning, no-h-scroll everywhere | 14 | **Critical** | Not Started |
| P3 | **Full click-through QA** — run E2E across viewports, fix every overflow/dead-button/empty-state found | 22, 4, 5, 6 | Critical | Scaffolded (e2e/) |
| P4 | **AI gateway / model abstraction** — providers, model routes, per-plan/6h/weekly limits, usage+cost tables, admin model switcher, approval flow, mobile AI bubble | 7 | High | Not Started |
| P5 | **Inbox / messages / notifications consolidation** — single messaging surface, real unread counts, mobile layout | 8 | Med | Partial (portal messaging done) |
| P6 | **Search / command palette** — global search across entities, workspace-scoped, mobile | 9 | Med | Not Started |
| P7 | **Duplication / redundancy / route cleanup** — one shell per context, merge dup settings/inbox/search | 16 | Med | Not Started |
| P8 | **Marketing final pass** — CTAs, mobile nav, SEO/OG/structured-data, pricing↔billing consistency | 2 | Med | Partial (SEO files done) |
| P9 | **Performance / Vercel readiness** — bundle, splitting, N+1, dashboards, caching | 18 | Med | Partial (readiness doc done) |
| P10 | **DR / failover / uptime docs + ops** | 19 | Med | Partial (DR + maintenance done) |
| P11 | **Integrations framework + HMRC MTD scaffold** (flagged) | 20 | Med | Blocked(ext) for HMRC |
| P12 | **Documentation set** — README, user/admin/portal/AI manuals, guides | 21 | Med | Partial (compliance/release docs done) |
| P13 | **Release readiness scorecard** (per-area /100) | 23 | — | Started (this doc + scorecard) |

## Audit docs to produce (master prompt §1)
PROPVORA_ROUTE_INVENTORY · PROPVORA_COMPONENT_INVENTORY · PROPVORA_BUTTON_ACTION_INVENTORY ·
PROPVORA_FORM_WIZARD_INVENTORY · PROPVORA_MOBILE_TABLET_AUDIT · PROPVORA_ADMIN_AUDIT ·
PROPVORA_PORTAL_AUDIT · PROPVORA_AI_COPILOT_AUDIT · PROPVORA_DUPLICATION_REDUNDANCY_AUDIT ·
PROPVORA_SECURITY_AND_DR_AUDIT · PROPVORA_PERFORMANCE_AUDIT · PROPVORA_MANUAL_TASKS_FOR_OWNER ·
PROPVORA_RELEASE_READINESS_SCORECARD · PROPVORA_DB_FRONTEND_ALIGNMENT.

## Honesty note
The single largest item is **P2 mobile/tablet rebuild** — a real architecture pass across
every section, not a responsive patch. It and P3 (browser click-through) are the gating work
for "release-ready" and will be driven incrementally with verification at each step. External
items (HMRC, Cloudflare/Turnstile keys, Stripe Connect activation, Resend DNS, backups) remain
founder actions — tracked in PROPVORA_MANUAL_TASKS_FOR_OWNER.md.
