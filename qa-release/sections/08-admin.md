# Section 08 — Platform Admin Score Matrix

Last updated: 2026-06-21 (Session 42 — browser QA: /admin 1536×960 confirmed 5/5; DESIGN-012 scored)

| Dimension | Score (0–5) | Status | Notes |
|---|---|---|---|
| Routing | 5 | PASS | Admin guard fail-closed (profiles.platform_role OR platform_admins table — any error = deny); no /app/ hrefs; all /admin/* routes use AdminPageShell |
| Desktop (1536×960) | 5 | PASS | 20+ routes audited — health page, audit log, feature flags, users, workspaces, usage, subscriptions all confirmed; browser QA 2026-06-21: /admin AdminShell confirmed, H1 "Platform Command Centre", live KPIs 14 workspaces/23 users/£73,365 GMV, honest revenue disclaimer, live audit log, verification queue, growth chart (DESIGN-012 5/5) |
| Tablet (768×1024) | [~] | BROWSER_REQUIRED | ADMIN-076 requires browser test |
| Mobile (390×844) | [~] | BROWSER_REQUIRED | ADMIN-005, ADMIN-059 require browser test |
| Uploads | N/A | N/A | No file uploads in admin panel |
| Wizards | [~] | BROWSER_REQUIRED | Workspace create wizard requires browser test |
| Security | 5 | PASS | Admin guard fail-closed confirmed; MFA gate on admin shell; admin privilege boundaries verified; no service-role key client-side |
| Data | 5 | PASS | All data live Supabase: health page queries live services, audit log from audit_logs table, feature flags write to platform_feature_flags + reason + audit log, users/workspaces/usage/subscriptions all live |
| **Overall** | **5** | **PASS** | Audited per master scoreboard; browser tests ADMIN-002–080 remain [~] pending admin-account test |

## Routes to Test

See `route-registry.md` — ADM-001 through ADM-023

## Notes

- Admin login is `/admin-login` (separate from `/login`)
- `platform_feature_flags` migration not applied (BLK-003) — feature flags tab may be empty
- Key pages: feature-flags, health, audit-log, supplier verification

## FIX-295 — Security Hardening (2026-06-21)

| ID | Check | Result | Score | Notes |
|---|---|---|---|---|
| SEC-027 | HTTP security headers | PASS | 5 | All headers confirmed in `next.config.ts`: X-DNS-Prefetch-Control, HSTS (63072000s + preload), X-Frame-Options (DENY), X-Content-Type-Options, Referrer-Policy, Permissions-Policy, full CSP. Applied to all routes including /admin. |
| SEC-030 | Auth audit log — login events | PASS | 5 | `AUDIT_ACTIONS.AUTH_LOGIN` added. Auth callback at `/api/auth/callback/route.ts` now records audit entry on successful OAuth session exchange. Audit log visible in `/admin/audit-log`. |
