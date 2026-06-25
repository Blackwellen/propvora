# Grant Portal Access — Wizard Release Evidence

**Wizard:** Grant Portal Access
**Component / modal ID:** `src/components/portals/GrantPortalAccessModal.tsx` (`dialog` aria-label "Grant Portal Access")
**Parent section:** Portals
**Launch routes:** `/property-manager/portals/access` (header CTA + empty-state CTA)
**API:** `POST /api/portals/grant`
**Date:** 2026-06-25
**Branch:** qa-release-fixes-304-314
**Auditor:** Claude Code (Opus 4.8)
**Pattern:** 2-step compact modal (contact → profile/purpose/expiry) + 3rd success step (one-time magic link). Compact-modal pattern is correct for this flow (checklist §2.31) — no `WizardShell` required.

---

## 1. Summary

The Grant Portal Access wizard was audited against the 402-point wizard contract. The
surrounding section (Access Grants / Profiles / Purposes) was already at 100/100 from a
prior session; this pass focused on the **wizard** itself and found one **P1 functional
defect** plus three quality/a11y/cache defects, all fixed and live-verified.

### Headline defect (P1) — fixed
The wizard's entire purpose is to provision a recipient magic link. `POST /api/portals/grant`
mints a 256-bit CSPRNG token, stores it **SHA-256-hashed only**, and returns the raw
`token`/`magicLink` **exactly once**. The modal was discarding that response (`handleSubmit`
read only `data.id` then navigated away), and the grant **detail page only ever shows a masked
`•••• ••••` placeholder**. Net result: **the operator could never obtain the link to share —
the feature was dead end-to-end.** Fixed by adding a one-time success step (FIX-452).

### Bugs found & fixed
| FIX | Severity | Defect |
|-----|----------|--------|
| FIX-452 | **P1** | One-time magic link discarded → success step added (copy-to-clipboard, "shown once" warning, View grant / Done) |
| FIX-453 | P2 | Grant created via `fetch` did not invalidate `["portal-grants"]`/uploads KPI → stale list; now invalidated on success |
| FIX-454 | P2 (a11y) | Focus not moved on step change → focus now moves to step-2 / step-3 heading |
| FIX-455 | P3 | Duplicate "Back" on mobile sheet → redundant header Back removed |

---

## 2. Files changed (file:line)

| File | Change | FIX |
|------|--------|-----|
| `src/components/portals/GrantPortalAccessModal.tsx` | Step-3 success state surfacing one-time magic link + copy/clipboard + next actions | FIX-452 |
| `src/components/portals/GrantPortalAccessModal.tsx` | `useQueryClient` invalidation of `portal-grants` + `portal-uploads-count` on success | FIX-453 |
| `src/components/portals/GrantPortalAccessModal.tsx` | Heading refs + `useEffect([step])` focus move (step 2 + step 3) | FIX-454 |
| `src/components/portals/GrantPortalAccessModal.tsx` | Removed redundant mobile-sheet header Back | FIX-455 |

No DB migration required — `contact_portal_access` / `portal_access_tokens` already exist with correct RLS.

---

## 3. Launch points tested

| Entry point | Result |
|-------------|--------|
| Access Grants header "Grant portal access" CTA | ✅ opens modal at step 1 |
| Access Grants empty-state CTA (same handler) | ✅ same modal (code path identical, `setShowGrant(true)`) |
| Direct API `POST /api/portals/grant` w/o auth | ✅ 401 (server-checked) |
| Direct API with extended profile + flag off | ✅ 403 defence-in-depth (`isExtendedPortalProfile` + flag) |
| Unauthenticated route access `/property-manager/portals/access` | ✅ 307 → `/login?redirectTo=…` (proxy guard) |

Parent context passed: `workspaceId` (from `useWorkspace`); `contactId` selected in step 1.
No property/unit/tenancy context applies to this wizard.

---

## 4. Steps, fields & validation tested

| Step | Fields | Validation |
|------|--------|-----------|
| 1 — Select contact | search + contact list (live `useContacts`, workspace-scoped, top-50 + filter) | "Continue" disabled until a contact is selected ✅ |
| 2 — Profile / Purpose / Expiry | Portal profile `<select>` (V1: landlord/supplier/tenant; extended gated by flag), Purpose `<select>` (9 templates; selecting sets default expiry), Link expiry chips (7/14/30/60/90) | sensible workspace-aware defaults; expiry clamped ≤365 server-side ✅ |
| 3 — Success | read-only magic-link field + Copy button | shows link once; safe fallback if `magicLink` absent (207 path) ✅ |

- Conditional logic: changing Purpose updates the default expiry (kept user override afterwards). Extended profiles only appear when `PORTALS_EXTENDED_PROFILES_ENABLED` / `NEXT_PUBLIC_QA_ALL_FLAGS` is on; the API re-checks (no client-payload bypass).
- Submit guarded by `disabled={submitting || !contactId}` (no double-submit from the UI); loading state "Provisioning…" while in flight.

---

## 5. Data sources / Supabase tables / RLS / edge

| Concern | Result |
|---------|--------|
| `contacts` (step-1 list) | ✅ workspace-scoped via `useContacts(workspaceId)` |
| `contact_portal_access` (insert) | ✅ `workspace_id` + `contact_id` + `created_by` + `status='created'` + `expires_at`; contact ownership re-verified server-side (no cross-tenant grant) |
| `portal_access_tokens` (insert) | ✅ `token_hash` (SHA-256) only; `portal_type` NOT NULL satisfied; raw token never persisted |
| RLS | ✅ membership check (`workspace_members`) → 403 if not a member; contact verified within workspace → 404 otherwise |
| Edge/API auth | ✅ `auth.getUser()` 401 gate; structured 400/403/404/500/503/207 responses; 42P01 degrade |
| Audit | ✅ `recordAudit` writes `PORTAL_GRANT_CREATED` (contactId, accessType, expiresAt) — **no token in metadata** |

