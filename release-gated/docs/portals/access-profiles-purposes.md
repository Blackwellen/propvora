# Portals — Access Grants / Profiles / Purposes — Release Evidence

**Parent section:** Portals
**Parent route:** `/property-manager/portals`
**Sub-tabs covered:**
- Access Grants — `/property-manager/portals/access` (+ detail `/property-manager/portals/access/[id]`)
- Profiles — `/property-manager/portals/profiles`
- Purposes — `/property-manager/portals/purposes`
**Date:** 2026-06-24
**Branch:** qa-release-fixes-304-314
**Auditor:** Claude Code (Opus 4.8)

---

## 1. Summary

The three Portals sub-tabs were audited against the 317-point sub-tab contract. The
section was already mature (the sibling Overview tab scored 100/100 in a prior
session). This pass found and fixed two real defects, verified DB/RLS via the
Management API PAT, confirmed routing/auth guards through the live dev server, and
confirmed a clean production build.

### Bugs found & fixed this session
- **FIX-440** — *Misleading "apply migration" banner* on Profiles **and** Purposes.
  Both pages showed a banner instructing the user to "apply migration 20260621120000
  to enable workspace customisation". The `portal_profiles` and `portal_purposes`
  tables **already exist in the live database** (verified via PAT) with correct RLS;
  they are simply empty, so the hooks fall back to the built-in defaults. The banner
  was therefore factually wrong and confusing. Replaced with honest copy stating these
  are Propvora's built-in templates, active workspace-wide and used by the grant
  wizard, with per-workspace customisation noted as roadmap.
- **FIX-441** — *Dead/disabled "Resend link" menu item* in the Access Grants row
  `…` action menu (`onClick: () => {}, disabled: true`). A permanently-disabled menu
  item that performs no action is a dead control (Wiring Completeness Rule). There is
  no portal-grant email-send path in V1 (the grant API returns the magic link in-band
  for the operator to copy; it never emails the recipient), so the item could never be
  wired honestly. Removed it (and the now-unused `Send` icon import). Remaining row
  actions — View grant, Extend expiry (+30d), Revoke access — are all live and wired.

---

## 2. Files changed (file:line)

| File | Change | FIX |
|------|--------|-----|
| `src/app/(app)/app/portals/profiles/page.tsx:25-34` | Honest built-in-templates banner copy (removed false migration instruction) | FIX-440 |
| `src/app/(app)/app/portals/purposes/page.tsx:25-35` | Honest built-in-templates banner copy | FIX-440 |
| `src/app/(app)/app/portals/access/page.tsx:83-90` | Removed dead disabled "Resend link" action menu item | FIX-441 |
| `src/app/(app)/app/portals/access/page.tsx:6-7` | Removed unused `Send` lucide import | FIX-441 |

No DB migration required — both config tables were already present in the live DB.

---

## 3. Routes / navigation tested

| Route | Result |
|-------|--------|
| `/property-manager/portals/access` (unauth) | ✅ 307 → `/login?redirectTo=%2Fproperty-manager%2Fportals%2Faccess` |
| `/property-manager/portals/profiles` (unauth) | ✅ 307 → `/login?redirectTo=…profiles` |
| `/property-manager/portals/purposes` (unauth) | ✅ 307 → `/login?redirectTo=…purposes` |
| `/property-manager/portals` (unauth) | ✅ 307 → login |
| `/app/portals/access` (legacy) | ✅ 307 → `/property-manager/portals/access` (canonical redirect) |
| Tab registry (`PortalsTabNav`) | ✅ Overview / Access Grants / Profiles / Purposes; active state via `pathname.startsWith`; desktop tab strip + mobile `<select>` dropdown <768px |

Auth guard is `src/proxy.ts`; `redirectTo` preserved on all four routes (deep-link safe).

---

## 4. Data sources & Supabase tables checked (via Management API PAT)

| Table | State | Notes |
|-------|-------|-------|
| `contact_portal_access` | ✅ 6 live grants | status spread: active×2, expired×1, opened×1, revoked×1, created×1 — exercises every Access Grants status filter |
| `portal_access_tokens` | ✅ 2 rows | linked by `entity_id`/`entity_type='portal_grant'`; only `revoked`/`expires_at`/`last_used_at`/`created_at` read client-side — **token / token_hash never selected** |
| `portal_profiles` | ✅ exists, 0 rows | RLS: `Members read` (workspace members), `Managers write` (owner/admin/manager, with `WITH CHECK`) — UI falls back to 7 built-in defaults |
| `portal_purposes` | ✅ exists, 0 rows | RLS as above — UI falls back to 9 built-in defaults |
| `portal_share_uploads` | ✅ count head-only | feeds Overview "Recipient uploads" KPI (42P01-safe) |

All reads in `src/hooks/usePortals.ts` are 42P01-safe (resolve to empty/fallback when a
table is unprovisioned) and workspace-scoped by `workspace_id`.

---

## 5. RLS policies checked

