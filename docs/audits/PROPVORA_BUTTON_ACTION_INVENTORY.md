# PROPVORA — BUTTON / ACTION INVENTORY

> **Auto-derived 2026-06-14** by grepping `src/**` for `coming soon`, `not yet …`, `alert(`,
> `showToast/onToast`, `onClick`, and `href="#"`. Focused on the main app/admin/portal
> surfaces. **Needs a human pass** — this lists the *flagged* (stub/placeholder) actions
> exhaustively and characterises the wired ones at a section level.

## Summary
- **Dead / stub / "coming soon" actions found:** **31** toast/notice stubs + **5** dead `href="#"` links = **36 placeholder actions** (file:line below).
- The large majority of primary actions (create/edit/delete, list filters, view switches, nav, settings saves) ARE wired to Supabase mutations, routes, or API endpoints. Stubs are concentrated where an **external dependency is unconfigured** (Stripe Connect/BACS, R2 storage, email, push) or a **secondary feature** is deferred.

## Wired vs stub — by surface (level view)
| Surface | Primary actions wired? | Notes |
|---|---|---|
| Auth (`login/register/reset/forgot/2fa`) | ✅ | RHF + Supabase auth + `/api/auth/*`, `/api/email/welcome`. |
| Onboarding | ✅ (1 stub) | Workspace create wired; one option shows "Coming soon". |
| Portfolio (properties/units/tenancies) | ✅ | Create wizard + edit (RHF) → Supabase insert/update; detail actions wired except messaging note. |
| Work (jobs/tasks/ppm/suppliers) | ✅ (view-tab stubs) | CRUD wired; some non-default view tabs show "{view} coming soon". |
| Money (invoices/bills/expenses) | ⚠ partial | Core list/detail wired; several actions gated on Stripe/R2/email → stubs. |
| Accounting | ✅ (MTD flagged) | MTD page intentionally flagged off. |
| Planning (wizard/sets/profiles) | ✅ (1 stub) | 9-step wizard persists; one "Duplicate offer" stub + one OverviewTab "Quick Scenario" note. |
| Compliance | ✅ | Certificates/inspections/documents CRUD wired + uploads. |
| Legal (possession/hmo) | ✅ | Possession wizard wired. |
| Contacts | ⚠ 3 stubs | List/CRUD wired; detail has 3 "coming soon" quick actions. |
| Calendar | ✅ (2 stubs) | Events/reminders wired; settings persistence + event messaging stubbed. |
| Workspace settings | ⚠ several stubs | Most saves wired; billing `alert()`, email template editor, push notif, SSO placeholder. |
| Admin console | ✅ (1 notice) | Ops views wired; security monitoring shows "not yet wired" notice. |
| Portals (tenant/landlord/supplier) | ✅ | Grant/verify/messaging wired via `/api/portal*` and portal messaging layer. |
| Affiliate | ✅ | Link builder + settings wired. |

## Flagged actions — full list (file:line)
### Contacts
- `src/app/(app)/app/contacts/[id]/page.tsx:1346` — **Upload Document** → `onToast("Document upload coming soon")` — STUB
- `…/contacts/[id]/page.tsx:1350` — **Link Property** → `onToast("Property linking coming soon")` — STUB
- `…/contacts/[id]/page.tsx:1355` — **Send Request** → `onToast("Request feature coming soon")` — STUB

### Money
- `src/app/(app)/app/money/deposits/page.tsx:577` — **Add protection** → toast (scheme integration coming soon) — STUB
- `…/money/deposits/page.tsx:585` — **Document upload** → toast (storage integration — coming soon) — STUB
- `…/money/deposits/page.tsx:593` & `:608` — **Deposit detail / View Details** → toast (detail view coming soon) — STUB
- `src/app/(app)/app/money/invoices/[id]/page.tsx:581` — **File upload** → showToast (storage — coming soon) — STUB
- `…/money/invoices/[id]/page.tsx:593` — **Resend Invoice** → showToast (email config — coming soon) — STUB
- `…/money/invoices/[id]/page.tsx:512,534,776,779,782` — **5× `href="#"`** dead links (attachment/footer links) — DEAD LINKS
- `src/app/(app)/app/money/bills/page.tsx:491` — **Bulk Mark Paid** → showToast (needs selection — coming soon) — STUB
- `…/money/bills/page.tsx:494` — **Bulk Approve** → showToast (coming soon) — STUB
- `…/money/bills/page.tsx:497` — **Pay Supplier via BACS** → showToast (bank integration — coming soon) — STUB
- `src/app/(app)/app/money/supplier-payments/page.tsx:150` — banner "Supplier payments via Stripe Connect are not yet configured" — EXTERNAL-GATED