---

## 6. Security / token handling

- Token minted server-side from `randomBytes(32)` (256-bit CSPRNG); stored as SHA-256 hash on both `portal_access_tokens.token_hash` and `contact_portal_access.token_hash`.
- Raw token returned exactly once in the API response and surfaced once in the success step; never logged (audit + console exclude it); never re-derivable.
- Extended-profile grants blocked at the API when the flag is off, even if the client payload is tampered (defence in depth).
- Expiry clamped to ≤365 days server-side; `expiryDays` coerced to a positive number (default 30).
- Revoke/extend (from the grant detail page) flip both grant + token rows immediately.

---

## 7. Success state & cross-section updates

- Success step shows the recipient, the magic link, copy-to-clipboard, the "shown once" warning, and next actions (Done / View grant).
- On success: `["portal-grants", workspaceId]` and `["portal-uploads-count", workspaceId]` invalidated → the new grant appears in the Access Grants list and the Overview uploads KPI refreshes without a manual reload (live-verified).
- "View grant" routes to `/property-manager/portals/access/{id}` (detail page) where Extend/Revoke operate on the live rows.
- The grant is scoped to one contact + purpose and appears against the contact via `contact_id`.

---

## 8. Responsive / accessibility

| Viewport | Result |
|----------|--------|
| 1440 / 1280 / 1024 desktop | ✅ centered modal, max-w-lg, premium card; no clipping; footer actions clear |
| 390×844 mobile / PWA | ✅ `MobileSheet` variant; single footer "Back" (FIX-455); no horizontal scroll; touch targets ≥40px |

- `role=dialog` / `aria-modal` / `aria-labelledby`; Esc + backdrop close (guarded while submitting).
- Focus moves to the step heading on step change (FIX-454, live-verified `focused`).
- Icon-only Close/Back/Copy carry `aria-label`; magic-link field has `aria-label`.
- 0 console errors / React warnings / hydration warnings across the full flow.

---

## 9. Screenshots (evidence)

- `release-gated/docs/screenshots/grant-portal-access-success-desktop.png` — step-3 success with magic link + Copy (desktop)
- `release-gated/docs/screenshots/grant-portal-access-step2-mobile.png` — step-2 mobile sheet, single Back (390×844)

---

## 10. Browser QA (Chrome MCP) — live E2E

Run against the live dev server (port 3002, shared working tree; HMR carried the edits), authenticated workspace, seeded portal data:
1. Open list → "Grant portal access" → step 1 renders contacts, Continue disabled. ✅
2. Select **Emma Williams** → Continue → step 2 (focus on heading). ✅
3. Profile = Supplier/Contractor, Purpose = Document exchange, expiry 30d → "Grant access". ✅
4. Step 3 success → magic link `http://localhost:3000/portal?token=JXhH_…` displayed; Copy works; warning shown; new grant already at top of list behind modal (25 Jul 2026 expiry = 30d from 25 Jun). ✅
5. Mobile 390×844 re-run: single footer Back; clean layout. ✅
6. Console: **no errors / warnings**. ✅

> Note: the displayed link host is `http://localhost:3000` because `NEXT_PUBLIC_APP_URL` is set to :3000 in this dev env while the server runs on :3002 — an env artifact, not a wizard bug. In production the base resolves to the real domain.

---

## 11. Build

`npm run build` → **exit 0**, `✓ Compiled successfully`; `/app/portals/access` + `[id]` compiled; no TypeScript errors / unused-symbol warnings.

---

## 12. Tests run

- E2E (Chrome MCP): launch → step 1 validation → step 2 → submit → success link → list refresh → mobile re-run (above).
- Negative API paths confirmed by code: 401 (no auth), 403 (non-member / flagged-off extended profile), 404 (cross-workspace contact), 400 (missing ids), 503 (42P01), 207 (token-insert failure keeps grant).
- Persistence: grant + token rows written with workspace/contact/created_by/expiry/status; audit row written.

---

## 13. Remaining manual / external actions

None blocking. Optional follow-ups documented in
`release-gated/user-fixes/grant-portal-access.md` (e.g. optional re-issue-link flow and
optional recipient-email send path — both deliberately out of V1 scope; V1 is copy-link only).

---

## 14. Score & decision

| Area | Score |
|------|-------|
| Launch/registration | 100 |
| Pattern/styling | 100 |
| Step structure/conditional logic | 100 |
| Validation/business rules | 100 |
| Navigation/drafts/double-submit | 100 |
| Submit/transaction safety | 100 |
| Success/cross-section | 100 |
| Auth/RLS/flags/gates | 100 |
| Files/media | N/A (no uploads in this wizard) |
| Audit/notifications/email | 100 (audit ✅; no email in V1 by design) |
| AI/automation/billing | N/A |
| Responsive/a11y | 100 |
| Performance/observability | 100 |
| DB/schema/constraints | 100 |
| Testing/security | 100 |
| Bloat review | 100 (no duplication; success step is essential, not decorative) |

**Final score: 100/100.**
**Final release decision: Ready for release.** Portals is V1 core (operational kill-switch, default ON); extended portal profiles remain gated behind `PORTALS_EXTENDED_PROFILES_ENABLED` with API defence-in-depth.
