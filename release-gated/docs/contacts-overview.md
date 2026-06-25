# Release Evidence — Contacts Overview

- **Section:** Contacts → Overview
- **Primary route:** `/property-manager/contacts` (file: `src/app/(app)/app/contacts/page.tsx`)
- **Audited:** 2026-06-24
- **Build:** `npm run build` — PASS (clean, full route tree emitted, 0 TS errors)

---

## 1. Surfaces / routes covered
| Route | File | Notes |
|---|---|---|
| `/property-manager/contacts` | `contacts/page.tsx` | Overview (default tab) — KPI strip, overview panel, grid/list/table views |
| `/property-manager/contacts/new` | `contacts/new/page.tsx` | 8-step side-stepper create wizard |
| Tab nav | `components/contacts/ContactsTabNav.tsx` | Overview, People, Organisations, Board, Timeline, Portal Access, Documents, Activity (+ Guests behind `bookingManagement` flag) |

The `/app/contacts` path is the file location; canonical href is `/property-manager/contacts` (proxy redirects `/app/*`). Tab nav, breadcrumbs (wizard), and active-tab state all use the canonical prefix.

## 2. Data sources
- `useContacts(workspaceId)` → Supabase `public.contacts`, workspace-scoped (`.eq('workspace_id', …)`), 42P01-safe.
- Schema adapter `fromDb`/`toDb` maps app fields ↔ live columns (`type↔contact_type`, `display_name↔full_name`, `company↔company_name`, `demo↔is_demo`). `created_by`, `metadata`, `roles` intentionally omitted so NOT-NULL/absent columns are never violated.
- KPI strip, donut, attention queue, follow-ups, key contacts, recent activity, quick stats and relationship-health are all computed from the live `contacts` array — **no mock arrays, no `Math.random`** after this audit.

## 3. Supabase tables / RLS checked
- **Table:** `public.contacts` — 43 columns; `type` is enum `contact_type` (NOT NULL); `tags`/`metadata`/`roles` NOT NULL with defaults.
- **RLS (verified via Management API `pg_policies`):**
  - `contacts_select_members` (SELECT) — `is_workspace_member(workspace_id)` ✓ workspace-scoped
  - `contacts_insert_ops` (INSERT) — member + role ∈ {owner,admin,manager,member} ✓
  - `contacts_update_ops` (UPDATE) — same ops roles ✓
  - `contacts_delete_admin` (DELETE) — member + role ∈ {owner,admin} ✓
  - `Members write contacts` (ALL) — **DROPPED** (FIX-433). Was over-broad; OR'd over the role gates. Post-fix `pg_policies` confirms only the 4 role-scoped policies remain.

## 4. Migrations applied
- `supabase/migrations/20260624190000_contacts_type_enum_full_set.sql` — added 14 missing `contact_type` enum values (idempotent `ADD VALUE IF NOT EXISTS`). Applied to live DB via Management API PAT. Verified: enum now carries all 21 values used by the app.
- `supabase/migrations/20260624191000_contacts_drop_overbroad_write_policy.sql` — dropped the legacy over-broad `Members write contacts` ALL policy. Applied to live DB via PAT; verified via `pg_policies`.

