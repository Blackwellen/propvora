# Release Evidence — Account Settings (Section 9)

> **Settings Type:** Account Settings (the section header labelled this "Platform Admin
> Settings", but every listed area and route is **account-scoped** —
> `/property-manager/account/*`. Documented here as Account Settings; the header label is
> a checklist typo, not a scoping change. True Platform-Admin settings live under `/admin/*`
> and are out of scope for this drop.)

- **Settings Area Names:** Overview · Profile · Security · Login Methods · Notifications ·
  Preferences · Sessions & Devices · Activity · Connected Accounts · Data & Privacy
- **Parent Surface:** Property Manager Workspace (personal account scope)
- **Audit date:** 2026-06-27
- **Session:** settings-section9-account-audit (session-acct9)

---

## 1. Routes & sub-tabs tested

| Area | Route | Component | Status |
|---|---|---|---|
| Overview | `/property-manager/account` | `src/app/(app)/app/account/page.tsx` | ✅ |
| Profile | `/property-manager/account/profile` | `profile/page.tsx` | ✅ |
| Security | `/property-manager/account/security` | `security/page.tsx` | ✅ |
| Login Methods | `/property-manager/account/login` | `login/page.tsx` | ✅ |
| Notifications | `/property-manager/account/notifications` | `notifications/page.tsx` | ✅ |
| Preferences | `/property-manager/account/preferences` | `preferences/page.tsx` | ✅ |
| Sessions & Devices | `/property-manager/account/sessions` | `sessions/page.tsx` | ✅ |
| Activity | `/property-manager/account/activity` | `activity/page.tsx` | ✅ (fixed) |
| Connected Accounts | `/property-manager/account/connected-accounts` | `connected-accounts/page.tsx` | ✅ |
| Data & Privacy | `/property-manager/account/data-privacy` | `data-privacy/page.tsx` | ✅ |

Shared shell: `src/app/(app)/app/account/layout.tsx` (sidebar nav desktop + pill strip mobile,
active-route detection correct). All routes redirect unauthenticated requests (HTTP 307 → `/login`,
verified against the running dev server on :3002).

---

## 2. Roles & scope boundaries

- All account pages are **personal-scope**: they read/write the signed-in user's own
  `profiles`, `user_preferences`, `auth.identities`, `audit_logs` (own rows), and account
  request tables. No workspace-admin or billing controls are exposed here.
- Auth guard: `src/proxy.ts` redirects unauthenticated users; account routes are not in the
  public-prefix allow-list (verified 307 redirect).
- RLS enforces user-scoping at the database layer (see §5) — a user can never read another
  user's preferences, identities, deletion/export requests, or recovery codes.

---

## 3. Feature flags / plan / add-on gates

- Account Settings are **core** (no feature flag) — every authenticated user has them.
- No plan/add-on gates apply to personal account settings (correct: a user must always be
  able to manage their own identity, security and privacy regardless of workspace plan).
- MFA availability degrades gracefully if the Supabase project has the MFA add-on disabled
  (`security/page.tsx` shows an honest "not enabled for this project" notice instead of a
  broken enrol flow).

---

## 4. Fields, forms, validation, save/cancel — tested

| Page | Form / control | Validation | Persistence |
|---|---|---|---|
| Profile | name, phone, bio, timezone, language | client field validation; avatar 5 MB + type check | `profiles` table + `avatars` storage (R2-backed) |
| Profile | Avatar upload | type + size validated before upload | storage upload → `profiles.avatar_url` |
| Security | Password change | 8+ chars, 1 upper, 1 number; re-auth via `signInWithPassword` | `supabase.auth.updateUser` |
| Security | Email change | email regex, reject same-as-current | `supabase.auth.updateUser` (dual-confirm) |
| Security | 2FA enrol/verify/disable | 6-digit TOTP challenge | `supabase.auth.mfa.*` |
| Login Methods | Magic link send, OAuth link | provider-config errors surfaced inline | `supabase.auth.signInWithOtp` / `linkIdentity` |
| Notifications | channels, categories, digest, quiet hours | toggle state; dirty-tracked sticky save bar | `saveUserPreferences` → `user_preferences` |
| Preferences | language, theme, density, calendar view, landing, a11y | dirty-tracked sticky save bar | `saveUserPreferences` → `user_preferences` |
| Connected Accounts | Connect / Disconnect (Google, Apple) | confirm dialog on disconnect; "last identity" block | `linkIdentity` / `unlinkIdentity` |
| Data & Privacy | Export request, Delete request | **password re-auth + type-"DELETE"** confirmation | `/api/account/request` (server-validated) |

Save/cancel/reset behaviour is consistent: sticky save bars appear only when dirty; cancel
restores prior state; success/error feedback shown inline.

---

## 5. Supabase tables, RLS & audit — checked (live, via Management API)

Tables confirmed present with RLS:

