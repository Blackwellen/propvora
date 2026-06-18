# 13 — Platform Admin (Control Plane) Audit

**Status:** Draft · 2026-06-18 · Author: platform/data architect
**Conforms to:** `_shared-strategic-brief.md` (§6 "Admin … is a genuine control plane — keep"; Layer = **Ops**, internal, NOT customer nav).
**Sources:** `src/app/(admin)/admin/**/page.tsx` (52 page files), `src/lib/admin/{guard,data,ops,audit,mutations,affiliate-actions}.ts`.

---

## 0. Verdict

The admin console is **a real control plane, not decoration.** It is gated by a genuine fail-closed boundary (`src/lib/admin/guard.ts`: `profiles.platform_role='admin'` OR `platform_admins` row, **plus AAL2 MFA challenge**), reads cross-workspace via service-role in server-only libs, and every read is **42P01/PGRST-safe** (`src/lib/admin/data.ts`, `ops.ts`) so unprovisioned surfaces render honest empty states rather than crash.

The strategic question is **not "keep admin?" (keep it) but "which admin routes are V1 control-plane vs which are control surfaces for *flagged-off* layers (marketplace/supplier-SaaS/global) that ship dormant alongside their feature".** My split: **~22 routes are essential V1 ops; ~18 are "ships-with-its-flagged-feature" (present but idle in V1); ~6 are merge/dedupe; the rest are thin.**

---

## 1. Route-by-route audit

52 `page.tsx` files. Grouped; `[id]`/`[code]`/detail pages folded into their parent. **Op value:** Genuine = real control action; Monitor = read-only oversight; Decorative = duplicate/thin.

### A. Identity, workspaces, billing — **ESSENTIAL V1**
| Route | Purpose | Op value | Keep/Cut/Merge | Completion |
|---|---|---|---|---|
| `admin` (dashboard) | Platform KPIs, trends, recent workspaces/audit, pending verifs/disputes | Monitor | **KEEP** | Built (`getPlatformStats`/`getExtendedPlatformStats`) |
| `users` + `users/[id]` | User list/detail; impersonation source (`admin_impersonations`) | Genuine | **KEEP** | Built |
| `workspaces` + `workspaces/[id]` | Workspace list/detail, suspend/limits | Genuine | **KEEP** | Built |
| `subscriptions` + `subscriptions/[id]` | Plan/seat oversight (`workspace_subscriptions`) | Monitor | **KEEP** | Built |
| `stripe-events` | Stripe webhook event log (`stripe_webhook_events`) | Monitor | **KEEP** | Built |
| `customers` | Customer-record oversight | Monitor | **KEEP / [VERIFY] overlap with `users`** | Built |
| `settings` | `admin_settings` (branding/limits/feature_defaults/email/webhooks) singleton | Genuine | **KEEP** | Built |

### B. Trust, safety, compliance ops — **ESSENTIAL V1**
| Route | Purpose | Op value | Keep/Cut/Merge | Completion |
|---|---|---|---|---|
| `audit` | Platform audit-log viewer (`src/lib/admin/audit.ts`) | Monitor | **KEEP** | Built |
| `security` | Security posture / admin sessions | Monitor | **KEEP** | Built |
| `health` | System health | Monitor | **KEEP** | Built |
| `data-requests` | GDPR SAR / deletion (`account_deletion_requests`, `privacy_requests`) | **Genuine (legal)** | **KEEP — V1 mandatory** | Built (`ops.ts`) |
| `risk` + `risk/[workspaceId]` | Risk scoring per workspace (`risk_scores`/`risk_events`/`risk_rules`) | Monitor | **KEEP** | Built |
| `maintenance` | Platform maintenance-mode toggle | Genuine | **KEEP** | Built |
| `cron` | Scheduled-job oversight | Monitor | **KEEP** | Built |

### C. Comms & product ops — **ESSENTIAL V1 (lightweight)**
| Route | Purpose | Op value | Keep/Cut/Merge | Completion |
|---|---|---|---|---|
| `announcements` + `announcements/bar` | Announcements (`announcements`) + global bar | Genuine | **MERGE bar into announcements (one route, tabbed)** | Built |
| `changelog` | `changelog_entries` publisher | Genuine | **KEEP** | Built |
| `bugs` | `bug_reports` triage | Monitor | **KEEP** | Built |