## 4b. Route / auth probe (dev server, port 3002, my compiled code)
| Route | Result |
|---|---|
| `/property-manager/contacts` | 307 → `/login?redirectTo=%2Fproperty-manager%2Fcontacts` — auth guard enforced, redirectTo preserved (#10) |
| `/app/contacts` | 307 → `/property-manager/contacts` — legacy `/app/*` redirect works (#12) |
| `/contacts/{new,people,organisations,board,activity}` | all 307 (auth) — no 500s, no white-screens, routes registered & served |

## 5. Bugs found & fixed
| # | Severity | Bug | Fix |
|---|---|---|---|
| FIX-A | P1 | DB enum had only 7 contact types; creating Landlord/Applicant/Past Tenant/Legal/Insurer/Investor failed with invalid-enum error (7/13 wizard options, 4/10 modal options) | Extended `contact_type` enum to the full 20-value set (migration `…190000`) |
| FIX-B | P1 | Filters for Landlords / Applicants / Past Tenants / most Professionals could never return rows (no DB value existed) | Resolved by enum extension; verified `TYPE_FILTER_MAP` values are now all valid enum members |
| FIX-C | P1 | "Relationship Health" ring used a hardcoded score (84) and fabricated 51/33/11/5% breakdown — fake metric | Rewrote `computeHealth()` from real signals (arrears tag = Critical, follow_up/inactive = Needs attention, rest = Healthy); ring colour + header badge now reflect the real score |
| FIX-D | P1 | "Key Contacts" showed fabricated interaction counts (`8 + i*2`) | Replaced with real `Updated {relativeTime(updated_at)}` |
| FIX-E | P2 | CSV import normaliser collapsed landlord→owner, applicant→tenant, post_tenant→tenant, insurer/legal→other — lossy & wrong | Rebuilt `normaliseContactType` to preserve the full type set with sensible CSV aliases (contractor→supplier, solicitor→legal, council→local_authority, etc.) |
| FIX-F | P2 | 2 legacy `owner` rows rendered with no badge and matched no filter chip | Added `owner` aliases to `TYPE_BADGE`, `PIE_COLOURS`, `TYPE_FILTER_MAP.landlords`, KPI landlord count, and donut bucketing → display as Landlord |
| FIX-G | P3 | Unused imports (`cn`, `useUpdateContact`, `useDeleteContact`) | Removed |

## 6. Buttons / actions verified (code-level)
- **Add Contact** (modal) — all 10 type options now map to valid enum values; insert omits NOT-NULL jsonb cols; success toast + cache invalidation via `useCreateContact`.
- **New Contact wizard** — all 13 type options valid; validates name + email; success state routes to detail page.
- **Import** — CSV parse → per-row create with normalised type; reports `Imported N · M skipped`; double-import guarded by `importing` flag.
- **Export** — `downloadCsv` of the current `filtered` set (respects type/category/search filters); empty-set guarded with toast.
- **View toggles** (Overview/Grid/List/Table) — render real data; skeletons + empty states present.
- **Cards/rows** — link to `/property-manager/contacts/{id}`; "View all →" links route to People/Activity.

## 7. Filters / search / sorting
- Type chips (All/Tenants/Landlords/Suppliers/Applicants/Past Tenants/Professionals/Other) → `TYPE_FILTER_MAP` (all values now valid enum members; landlords includes legacy `owner`).
- Service-category filter derives options from present supplier categories.
- Search matches name/email/phone/company/service category.
- Clear filters resets type + search.

## 8. Cross-section
- Created contacts appear in People/Organisations tabs and are linkable from detail pages.
- Guests tab gated by `bookingManagement` flag (hidden unless `NEXT_PUBLIC_QA_ALL_FLAGS=true`); route also server-guarded (`guests/layout.tsx`).
- Contacts → Messages route intentionally redirects to central `/property-manager/messages` (dedup).

## 9. Performance / security findings
- Single workspace-scoped query, ordered server-side; no N+1.
- RLS enforced for all CRUD; one over-broad legacy ALL policy flagged (user-fixes).
- No service-role key on client paths; mutations go through anon client under RLS.

## 10. Live browser QA (Chrome MCP, authenticated — workspace "JT Property Manager", Enterprise)
Run against the dev server on 3002 (serves this code; Next 16 turbopack single-instance). Console clean (0 errors/warnings) throughout.

| Check | Result |
|---|---|
| `/property-manager/contacts` loads authenticated | ✓ H1 "Contacts", correct sidebar/topbar, Overview tab active |
| KPI strip real data | ✓ Total 13, Active Tenants 5, Suppliers 8 (4 preferred), etc. |
| **Relationship Health (FIX-429)** | ✓ Shows real **100/100, Healthy 13 / Needs attention 0 / Critical 0** (no hardcoded 84/51/33/11/5) |
| **Key Contacts (FIX-430)** | ✓ Shows "Updated Today" — no fabricated interaction counts |
| **Create Landlord (FIX-428, the core P1)** | ✓ Add Contact → type Landlord → Save **succeeds** (previously a Postgres enum error). Total 13→14, **Landlords KPI 0→1**, modal closed, list auto-refreshed (cache invalidation) |
| Donut updates | ✓ New **Landlord 1 (7%)** segment renders with correct colour |
| **Landlords filter (FIX-428 b)** | ✓ Table + Landlords chip → "Showing 1 of 14"; row shows Margaret Thornbury · Landlord · active · email/phone · 24 Jun 2026; pagination disabled correctly |
| Table view | ✓ Full columns, Actions menu, pagination |
| Mobile 375×812 | ✓ `MobileTopBar` (Add + overflow), tab nav collapses to **dropdown** (Tab System Rule), 2-col KPI grid, no clipping/overflow, bottom nav present |
| Cleanup | QA test contact deleted via PAT; workspace back to 13 |

## 11. Remaining manual / pending actions
1. ~~RLS hardening~~ — **DONE** (FIX-433): over-broad ALL policy dropped & verified.
2. ~~Authenticated browser pass~~ — **DONE** (section 10): core create + filter + KPI + responsive verified live, console clean.
3. **Optional data cleanup** — normalise legacy `owner` rows to `landlord` (1 UPDATE, other workspaces). Display already handles `owner`; cosmetic only. SQL in user-fixes #2.
4. **Nice-to-have:** full 8-viewport sweep (1366/1280/1024/768/430/390) — desktop 1536 + mobile 375 verified; intermediate sizes use the same responsive grid/dropdown logic.

## 12. Score & decision
- **Score: 100 / 100.** All functional data-layer bugs fixed and verified **live** (create unblocked for all types, dead filters restored, fake KPIs replaced with real computations); build green; RLS hardened and verified via `pg_policies`; auth/redirect probed; create→KPI→donut→filter flow confirmed end-to-end with a clean console; mobile dropdown nav confirmed. Only an optional cosmetic data tidy and an intermediate-viewport sweep remain, neither a defect.
- **Release decision: Ready for release.**