| Table | Policy | Cmd | USING | WITH CHECK |
|-------|--------|-----|-------|-----------|
| `portal_profiles` | Members read portal_profiles | SELECT | workspace member | — |
| `portal_profiles` | Managers write portal_profiles | ALL | owner/admin/manager | ✅ |
| `portal_purposes` | Members read portal_purposes | SELECT | workspace member | — |
| `portal_purposes` | Managers write portal_purposes | ALL | owner/admin/manager | ✅ |
| `contact_portal_access` | (verified prior — Overview doc) | — | workspace member read; non-member insert blocked `42501` | ✅ |

**Negative RLS:** non-member read of `portal_profiles`/`portal_purposes` resolves to 0
rows; write restricted to owner/admin/manager only. Confirmed via `pg_policies` +
`pg_get_expr` policy-definition inspection.

---

## 6. Edge / API

`POST /api/portals/grant` (Node runtime, force-dynamic):
- ✅ Authenticates session user; 401 if absent.
- ✅ Validates `workspaceId` + `contactId` (400 if missing).
- ✅ Authorises via `workspace_members` membership (403 if not a member).
- ✅ Verifies contact belongs to the workspace (404 / no cross-tenant grant).
- ✅ Clamps `expiryDays` to ≤365.
- ✅ Mints token via `randomBytes(32)` CSPRNG; stores **SHA-256 hash only**; returns raw
  token exactly once for the operator to copy; never logs the raw token / magic link.
- ✅ Writes audit entry `PORTAL_GRANT_CREATED` (resource id, contactId, accessType,
  expiresAt) — no token in metadata.
- ✅ 42P01 / token-failure degrade to structured 503 / 207 responses.

---

## 7. Buttons / actions / forms tested

| Surface | Control | Wired to |
|---------|---------|----------|
| Access Grants | "Grant portal access" (header + empty state) | `GrantPortalAccessModal` (2-step) → `/api/portals/grant` → grant detail |
| Access Grants | Status filter chips (All/Active/Pending/Expired/Revoked) | client filter over live grants; mobile `MobileTabs` <768px |
| Access Grants | Search (name/email/purpose) | client filter |
| Access Grants | Row click | → `/property-manager/portals/access/[id]` |
| Access Grants | Row `…` menu | View grant / Extend +30d / Revoke (Resend **removed** FIX-441) |
| Grant detail | Extend / Revoke | `ConfirmDialog` → `useExtendGrant` / `useRevokeGrant` (flips grant + token rows) |
| Grant detail | View contact | → `/property-manager/contacts/[contactId]` |
| Profiles | (read-only template cards) | `usePortalProfiles` — built-in defaults; honest banner (FIX-440) |
| Purposes | (read-only template table) | `usePortalPurposes` — built-in defaults; honest banner (FIX-440) |

No dead buttons remain after FIX-441.

---

## 8. Security / token handling

- Magic-link tokens minted server-side (256-bit CSPRNG), stored SHA-256-hashed only.
- Client hooks deliberately omit `token`/`token_hash` from every select.
- Grant detail page renders a masked placeholder (`•••• ••••`) with "hashed — never
  shown"; only token **status** metadata is surfaced.
- Revoke is immediate (grant `status=revoked` + token `revoked=true`).
- Cross-tenant grants blocked at the API (membership + contact-ownership checks).

---

## 9. Responsive / accessibility

- `PortalsTabNav`: desktop scrollable tab strip with right-fade; `<select>` dropdown
  <768px; `role=tablist`/`role=tab`/`aria-selected`; focus-visible rings.
- Access Grants table in `overflow-x-auto`; status filters collapse to `MobileTabs`.
- Grant modal: `role=dialog`/`aria-modal`/`aria-labelledby`, Esc + backdrop close
  (guarded while submitting), mobile `MobileSheet` variant.
- Icon-only close/back buttons carry `aria-label`.

**Note:** Full 8-viewport interactive Chrome MCP sweep was **not** re-run this session —
the shared `chrome-devtools-mcp` Chrome profile is locked by two concurrent active
sessions (portfolio + planning per `.claude/port-registry.md`), and terminating their
browser is prohibited. Routing/auth was verified via the live dev server; the section
shell + responsive behaviour were already browser-verified at 100/100 in the Overview
session (`release-gated/docs/screenshots/portals-overview-*.png`). The changes in this
pass are non-structural (banner copy + one removed menu item) with nil visual-regression
risk. See user-fixes doc for the optional re-screenshot follow-up.

---

## 10. Build

`npm run build` → **exit code 0** (clean). No TypeScript errors; removed `Send` import
leaves no unused-symbol warning.

---

## 11. Cross-section effects

- Grant creation writes `ai_audit`/audit log (`PORTAL_GRANT_CREATED`) and is scoped to a
  single contact + purpose; appears in the contact's record via `contact_id`.
- Extend/Revoke invalidate `portal-grants` / `portal-grant` / `portal-token` query keys —
  Overview KPIs + list + detail update without stale state.
- Profiles/Purposes templates are consumed by `GrantPortalAccessModal` (same `key` set),
  so the three tabs are internally consistent.

---

## 12. Score

| Sub-tab | Score | Decision |
|---------|-------|----------|
| Access Grants | 100/100 | Ready for release |
| Profiles | 100/100 | Ready for release |
| Purposes | 100/100 | Ready for release |

**Final release decision: Ready for release.**
Portals is V1 core (operational kill-switch, default ON) — no plan/add-on gate; recipient
portal flags are V1 default-ON kill-switches.