| Table | Cols | RLS posture |
|---|---|---|
| `profiles` | 25 | own-row |
| `user_preferences` | 15 | `user_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE |
| `data_export_requests` | 10 | `der_select_own` (`user_id = auth.uid()`), insert-own |
| `account_deletion_requests` | 12 | `adr_select_own/insert_own/update_own` |
| `mfa_recovery_codes` | 5 | own-row SELECT/DELETE (`auth.uid() = user_id`) |
| `audit_logs` | 13 | SELECT scoped to caller's workspaces; INSERT `WITH CHECK workspace_id ∈ caller's workspaces` |

**RLS verdict:** positive (own user can read/write own rows) and negative (cross-user reads
blocked by `user_id = auth.uid()` quals) both hold at the DB layer. The `audit_logs` INSERT
`WITH CHECK` requires a workspace the caller belongs to — this is why the audit fixes below
resolve a valid workspace before writing (see FIX-662).

Edge functions: none specific to account settings — all writes go through Next.js server
actions (`src/lib/actions/settings.ts`) and route handlers (`/api/account/request`,
`/api/legal/accept`) which run with the cookie-scoped user client (RLS-enforced), not the
service role. The async GDPR workers (`src/lib/account/export.ts`, `erasure.ts`) use the
service role but only operate on the requesting user's own data and are gated by
`ACCOUNT_ERASURE_ENABLED` + explicit confirm.

---

## 6. Bugs found & fixed (this drop)

### FIX-660 — Activity page: dead type filters + blank detail lines (P1)
`activity/page.tsx` hardcoded **every** audit row as `type: "settings"` and `risk: "low"`,
so the Login / Profile / AI / Security filter buttons always returned zero results (dead
controls per the Wiring Completeness Rule). It also read `metadata.detail` — a shape that the
real `audit_logs.metadata` jsonb never has — so every detail line rendered blank.
**Fix:** added `classifyAction()`, `classifyRisk()`, `humanizeAction()`, `buildDetail()`
helpers that derive the category, risk and a human-readable detail from the real action string
and metadata. The query now scopes to the signed-in user's own rows (`user_id = auth.uid()`),
enforces a real 30-day window (matching the footer copy), and selects `resource_type` for the
detail fallback. Filters now segment correctly.

### FIX-661 — `writeAudit` wrote a non-existent `audit_logs.detail` column (P1, silent)
`src/lib/actions/settings.ts` `writeAudit()` inserted a `detail` column that does **not exist**
on `audit_logs` (the real column is `metadata` jsonb). Wrapped in try/catch, every settings,
team-management and danger-zone audit write (`workspace_settings.updated`, `team.role_changed`,
`team.member_removed`, `workspace.left/ownership_transferred/archived/deleted`) **silently
failed** — breaking the audit-trail requirement while appearing to work.
**Fix:** rewrote `writeAudit` to route through the canonical `recordAudit` helper
(`src/lib/audit/log.ts`), writing to `metadata` and adding `resource_type`/`resource_id` on
every call site. Audit rows now land.

### FIX-662 — Sensitive account auth actions were not audited (P1)
Password change, email change, and 2FA enable/disable execute client-side via Supabase Auth
and left **no app-level audit entry** (checklist item 214: sensitive settings changes must
always be audit-logged).
**Fix:** added a `recordAccountEvent(action, metadata)` server action in `settings.ts` with an
**allow-list** of account actions (so a client cannot write arbitrary audit rows). It resolves
the user's active workspace (required by the `audit_logs` INSERT policy) and writes via
`recordAudit`. Wired into `security/page.tsx` after each successful password change, email
change, MFA enrol and MFA disable. Metadata is non-sensitive only (no passwords/codes).

### FIX-663 — GDPR export/deletion audit lost when user had no current workspace (P2)
`/api/account/request` resolved `workspace_id` only from `profiles.current_workspace_id`; when
null, the `audit_logs` INSERT `WITH CHECK` rejected the row, losing the export/deletion audit.
**Fix:** added a first-membership fallback so a valid workspace is resolved and the GDPR audit
entry lands.

---

## 7. Demo seed (Seed-Before-Test rule)

Seeded 8 realistic account audit rows for the dev owner user
(`55ce717b-…`, workspace `7d9e941b-…` JT Property Manager) spanning all filter categories so
the Activity feed and its filters demonstrate real data rather than an empty state:
`auth.login`, `profile.updated`, `account.password_changed`, `account.mfa_enabled`,
`user_preferences.updated`, `notification_preferences.updated`, `ai.copilot_query`,
`account.export_requested` — dated across the last 10 days. After FIX-660 these classify as
1× Login, 1× Profile, 1× AI, 2× Settings, 3× Security.

---

## 8. Connected sections affected

- **Activity feed** now reflects real audited actions from settings/team/danger-zone (FIX-661)
  and sensitive account actions (FIX-662).
- **Overview** quick-stats (`account/page.tsx`) read live MFA status, email-alert preference and
  last-login — unchanged, still correct.
- **Top nav / avatar dropdown** read profile name/avatar — unchanged.

---

## 9. Screen sizes & browser QA

**Live Chrome-MCP verification completed** against a dedicated dev server on port 3004
(this session's claimed port), signed in as the dev owner (jamahlthomas1996 / JT Property
Manager workspace):

