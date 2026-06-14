# Data Map

Controller: Blackwellen Ltd (Propvora), ICO ZC160806.

## Personal data categories held

| Category | Examples | Subjects | Primary store |
|----------|----------|----------|---------------|
| Account identity | name, email, hashed password, avatar | Users (operators) | Supabase `auth.users`, `profiles` |
| Workspace membership | role, workspace link | Users | Supabase `workspace_members`, `workspaces` |
| Contacts | tenant/landlord/supplier/agent name, email, phone, address | Operator's contacts (third parties) | Supabase `contacts` |
| Tenancy data | tenancy terms, rent, deposit, dates | Tenants | Supabase `tenancies`, `money_*` |
| Communications | portal messages, support tickets | Users, tenants, suppliers | Supabase `messages`, `message_threads`, support tables |
| Files / evidence | documents, job photos, certificates | Operators, tenants, suppliers | Cloudflare R2 (private) + `files`/`documents` metadata in Supabase |
| Billing | Stripe customer id, subscription state | Account owners | Stripe + Supabase `workspaces` (ids only; no card data) |
| Connect payouts (flagged off) | owner's connected Stripe account id/status | Account owners | Stripe + `stripe_connect_accounts` |
| AI usage | prompts, responses, token metering | Users | Supabase `ai_chat_*`, `ai_usage_metering` |
| Audit/security | actions, IP, user agent | Users, admins | Supabase `audit_logs`, rate-limit tables |
| Lifecycle requests | deletion/export requests | Users | Supabase `account_deletion_requests`, `data_export_requests` |

## Where data lives (systems)
- **Supabase** (EU/UK region) — primary database, auth, row-level security.
- **Cloudflare R2** — private file/object storage (signed/proxied access only).
- **Stripe** — subscription billing; (Connect, flagged off) owner payouts.
- **Resend** — transactional email delivery.
- **AI provider (OpenAI, model gpt-4o-mini)** — AI Copilot prompts/responses.
- **Vercel** — application hosting/edge.
- **Companies House API** — outbound company lookups (no personal data sent in).

## Card data
Propvora does **not** store card numbers. All card handling is by Stripe (PCI DSS).

## Special category data
Not intentionally collected. Free-text fields (notes) could contain it; covered by
minimisation guidance and retention/erasure controls. See retention-schedule.md.