### Planning
- `src/app/(app)/app/planning/landlord-offers/[id]/page.tsx:255` — **Duplicate offer** → showToast (coming soon) — STUB
- `src/components/planning/profiles/tabs/OverviewTab.tsx:81` — "Quick Scenario coming soon" notice — STUB NOTICE

### Work
- `src/app/(app)/app/work/tasks/[id]/page.tsx:1014` — detail subtab "{activeTab} content coming soon" — STUB TAB
- `src/app/(app)/app/work/suppliers/[id]/page.tsx:297` — "{tab} coming soon" — STUB TAB
- `src/app/(app)/app/work/jobs/page.tsx:921` — non-default view "{view} coming soon" — STUB VIEW

### Calendar
- `src/app/(app)/app/calendar/settings/page.tsx:145` — "Full persistence coming soon" (saves locally only) — PARTIAL
- `src/app/(app)/app/calendar/events/[id]/page.tsx:373` — messaging input placeholder "Messaging coming soon…" — STUB

### Portfolio
- `src/app/(app)/app/portfolio/page.tsx:890,894` — **AI Portfolio Review** disabled, "Coming soon" — STUB
- `src/app/(app)/app/portfolio/tenancies/[id]/page.tsx:801` — "In-app messaging coming soon" — STUB

### Accounting
- `src/app/(app)/app/accounting/mtd/page.tsx:141` — "Coming soon — feature flagged off" — INTENTIONALLY FLAGGED

### Workspace settings
- `src/app/(app)/app/workspace-settings/billing/page.tsx:163` — **Open billing portal** → `alert("Stripe billing portal is not configured…")` when env unset — EXTERNAL-GATED (uses `/api/billing/portal` when configured)
- `src/app/(app)/app/workspace-settings/email/page.tsx:51` — **Template editor** → showToast (coming soon) — STUB
- `src/app/(app)/app/workspace-settings/notifications/page.tsx:203` — **Push (mobile)** option labelled "(coming soon)" — STUB
- `src/app/(app)/app/workspace-settings/sso/page.tsx:70-81` — SSO config fields are read-only placeholders — PLACEHOLDER

### Account
- `src/app/(app)/app/account/preferences/page.tsx:131` — Dark mode "not yet available" notice — INFO (intentional, no-dark-mode rule)

### Onboarding
- `src/app/(auth)/onboarding/page.tsx:526` — an onboarding option shows "Coming soon" — STUB

### Admin
- `src/app/(admin)/admin/security/page.tsx:99` — "Failed-login, rate-limit and IP-block monitoring is not yet wired" — NOTICE

### Other (non-button, for completeness)
- `src/features/work/ppm/hooks/usePpmSchedules.ts:41` — seed-data fallback comment (not a button).

## Triage guidance for P3 (click-through QA)
1. **Real dead UI to fix or hide:** contacts detail 3 stubs, money invoices `href="#"` ×5, money bills bulk actions, deposits actions, planning duplicate-offer, work view/tab stubs, calendar event messaging, portfolio AI review + tenancy messaging, ws-settings email editor.
2. **External-dependency gated (acceptable if env-driven, verify messaging):** supplier-payments, bills BACS, deposits scheme/storage, invoices upload/resend, billing portal, push notifications, MTD, admin security monitoring.
3. **Intentional / informational:** dark-mode notice, MTD flagged-off, SSO placeholder.