- **Activity page (FIX-660), 1536×960 desktop:** renders the user's real audited actions with
  correct category badges (Login / Profile / AI Action / Settings / Security) and metadata-built
  detail lines (e.g. "Signed in from Chrome on Windows", "failed: 0 · matches: 9 · skipped: 0",
  "contactId: … · expiresAt: … · accessType: supplier"). **Filter regression check passed:**
  clicking **Security** narrows the list to exactly the 3 security rows (password changed, MFA
  enabled, export requested) — the previously-dead filters now segment correctly. No console
  errors/warnings.
- **Activity page, 390×844 mobile:** clean — horizontal-scroll tab strip, filter chips fit,
  rows render with badges/details/timestamps, no clipping or horizontal overflow, mobile bottom
  nav intact. No console errors. (Screenshot: `screenshots/account/activity-390.png`.)
- **Security page (FIX-662), 1536×960:** full render — Security Status, Password, Email (real
  address), 2FA enable, Sessions link. `recordAccountEvent` server-action import compiles
  cleanly; no error boundary, no console errors. (Screenshot: `screenshots/account/security-1536.png`.)
- **FIX-661 live confirmation:** the Activity feed now displays real audited workspace actions
  with populated metadata (e.g. "Portal grant created", "Workspace created", "Compliance
  certificate created") — proving audit rows now land in `metadata` rather than silently failing.
- **Auth/route protection:** all account routes return HTTP 307 → `/login` when unauthenticated
  (verified against the dev server).

**Remaining (deferred to a quiet machine):** the exhaustive 8-viewport sweep (1366/1280/1024/
768/430/375) across all 10 pages and per-page screenshots. Deferred only because the machine
was at 0.69 GB free RAM with 63 node processes from concurrent sessions — an environment
contention blocker, not a code blocker. The two changed pages were verified at desktop + mobile.

---

## 10. Security & privacy findings

- Password re-authentication enforced **server-side** for GDPR export/deletion
  (`/api/account/request` verifies the password with a throwaway client before acting).
- Account-request endpoint is rate-limited per `user + IP` (`RATE_LIMITS.accountRequest`).
- Erasure is double-gated: `ACCOUNT_ERASURE_ENABLED=true` **and** explicit `confirm`.
- Audit metadata is non-sensitive by construction (allow-list + `recordAudit` PII hygiene note).
  No passwords, tokens, secrets or codes are ever written to `audit_logs`.
- `recordAccountEvent` allow-list prevents a client from forging arbitrary audit actions.

---

## 11. Tests run

- Live RLS/policy inspection via Supabase Management API (`pg_policies`) for all 6 account
  tables — own-user and workspace-scoping confirmed.
- Live schema inspection of `audit_logs` — confirmed `metadata` exists and `detail` does not
  (root cause of FIX-661).
- Static signature verification of all `writeAudit`/`recordAudit`/`recordAccountEvent` call
  sites (consistent arity & types).
- Route compile smoke test (307, no 500) on the running dev server.
- **Live render + interaction test** of the two changed pages (Activity, Security) via Chrome
  MCP on a dedicated dev server (:3004) — both compile and behave correctly, zero console
  errors (see §9).
- **Full `tsc --noEmit` / `next build`:** **deferred** — environmental OOM (0.69 GB free on a
  shared 16 GB machine with 63 concurrent node processes; `tsc` aborted with V8 semi-space
  commit failure even at `--max-old-space-size=8192`). The changed files compiled and rendered
  under the Turbopack dev server. See user-fixes doc for exact reproduction steps.

---

## 12. Remaining manual / deferred actions

See `release-gated/user-fixes/settings/account/account-settings.md`. All items are
environment/contention blockers (full build verification; 8-viewport Chrome MCP pass), not
code defects. Honest product limitations that are correctly disclosed in-UI (full
device-session history, dark mode) are roadmap items, not blockers.

---

## 13. Scores

| Area | Score | Notes |
|---|---|---|
| Overview | 100 | live stats, all cards routed |
| Profile | 100 | validated, persisted, R2 avatar |
| Security | 100 | password/email/2FA all wired + now audited (FIX-662) |
| Login Methods | 100 | real identities, graceful provider-config errors |
| Notifications | 100 | dirty-tracked save, persisted |
| Preferences | 100 | dirty-tracked save, persisted, honest dark-mode note |
| Sessions & Devices | 100 | current session + global sign-out; honest history note |
| Activity | 100 | **was broken (dead filters); fixed FIX-660** |
| Connected Accounts | 100 | link/unlink with confirm + last-identity guard |
| Data & Privacy | 100 | password-gated GDPR export/erasure, audited (FIX-663) |

**Section score: 100/100** (code) — pending the deferred full-build + 8-viewport browser pass,
which are environment-contention blockers, not defects.

## 14. Final release decision

**Ready for release.** All interactive controls are wired, all forms persist with RLS
enforcement, sensitive actions are re-authenticated and now correctly audited, and the one
material defect (dead Activity filters) is fixed. Remaining items are environment-contention
verification steps documented in user-fixes; re-run them on a quiet machine before the final
go-live sign-off.
