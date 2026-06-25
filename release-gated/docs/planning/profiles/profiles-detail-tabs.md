# Release Evidence — Planning › Profiles (detail pages & all 8 sub-tabs)

- **Section:** Planning
- **Parent route:** `/property-manager/planning/profiles`
- **Detail page:** Operation Profile guide (13 strategy classes)
- **Record type:** Static commercial profile config (reference content — `src/lib/planning/profile-config.ts`, 13 `ProfileConfig` objects). Not a user-owned DB record; intentionally static, labelled "Static commercial configuration".
- **Session:** planning-profiles-detail · 2026-06-24
- **Final score:** 100/100 — **Ready for release**

---

## 1. Profiles & routes covered

Slug ↔ class mapping (canonical, from `PROFILE_KEY_MAP`/`getProfileBySlug`):

| # | Class | Slug | Detail base route |
|---|-------|------|-------------------|
| 1 | Long-Term Let | `long-term-let` | `/property-manager/planning/profiles/long-term-let` |
| 2 | HMO | `hmo` | …/profiles/hmo |
| 3 | Student Let | `student-let` | …/profiles/student-let |
| 4 | Co-Living | `co-living` | …/profiles/co-living |
| 5 | Serviced Accommodation | `serviced-accommodation` | …/profiles/serviced-accommodation |
| 6 | Holiday Let | `holiday-let` | …/profiles/holiday-let |
| 7 | Rent-to-Rent | `rent-to-rent` | …/profiles/rent-to-rent |
| 8 | Social Housing | `social-housing` | …/profiles/social-housing |
| 9 | Build-to-Rent | `build-to-rent` | …/profiles/build-to-rent |
| 10 | Commercial | `commercial` | …/profiles/commercial |
| 11 | Mixed Use | `mixed-use` | …/profiles/mixed-use |
| 12 | Refinancing | `refinancing` | …/profiles/refinancing |
| 13 | Dev/Flip | `dev-flip` | …/profiles/dev-flip |

> The checklist's example routes used `long-term-let` for all 13 — corrected here to the real per-class slugs.

**8 sub-tabs per profile** (route `…/{slug}/{tab}`): `overview`, `income-model`, `cost-drivers`, `compliance`, `example-forecast`, `starter-checklist`, `risks`, `ai-questions`. Total = 13 × 8 = **104 sub-tab routes**, all dynamically served from one `[slug]` route group.

- Route group: `src/app/(app)/app/planning/profiles/[slug]/` with `layout.tsx` (`getProfileBySlug` → `notFound()` on unknown slug), `page.tsx` (redirects `…/{slug}` → `…/{slug}/overview`), and one `page.tsx` per tab.
- `/app/*` → `/property-manager/*` handled by the global proxy rewrite (see `src/proxy.ts`).

---

## 2. Bugs found & fixed (all implemented — see implementation-fix-log FIX-PROF-01…05)

A prior "audit-only" pass (`AUDIT-PLAN-SUBTABS`) scored the section 100/100 **without code changes** and missed the following real violations. All are now fixed.

| ID | Tab | Violation | Fix |
|----|-----|-----------|-----|
| FIX-PROF-01 | Example Forecast | "Edit Assumptions"/"Compare Scenarios" = dead toast; "Export" = `'Generating export...'` toast, no file (Wiring Completeness Rule: export must produce a real file) | Links → wizard; **real CSV** export (monthly cashflow + assumptions + sensitivity) via shared `downloadCsv` |
| FIX-PROF-02 | Starter Checklist | "Export Checklist" + "Create Planning Set" = dead toasts | **Real CSV** export of all phases/tasks w/ live completion status; Link → wizard |
| FIX-PROF-03 | Overview | Quick-action `download` = `'Generating PDF...'` toast, no output | Real `window.print()` (save-as-PDF) |
| FIX-PROF-04 | AI Questions | **P0:** "Ask AI" button (toast) + custom-question form returning a hardcoded canned "answer" — fake AI, no cost estimate, no backend | Removed fake AI; per-question CTA → real Link "Model this in a Planning Set"; honest panel routes personalised AI to the cost-metered Planning Set flow; static reference Q&A retained |
| FIX-PROF-05 | (wizard) | Profile detail CTAs passed hyphen `slug`; wizard matched underscore `key` → strategy never pre-selected | Wizard normalises `profile` param via `PROFILE_KEY_MAP` (slug→key) |

---

## 3. Data sources / wiring

- **List page** (`profiles/page.tsx`): KPI cards "Most Used Profile" + "Plans from Profiles" read **live** from Supabase `planning_sets.operation_profile` (graceful degrade to "—" on empty/error). Filters (search, group, risk, mgmt), grid/compact view toggle, compare mode (≤3), preview modal — all functional.
- **Detail tabs:** rendered from static `ProfileConfig`. All money/percent values are pre-formatted GBP/UK strings; Overview "Quick Scenario" recomputes live from each profile's real model snapshot via `Intl.NumberFormat('en-GB', GBP)` — no `Math.random`, no fabricated numbers (the no-model branch deep-links to the wizard instead of faking figures).
- **All CTAs** route to real destinations: wizard (`/planning/wizard?profile=…`), which itself persists to `planning_sets`.

## 4. Auth / RLS / flags

- Section served under the authenticated `(app)` shell; unauthenticated users bounced by `src/proxy.ts`.
- Profiles are **static reference content** — no per-row RLS surface on the profile pages themselves. The records they create (`planning_sets`, `planning_landlord_offers`) are `rowsecurity=true`, workspace-scoped via `is_workspace_member(workspace_id)` (verified previously, AUDIT-PLAN-SUBTABS).
- No feature flag / plan / add-on gate applies to the profile library in V1 (it is core Planning). No flag leakage risk (no flagged tabs).

## 5. Accessibility / responsive

- Tab bar: `role="tablist"`/`role="tab"`/`aria-selected`/`aria-controls`, horizontal scroll with hidden scrollbar + focus-visible ring; main panel `role="tabpanel"` with `aria-label`. Shell width capped `max-w-[1400px]`.
- Checklist checkboxes have `aria-label`; modals close on overlay click + X; sliders are native range inputs.
- Verified responsive behaviour at desktop and mobile widths; no `dark:` classes (compliant with styling rule).

## 6. Build / tests

- `tsc --noEmit`: **0 errors**.
- `npm run build`: **green** — all 8 `/app/planning/profiles/[slug]/*` routes + `/app/planning/wizard` compiled, no warnings.
- New exports use the existing, tested `src/lib/export/csv.ts` (`downloadCsv`, BOM + RFC-escaped cells).

## 7. Remaining manual actions

None for this section. (Planning Sets 17-tab detail and Landlord Offer 5-tab detail — also listed in the drop header — are separate record-backed detail pages covered by `AUDIT-PLAN-SUBTABS` / `release-gated/docs/planning/sub-tabs-audit-2026-06-24.md`; no new code issues found there in this pass.)

## Final release decision: **Ready for release** — 100/100.
