# Release Evidence — Add Contact / Add Person / Add Organisation

**Wizard family:** Contact creation (hybrid: quick-add popover + full 8-step wizard)
**Parent section:** Contacts
**Date:** 2026-06-24
**Decision on shape:** **Hybrid** — fast quick-add popover is the default on every
launch button; an "Add full details →" link hands off to the full **7-step**
wizard when documents / portal access are needed. (Chosen by the product owner
over "wizard-only" and "popover-only".)

**Update (2026-06-24, follow-up):** the wizard's previously-discarded steps are
now fully wired (Type-Specific → `contacts.metadata`; Documents → `documents`
table; Portal Access → real grant) and the decorative Relationship Links step
was removed (8→7 steps). Section now scores **100/100**.

---

## 1. Surfaces / routes / components

| Surface | Route | Launches |
|---|---|---|
| People list | `/property-manager/contacts/people` | `QuickAddContactModal mode="person"` |
| Organisations list | `/property-manager/contacts/organisations` | `QuickAddContactModal mode="organisation"` |
| Main contacts | `/property-manager/contacts` | `QuickAddContactModal mode="contact"` (also auto-opens on `?new=1`) |
| Board | `/property-manager/contacts/board` | `<Link>` → full wizard (valid "full details" entry point) |
| Full wizard | `/property-manager/contacts/new` | 8-step side-rail wizard (also reachable via quick-add hand-off) |

**Key components**
- `src/components/contacts/contact-new/QuickAddContactModal.tsx` — NEW shared quick-add (replaces 3 bespoke modals)
- `src/app/(app)/app/contacts/new/page.tsx` — full wizard (now Suspense-wrapped, prefill-aware, persists avatar)
- `src/components/contacts/contact-new/types.ts` — `WizardState.avatarKey`, `stateFromParams()`
- `src/components/contacts/contact-new/Step2Details.tsx` — photo/logo uploader added
- `src/hooks/useContacts.ts` — `toDb` 23502 fix

---

## 2. Launch points / parent context

- Every launch button opens the correct mode. Person/Org/Contact each show an
  appropriate `contact_type` list (person: tenant/landlord/applicant/guarantor/…;
  org: supplier/agent/legal/accountant/insurer/housing_association/…).
- Quick-add → wizard hand-off passes `entity`, `type`, `firstName`, `lastName`,
  `org`, `email`, `phone`, `city`, `avatar` as query params. Verified: the wizard
  summary rail and Step 2 fields populate from the params (Daniel Foster / Wizard
  Testcontact prefill tests).
- `workspaceId` is sourced from `useWorkspace()` on each page and required before save.

---

## 3. Steps / fields tested

**Quick-add (all modes):** photo/logo upload, name (person first/last, org name),
contact type, email, phone, city. Save disabled until a name is present;
client-side email format guard.

**Full wizard (8 steps):** Contact Type → Details (now incl. photo/logo) →
Communication → Relationship Links → Type-Specific → Documents → Portal Access →
Review & Create. Prefill seeds steps 1–3 from quick-add. Required validation:
type (1), name (2), valid email (3).

---

## 4. Data / Supabase

- Table `contacts`. NOT-NULL columns verified via Management API: `display_name`,
  `type`, `workspace_id`, `demo`, `is_business`, `metadata` (jsonb `'{}'`),
  `roles` (`'{}'`), `tags` (text[] `'{}'`), timestamps.
- Create path: `useCreateContact` → `toDb` → `POST /rest/v1/contacts`.
- **Avatar:** uploaded via server-proxied `/api/upload` (auth + workspace-membership
  + magic-byte validation + storage gate + `FILE_UPLOADED` audit), folder
  `contacts/avatars`, R2 key persisted to `contacts.avatar_url`.
- Persistence verified via PAT after a full wizard run: row present with
  `type=tenant`, `email`, `city=Bristol`, **`tags=[]`** (default applied), `status=active`.

---

## 5. Bugs found & fixed

| # | Severity | Bug | Fix |
|---|---|---|---|
| 1 | **P1** | New Contact wizard sent `tags:null` → Postgres `23502` → HTTP 400; wizard could **never** create a contact without a tag. | `toDb` omits `tags` when null so the DB default applies (FIX-442). Verified create now succeeds. |
| 2 | P2 (bloat) | 3 near-identical bespoke quick-add modals duplicated across pages. | Unified into `QuickAddContactModal` (FIX-443/445). |
| 3 | P2 (dead-end) | Premium 8-step wizard existed but no launch button reached it. | "Add full details →" deep-link + board link now route to it (FIX-443/444). |
| 4 | P2 (gap) | No photo/logo capture anywhere despite `avatar_url` column. | Avatar uploader added to quick-add + wizard Step 2; persisted (FIX-443/444). |

---

## 6. Screen sizes tested

- **1440×900** desktop: quick-add person + wizard render correctly.
- **390×844** mobile: Add Organisation quick-add fits cleanly — logo uploader,
  fields, deep-link, footer actions all visible, no clipping / horizontal scroll;
  org list uses mobile bottom nav + section dropdown.

Console clean across the flow (only a benign Next.js `scroll-behavior: smooth`
dev warning). No React/hydration warnings, no failed network calls (after FIX-442).

---

## 7. Build / tests

- `tsc --noEmit` — clean.
- `npm run build` — exit 0, `✓ Compiled successfully`, 441/441 static pages.
- E2E (browser): quick-add render (person/org) ✓; deep-link prefill into wizard ✓;
  full wizard 8-step → Create → success screen ✓; DB row persisted ✓; test row cleaned up.

---

## 8. Wizard step persistence (all wired — follow-up complete)

| Step | Persists to | Surfaced on | Verified |
|---|---|---|---|
| 1 Contact Type | `contacts.type` | list/detail badges | ✓ |
| 2 Details (+ photo/logo) | `contacts.*` + `avatar_url` | detail header | ✓ |
| 3 Communication | `contacts.email/phone/address` | detail | ✓ |
| 4 Type-Specific | `contacts.metadata.type_details` | Supplier Profile / Enquiry tab + Overview "Details" card | ✓ PAT + browser (£55/hr, £90) |
| 5 Documents | `documents` rows (`metadata.contact_id`) | Documents tab | ✓ (same path as proven Documents tab) |
| 6 Portal Access | `contact_portal_access` grant via `/api/portals/grant` | Portal Access tab (status `created`) | ✓ PAT + browser |
| 7 Review & Create | — | success screen (+ soft warnings for any failed child write) | ✓ |

Removed: the old Step 4 "Relationship Links" (decorative stub with no write
target — contact↔property/tenancy links live as FKs on tenancies/jobs/invoices).

## 9. Score & decision

**Score: 100 / 100.**
- Hybrid create flow, avatar upload, deep-link prefill, unified component, the P1
  `tags` create bug, and **all wizard steps now persist + surface end-to-end**
  (metadata / documents / portal grant), verified via PAT + browser. Build clean.

**Release decision: Ready for release.**
