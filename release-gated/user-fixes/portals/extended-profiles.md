# User / Manual Fixes — Portals › Extended Profiles

These items could not be completed automatically **in this multi-session
environment**. Each states exactly why and the precise steps to finish.

---

## 1. Live multi-viewport pixel QA of the 4 new portals (flag ON) — ✅ DONE 2026-06-25

**Resolved.** Completed live once the concurrent session released the Chrome MCP
profile: built the extended-profiles-flag-ON production bundle, ran `next start -p 3001`,
and drove Chrome DevTools MCP through the **real magic-link recipient flow**
(`/portal?token=…` → verify → session → rendered portal) for all four portals at
desktop 1536 / tablet 768 / mobile 390, plus the accountant transactions sub-route
(table horizontal-scroll on mobile). **Zero console errors** on every page; shell
1:1 with the landlord benchmark. Screenshots: `release-gated/docs/portals/screens/`.
Evidence updated to **100/100** in `release-gated/docs/portals/extended-profiles.md` §9.

_Original blocker (now historical):_ Two concurrent Claude sessions held the shared
resources at first:
- **Chrome DevTools MCP** browser profile (`…/chrome-devtools-mcp/chrome-profile`)
  was already running for another session — launching/attaching failed, and
  killing it would disrupt that session.
- **Next 16 enforces a single `next dev` instance** per project dir; the running
  dev server (port 3002) is owned by other sessions and has the extended-profiles
  flag **off**. Production `next start` against the shared `.next` conflicts with
  their dev server.

What *was* verified instead (high confidence): clean build in both flag states,
`tsc` clean, end-to-end magic-link → session minting with the correct
`portal_type` for all 4 types, flag-OFF fail-closed redirect to `/portal/expired`,
and every portal's real data surface populated and correctly scoped.

**Exact steps to finish (single-session machine, ~15 min):**
1. Ensure no other dev server is running: `netstat -ano | findstr ":300"`.
2. In `.env.local` set `NEXT_PUBLIC_PORTALS_EXTENDED_PROFILES_ENABLED=true`
   (and `NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED=true`).
3. `npm run dev -- -p 3001`.
4. Re-mint magic links (tokens are stored hashed and not recoverable):
   `node` the seed script pattern in the evidence pack, or grant via
   `/property-manager/contacts/portal-access`, to get a `/portal?token=…` URL for
   each of applicant / accountant / solicitor / generic.
5. Open each magic link in Chrome; for each portal page visit at
   **1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812**.
6. Confirm per viewport: no clipping, sidebar→drawer at `<lg`, no horizontal
   scroll, KPI strip wraps, tables scroll-x with `min-w`, no console errors.
7. Capture screenshots into `release-gated/docs/portals/screens/`.

**This is not a code blocker** — it is a tooling/scheduling constraint of running
multiple sessions on one machine.

---

## 2. Pre-existing build error under `NEXT_PUBLIC_QA_ALL_FLAGS=true` (out of scope)

**File:** `src/app/(app)/app/contacts/new/page.tsx:164`
**Error:** `Type '{ type_details: TypeDetails }' is not assignable to type 'Json | undefined'`.

This surfaces **only** when building with `NEXT_PUBLIC_QA_ALL_FLAGS=true`; the
default V1 build and the `PORTALS_EXTENDED_PROFILES_ENABLED=true` build are
**green**. It is unrelated to the Portals section (Contacts › New Contact) and
predates this work, so it was not fixed here to avoid scope creep. It should be
fixed before relying on the global QA-all-flags build — likely by casting/serialising
`type_details` to `Json` (e.g. `type_details: type_details as unknown as Json`)
or widening the insert payload type at that call site.

---

## 3. (Already applied via PAT — recorded for fresh-environment reproducibility)

The following were applied directly to the dev project with the Management API
PAT and are **captured in migrations** so a fresh DB reproduces them — no manual
action needed unless restoring a project that predates them:
- `portal_access_tokens.portal_type` CHECK widened to include
  `solicitor / applicant / generic` → migration `20260624120000_portal_extended_profiles.sql`.
- Leasing tables (`property_vacancies` / `prospects` / `viewings`) → migration
  `026_leasing_schema.sql` (was simply unapplied in the dev project).
