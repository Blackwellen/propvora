# PROPVORA — FORM & WIZARD INVENTORY

> **Auto-derived 2026-06-14** by grepping for `useForm`/`zodResolver`/`z.object`, wizard/step
> components, and the `new`/`edit` route set. **Needs a human pass.**
> Two form patterns exist in the codebase:
> 1. **react-hook-form + zod** (`useForm`, `zodResolver`) — 11 page files + 4 API schemas.
> 2. **Manual `useState` + Supabase insert/update** — most create/edit pages (e.g. property wizard, contacts, money). Validation is inline/bespoke, not zod.

## A. react-hook-form (+zod) forms
| Where | Object | Validation | Submit target |
|---|---|---|---|
| `(auth)/login/page.tsx` | credentials | zod | Supabase `signInWithPassword` |
| `(auth)/register/page.tsx` | signup | zod | Supabase `signUp` + `/api/email/welcome` |
| `(auth)/forgot-password/page.tsx` | email | zod | Supabase reset email |
| `(auth)/reset-password/page.tsx` | new password | zod | Supabase `updateUser` |
| `(app)/app/account-settings/page.tsx` | profile | RHF | `profiles` update |
| `(app)/app/contacts/[id]/edit/page.tsx` | contact | RHF (`register`) | `contacts` update |
| `(app)/app/portfolio/properties/[id]/edit/page.tsx` | property | RHF | `properties` update |
| `(app)/app/portfolio/tenancies/[id]/edit/page.tsx` | tenancy | RHF | `tenancies` update |
| `(app)/app/portfolio/units/[id]/edit/page.tsx` | unit | RHF | `units` update |

### API-side zod schemas (server validation)
`/api/ai/chat`, `/api/ai/actions`, `/api/newsletter/subscribe`, `/api/account/request`, `/api/demo/seed`, `/api/demo/reset` — all `safeParse` request bodies before acting.

## B. Multi-step wizards
| Wizard | Where | Steps | Persist / submit | Mobile risk |
|---|---|---|---|---|
| **Deal Planning Wizard** | `(app)/app/planning/wizard` + `/[draftId]`; `components/planning/wizard/` | 9 — Profile · Basics · Income · Expenses/Bills · Upfront/Compliance · LL-Offer · Forecast · Risk/AI-Review · Review/Create | `WizardContext` reducer → Supabase (drafts + planning sets); `WizardLiveSummary` side panel | ⚠ HIGH — side-by-side live-summary + many numeric line-item tables; needs stacked mobile layout (P2) |
| **Possession-case Wizard** | `(app)/app/legal/possession/new/*`; `components/legal/PossessionWizardShell.tsx` | Select-tenancy · Select-grounds · Review-evidence · Record-service · Notice-preview | per-step routes → possession case record | ⚠ MED — evidence/grounds checklists; preview pane |
| **Property create "wizard"** | `(app)/app/portfolio/properties/new/page.tsx` | multi-step `useState` (step 1..n) | Supabase `properties` insert + `property_units` insert → redirect to detail | MED — multi-section single page |

## C. Create / edit forms (manual `useState` + Supabase, unless noted RHF above)
| Object | Create route | Edit route | Submit |
|---|---|---|---|
| Property | `portfolio/properties/new` (wizard) | `…/[id]/edit` (RHF) | insert/update `properties` |
| Unit | `portfolio/units/new` | `…/[id]/edit` (RHF) | `units` |
| Tenancy | `portfolio/tenancies/new` | `…/[id]/edit` (RHF) | `tenancies` |
| Contact | `contacts/new` | `…/[id]/edit` (RHF) | `contacts` |
| Job | `work/jobs/new` | (inline on detail) | `jobs` |
| Task | `work/tasks/new` | (inline on detail) | `tasks` |
| PPM schedule | `work/ppm/schedules/new` | – | ppm schedules |
| Invoice | `money/invoices/new` | `…/[id]/edit` | `invoices` |
| Bill | `money/bills/new` | `…/[id]/edit` | `bills` |
| Certificate | `compliance/certificates/new` | `…/[id]/edit` | `compliance_certificates` |
| Inspection | `compliance/inspections/new` | `…/[id]/edit` | inspections |
| Compliance document | `compliance/documents/new` | – | documents + `/api/upload` |
| Calendar event | `calendar/events/new` | `…/[id]/edit` | events |
| Reminder | `calendar/reminders/new` | – | reminders |
| Planning set | `planning/sets/new` | `…/[id]` subtab forms | planning sets |
| Landlord offer | `planning/landlord-offers/new` | (detail; duplicate stubbed) | landlord_offers |
| Account (chart) | `accounting/accounts/new` | `…/[accountId]` | accounts |
| Disbursement | `accounting/client-accounts/disbursements/new` | – | client accounts |
| Manual transaction | `accounting/reconciliation/manual-transaction/new` | – | transactions |
| Forecast scenario | `accounting/forecast/scenarios/new` | – | scenarios |
| Report | `accounting/reports/generate` | – | – |
| Possession case | `legal/possession/new` (wizard) | `…/[caseId]` | possession cases |

## D. Public / portal / settings forms
| Form | Where | Validation | Submit |
|---|---|---|---|
| Contact sales | `contact/ContactClient.tsx` | inline | (lead capture) |
| Newsletter signup | `components/marketing/NewsletterSignup.tsx` | consent + Turnstile (server zod) | `/api/newsletter/subscribe` |
| Affiliate apply | `affiliate-programme/apply` | inline | (application) |
| Affiliate link builder | `(affiliate)/affiliate/links` | inline | link generation |
| Affiliate settings | `(affiliate)/affiliate/settings` | inline | affiliate profile |
| E-signature | `sign/[token]/page.tsx` | inline (name match) | signature record |
| Tenant maintenance request | `(tenant)/tenant-portal/maintenance` | inline | maintenance request |
| Tenant/Landlord message | `*/messages` pages | inline | portal messaging layer |
| Supplier quote/invoice | `(supplier)/supplier-portal/jobs/[id]` | inline (amount) | quote/invoice |
| Grant portal access | `components/portals/GrantPortalAccessModal.tsx` | inline | `/api/portals/grant` |
| Team invite | `workspace-settings/team` | inline | `/api/email/invite` |
| Account SAR/deletion | `account/data-privacy` | password re-auth | `/api/account/request` |
| Bug report | client bug catcher | sanitised | `/api/bug-report` |

## Mobile-layout risk flags (best-effort, for P2)
- **HIGH:** Planning wizard (live-summary split), planning-set line-item subtabs (income/expenses/bills/rooms-units — wide numeric tables), money invoice/bill create (line items), contact edit (many sections incl. budget grids).
- **MED:** Possession wizard, property create wizard, accounting reconciliation, calendar event form.
- **LOW:** auth forms, settings single-field forms, message composers.
