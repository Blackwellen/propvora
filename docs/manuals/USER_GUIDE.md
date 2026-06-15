# Propvora — User Guide

This guide covers the main application at `/app`, section by section. It describes the
real flows that exist in the build; it is deliberately screenshot-free.

Propvora is organised as a **workspace** (your portfolio/agency) that you and your team
belong to. Everything you see is scoped to your workspace — row-level security in the
database guarantees you never see another workspace's data. Most sections share the same
shell: a left section nav, saved views, filter bars, and a `⌘K` command palette.

---

## Getting started

1. **Register** at `/auth` (or `/register`) and confirm your email.
2. **Onboarding** creates your first workspace. You can optionally **seed demo data** so
   the app is populated with realistic example properties, tenancies, money and work —
   useful for a guided first look. Demo data can be reset at any time from
   *Workspace Settings → Demo data*.
3. **Switch workspaces** from the workspace switcher if you belong to more than one.
4. The **Guided Help** engine offers contextual walkthroughs as you move through sections.

---

## Home dashboard

The landing screen surfaces live KPIs from your workspace (occupancy, arrears, upcoming
compliance, open work) and quick-action buttons that deep-link into the relevant create
flows. Empty states guide you to your first record when a workspace is new.

---

## Portfolio

Your properties, units and tenancies.

- **Overview** — KPI tiles (properties, units, occupancy, value) linked to real routes.
- **Properties list** — live from your portfolio; create via the **new property wizard**,
  which saves on its final step.
- **Property detail** — tabs for Units, Tenancies, Compliance, Money, Work, Documents,
  Contacts and Activity, all scoped to that property.
- **HMO view** — room-level breakdown computed from live units, with HMO KPIs.
- **Units / Tenancies detail** — full records with dynamic breadcrumbs.
- **Leasing** — Vacancies, Prospects, Viewings and Agreements sub-tabs.
- **Map view** — your properties plotted on a Leaflet/OpenStreetMap map.

---

## Money

Day-to-day cash in and out.

- **Overview** — live KPIs and quick-create modals.
- **Income / Expenses** — live lists with CSV export.
- **Invoices** — list and per-invoice detail; create flow wired to the database; invoice
  PDFs are generated server-side (`/api/pdf/invoice/[id]`).
- **Bills** — list and create; supplier bills tracked through to payment.
- **Arrears** — outstanding rent surfaced from live data (also exposed via `arrears_view`).
- **Deposits** — deposit tracking with a guided create flow.

---

## Work

Tasks, jobs and planned maintenance.

- **Tasks** — list, board (kanban) and detail with checklists, comments, dependencies,
  attachments and activity.
- **Jobs** — list and detail with Quotes, Costs, Comms, Documents, Activity and Supplier
  tabs; assign jobs to suppliers and track them to completion.
- **PPM** — planned preventative maintenance schedules.
- **Suppliers** — your supplier directory, ratings and preferred suppliers.

---

## Compliance

Stay on top of safety and regulatory obligations.

- **Overview** — KPIs including an *expiring soon* count.
- **Certificates** — live register; create flow saves gas/EPC/electrical and other
  certificates with expiry tracking.
- **Inspections** — scheduled and recorded property inspections.
- **Coverage** — per-property coverage view; empty until you add properties.

---

## Planning

Model deals and scenarios before committing capital.

- **Sets** — saved planning sets, each with income/expense lines, scenarios, sensitivity
  runs and upfront costs (the detail view carries a full set of analysis tabs).
- **Profiles** — landlord planning profiles and offers.
- **Wizard** — a multi-step flow that creates a real planning set on completion.

---

## Legal

Possession and regulatory tooling — **review-only drafting aids, never legal advice.**

- **Possession** — case list and a guided **possession wizard**. The wizard runs
  validity checks against your live tenancy/compliance/deposit data and records a
  *validity snapshot* on the case. Every output is watermarked **DRAFT** and carries a
  legal disclaimer.
- **Court bundle** — assembles a chronological, paginated draft bundle (printable HTML)
  to hand to a solicitor. The app never files anything.
