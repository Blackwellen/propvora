# Seed Data Log

Last updated: 2026-06-20

> Documents what test data exists in the database per persona, and what is missing.

## User Accounts

| Email | Role | Plan | Workspace | Data Present | Notes |
|---|---|---|---|---|---|
| jamahlthomas1996@gmail.com | Property Manager | Enterprise | JT Properties | ✅ Full: 16 properties, 8 tenancies, £10,465 rent roll, 15 open work items, 3 compliance due | Primary QA account |
| supplier.qa@propvora.test | Supplier | Solo | Supplier QA Ltd | ✅ Partial: 8 requests, 5 jobs, some earnings data | Supplier QA |
| — | Customer | — | — | ❌ No customer test account | Needed for CUS section QA |
| — | Admin | ADMIN | — | ❌ Admin credentials not stored here | Needed for ADM section QA |

## Portal Sessions

| Type | Session ID | Status | Notes |
|---|---|---|---|
| Tenant Portal | — | ❌ Missing | Need to generate magic link from PM workspace |
| Landlord Portal | — | ❌ Missing | Need to generate from PM portals hub |
| Supplier Portal | — | ❌ Missing | Need to generate from PM work/jobs |

## Data Gaps

| Area | Gap | How to Resolve | Priority |
|---|---|---|---|
| Customer workspace | No test account | Register new customer at /register | P1 |
| Tenant portal | No active session | PM generates portal link from /property-manager/portals | P1 |
| Landlord portal | No active session | PM generates portal link from portals hub | P1 |
| Supplier portal | No active session | PM generates supplier portal from work/jobs | P2 |
| Admin | No admin account credentials | Check .env.local or Supabase auth.users | P1 |
| Supplier team | No team-plan account | Apply supplier migration + set plan_type='team' in DB | P2 |

## Data Seeding Notes

- Live Supabase schema (not local) — seed data changes affect production
- Do NOT delete or modify existing property/tenancy data owned by jamahlthomas1996@gmail.com
- Customer/portal sessions can be created non-destructively
- To create a tenant portal session: PM home → Portals → select a tenancy → Generate access link