### D. AI control — **ESSENTIAL V1.5 (ships with `aiCopilot`)**
| Route | Purpose | Op value | Keep/Cut/Merge | Completion |
|---|---|---|---|---|
| `ai-models` | `ai_models`/`ai_providers` registry, default/cost | Genuine | **KEEP** | Built |
| `ai-usage` | Cross-workspace token/cost (`ai_usage_*`) | Monitor | **KEEP — but reads 5 usage tables; consolidate (see doc 12 §3)** | Built |

### E. Affiliates — **V1.5 (payouts flag OFF)**
| Route | Purpose | Op value | Keep/Cut/Merge | Completion |
|---|---|---|---|---|
| `affiliates` + `affiliates/[id]` | Applications review, commissions, payouts (`affiliate_*`, `src/lib/admin/affiliate-actions.ts`) | Genuine | **KEEP, payouts action gated OFF** | Built |

### F. Marketplace moderation — **SHIPS WITH `marketplaceEnabled` (idle in V1)**
| Route | Purpose | Op value | Keep/Cut/Merge | Completion |
|---|---|---|---|---|
| `marketplace` (hub) | Marketplace ops landing | Monitor | **KEEP CODE, hide nav when flag OFF** | Built |
| `marketplace/moderation` | Listing moderation (`marketplace_listings`/`marketplace_risk_signals`) | Genuine* | **DEFER (flag)** | Built |
| `marketplace/disputes` | `marketplace_disputes`/`escrow_disputes`/`dispute_actions` | Genuine* | **DEFER (flag)** | Built |
| `marketplace/payouts` | Marketplace payouts (`payout_ledger`/escrow) | Genuine* | **DEFER (flag)** | Built |
| `marketplace/transactions` | `marketplace_transactions` ledger | Monitor* | **DEFER (flag)** | Built |
| `marketplace/lettings` | Lettings-side marketplace oversight | Monitor* | **DEFER (flag)** | Built |
| `marketplace/suppliers` | Supplier-side marketplace oversight | Monitor* | **MERGE with `suppliers`/`supplier-verification` — overlap** | Built |
| `marketplace/workspaces` + `[id]` | Marketplace-enrolled workspace oversight | Monitor* | **MERGE with `workspaces`** | Built |
*Genuine **only once the marketplace is live**; in V1 these are dormant control surfaces.

### G. Supplier / verification — **operator-side KEEP; SaaS-side DEFER**
| Route | Purpose | Op value | Keep/Cut/Merge | Completion |
|---|---|---|---|---|
| `supplier-verification` + `[id]` | KYC/verification review (`supplier_*_verifications`) | Genuine | **KEEP (operator suppliers need verification)** | Built |
| `verification` + `verification/[id]` | Generic identity verification queue (`verification_checks`) | Genuine | **MERGE with `supplier-verification` — two verification queues** | Built |
| `suppliers` | Supplier directory oversight | Monitor | **MERGE with `marketplace/suppliers`** | Built |

### H. Content/data oversight mirrors — **THIN / DEFER**
| Route | Purpose | Op value | Keep/Cut/Merge | Completion |
|---|---|---|---|---|
| `portfolios` | Cross-workspace property oversight | Monitor | **KEEP (light) / could fold into `workspaces/[id]`** | Built |
| `work` | Cross-workspace work/jobs oversight | Monitor | Decorative-leaning | **MERGE into dashboard or DEFER** | Built |
| `planning` | Cross-workspace planning-set oversight | Monitor | Decorative-leaning | **DEFER (Layer C feature)** | Built |
| `stays` | Cross-workspace stays oversight | Monitor* | **DEFER (marketplace flag)** | Built |
| `bookings` | Cross-workspace bookings oversight | Monitor* | **DEFER (booking flag)** | Built |
| `documents` | Cross-workspace document oversight | Monitor | **KEEP light (abuse/legal)** | Built |
| `portals` | Portal-session oversight (`portal_sessions`) | Monitor | **KEEP (portals are V1 Layer B)** | Built |
| `automations` + `automations/usage-caps` | Automation oversight + caps (`automation_caps_usage`/`plan_limits`) | Genuine | **KEEP caps; canvas oversight DEFER with `canvasLite`** | Built |