- **RRA 2026 checklist**, **HMO licences**, **EPC advisory** — current regulatory
  trackers. Outdated Section 21 ("no-fault") language has been removed in favour of
  honest, route-aware guidance.

> Validity checks surface *warnings to consider*. A passing check is never a guarantee
> a notice is valid — only a qualified solicitor can confirm that.

---

## Accounting

A canonical **double-entry ledger** sitting under the money sections.

- **Accounts** — chart of accounts; create accounts with live inserts.
- **Reconciliation** — match transactions; *Mark Reconciled* writes back.
- **Reports** — P&L, Trial Balance, Balance Sheet and Cash Flow tabs.
- **Forecast** — projections with **actuals overlaid** from `money_transactions`.
- **Client accounts** — ring-fenced client-money accounting.
- **MTD** — Making Tax Digital submission surface (configuration-gated).

The ledger enforces real accounting rules at the database: posted entries must balance
(debits = credits), need at least two lines, and are **immutable** — corrections are
made by reversal, never by editing. Amounts are integer pence throughout.

---

## Automations (Smart Rules)

A trigger → condition → action engine that is **review-first by design**.

- Build rules from a catalogue/template library, or from scratch.
- `evaluateWorkspace()` checks enabled rules against live data and creates runs for new
  matches. A stable de-dupe key stops the same record re-firing.
- Rules marked **review-required** create a `pending_review` run that waits for a human
  to **Approve** or **Skip**. Only non-review rules auto-execute their (safe) action.
- A run log records every evaluation, decision and outcome for audit.

Automations are feature-flagged and plan-gated.

---

## Contacts

People and organisations.

- **People / Organisations** — live lists from `contacts`, with detail tabs (activity,
  notes, links, portal access) and full create/edit forms.
- Contacts link across the app — to properties, tenancies, jobs and portal grants.

---

## Calendar

- **Main view** — events from `calendar_events` with an empty state when clear.
- **Event wizard** — a multi-step create flow that saves to the database.
- **Event detail / edit** — load, edit and delete events.
- **Reminders** — events due within the next 7 days.
- **Settings** — iCal feed configuration.

---

## Messages

In-app messaging across the workspace and with portal users. Threads use the live
`message_threads` / `messages` model (a single schema-correct data layer powers tenant,
landlord and supplier conversations). Compose, reply and attach files.

---

## AI Copilot

A workspace-aware assistant, opened from anywhere via the Copilot panel or `⌘K`.

- It answers using **your workspace context** and cites the records it used.
- It can propose **actions**, which run through an allow-list and a human-approval queue
  for anything sensitive — the AI never silently mutates your data.
- Every call passes through a server-side gateway (keys never reach the browser) with
  **hard usage caps** (per-window request/token limits and a monthly cost budget) and a
  per-tier **gate** (AI Copilot is a Scale+ feature). Usage is metered to a ledger.
- Outputs carry an AI disclaimer; the Copilot is an assistant, not an authority.

---

## Portals (sharing out of the workspace)

From inside the app you can grant external people scoped access to specific records —
see the companion **Portal Guide** for the tenant/landlord/supplier portals and the
magic-link **recipient share links** (`/p/[token]`) for sending a single invoice, job or
document pack to someone without an account.

---

## Account & workspace settings

- **Account** — profile, security and **TOTP MFA** enrolment; GDPR data-export and
  account-deletion requests (re-authenticated).
- **Workspace Settings** — profile, **team** (invite members), **roles & permissions**,
  **billing** (opens the Stripe portal), **integrations** (live status from your env),
  **audit log**, **demo data**, and a danger zone for workspace deletion.

---

## Plans at a glance

| Plan | Properties | Seats | AI Copilot | Advanced reports |
|---|---|---|---|---|
| Starter | 5 | 1 | – | – |
| Operator | 25 | 3 | – | ✓ |
| Scale | 100 | 10 | ✓ | ✓ |
| Pro / Agency | 500 | 25 | ✓ | ✓ |
| Enterprise | Unlimited | Unlimited | ✓ | ✓ (SSO, custom limits) |

Limits and gated features are enforced **server-side**; exceeding a limit or using a
feature not on your plan returns a clear upgrade prompt.