### I. International — **SHIPS WITH `globalCountryPacks`/`contextEngine` (idle in V1 UK-only)**
| Route | Purpose | Op value | Keep/Cut/Merge | Completion |
|---|---|---|---|---|
| `global` + `global/[code]` | Country-pack release control (`country_*`, `module_release_statuses`) | Genuine* | **DEFER (flag) — V1 is UK single-context** | Built |
| `global/translations` | `intl_translation_*` management | Genuine* | **DEFER (flag)** | Built |

---

## 2. Counts

- **Total admin page files:** 52 (≈ matches brief's "~50").
- **Essential V1 control plane (groups A–E + portals + caps + verification + maintenance/cron/data-requests):** **~22 routes.**
- **Ships-with-flagged-feature, dormant in V1 (marketplace F, global I, stays/bookings/planning H):** **~18 routes** — keep code, hide nav until the parent flag flips.
- **Merge/dedupe targets:** **~6** (announcements+bar; suppliers ↔ marketplace/suppliers; verification ↔ supplier-verification; marketplace/workspaces ↔ workspaces; customers ↔ users [VERIFY]; work → dashboard).
- **Completion:** every route renders against the service-role data layer; the 42P01-safe pattern means even flagged-off surfaces don't crash. No route was found stubbed/empty.

---

## 3. Conclusion — essential V1 vs deferrable

**Essential V1 control-plane (must ship, internal-only):** dashboard, users(+detail), workspaces(+detail), subscriptions(+detail), stripe-events, settings, audit, security, health, **data-requests (legal-mandatory)**, risk(+detail), maintenance, cron, announcements(merged), changelog, bugs, portals, supplier-verification(+detail, merged with verification), automations/usage-caps, ai-models, ai-usage, affiliates(payouts gated).

**Deferrable (ship dormant behind their feature flag; hide from admin nav until the flag flips):** all `marketplace/*`, `stays`, `bookings`, `global/*`, `planning`, and the redundant cross-workspace mirrors (`work`).

**Net:** the admin console is **correctly built and should be kept whole in code** — the only V1 action is **(a) hide the flagged-feature admin routes from admin nav when their master flag is OFF** (so the operator-platform admin sees a clean ~22-route control plane), and **(b) merge the ~6 duplicate queues.** No admin route should be deleted: each is the operator-side control for a layer that the staged plan turns on later.

---

## 4. Recommendations (Reason · Risk · Action)

1. **Nav-gate admin sections by feature flag.** *Reason:* a V1 operator-platform admin should not see 8 dormant marketplace routes (brief §4 clarity applies to ops too). *Risk:* a flag-off route still reachable by URL must render "feature disabled", not raw empty data. *Action:* drive `AdminShell` nav from the same flag registry as the app; keep routes, hide links.
2. **Merge the 6 duplicate queues.** *Reason:* two verification queues / two supplier views / two workspace lists fragment the operator's attention and the data. *Risk:* low — these read overlapping tables. *Action:* tab them (verification under one route, suppliers under one, announcements+bar under one).
3. **Consolidate `ai-usage` reads onto one usage ledger.** *Reason:* it currently aggregates 5 tables (doc 12 §3); cost reporting can disagree. *Risk:* under-counting AI spend. *Action:* pick the canonical `ai_usage_events` ledger; shim the rest.
4. **Keep `data-requests` first-class.** *Reason:* SAR/deletion is legally mandatory at V1 launch (UK GDPR), independent of any flag. *Risk:* compliance gap. *Action:* ensure it is in V1 admin nav unconditionally and wired to the deletion scheduler (`account_deletion_requests.scheduled_for` = now()+30d default).
5. **Preserve the MFA + service-role discipline.** *Reason:* `guard.ts` is fail-closed with AAL2; `data.ts`/`ops.ts` never leak service-role to client. *Risk:* a new admin route bypassing the guard. *Action:* assert every `(admin)` page is under the guarded layout and uses `src/lib/admin/*` (no direct service-role client in page files).
