# Propvora — Master Release To-Do List

**Last updated:** 2026-06-26  
**Scope:** All remaining founder/external actions across every section. Items that Claude Code can action independently are marked 🤖 — provide access and they can be done without you.

---

## P1 — Must complete before go-live

### 1. Vercel Environment Variables 🔑 (partially resolved — see below)
**Sections affected:** Workspace Settings billing portal, AI Copilot, Stripe, SMTP

| Variable | Status | Why |
|----------|--------|-----|
| `STRIPE_PORTAL_CONFIGURATION_ID` | ✅ Added to Production (2026-06-26) | Billing portal |
| `STRIPE_PORTAL_RETURN_URL` | ✅ Added to Production (2026-06-26) | Return after portal |
| `STRIPE_PMC_SUBSCRIPTIONS` | ✅ Added to Production (2026-06-26) | Checkout PMC |
| `STRIPE_PMC_STAY_BOOKINGS` | ✅ Added to Production (2026-06-26) | Booking PMC |
| `STRIPE_PMC_INVOICE_PAYMENTS` | ✅ Added to Production (2026-06-26) | Invoice PMC |
| `STRIPE_PMC_MARKETPLACE` | ✅ Added to Production (2026-06-26) | Marketplace PMC |
| `NEXT_PUBLIC_FF_STRIPE_CONNECT` | ✅ Added to Production (2026-06-26) | Supplier payments flag |
| `NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED` | ✅ Added to Production (2026-06-26) | Portal routes |
| `STRIPE_SECRET_KEY` | ✅ Already set (live key) | Stripe billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Already set (live key) | Client Stripe |
| `STRIPE_WEBHOOK_SECRET` | ✅ Already set | Webhook verification |
| `RESEND_API_KEY` | ✅ Already set | Email delivery |
| `RESEND_FROM_EMAIL` | ✅ Already set | Email sender |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Already set | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Already set | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Already set | Supabase server |
| `AZURE_OPENAI_API_KEY` | ❌ Not set — needs Azure Portal | AI routing |
| `AZURE_OPENAI_ENDPOINT` | ❌ Not set — needs Azure Portal | AI routing endpoint |
| `AZURE_OPENAI_API_VERSION` | ❌ Not set — needs Azure Portal | API version |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from .env.local)* | Supabase server |

---

### 2. Azure OpenAI resource creation 🔑 (Microsoft Azure Portal — ~20 min)
**Section:** AI Copilot, Intelligence Layer  
**Why:** AI gateway prefers Azure EU (GDPR data residency); falls back to NVIDIA Llama until keys are set.

1. Azure Portal → create **Azure OpenAI** resource in **Sweden Central** or **France Central** (EU Data Boundary).
2. In Azure AI Foundry, create deployments named **exactly**: `gpt-5.4-nano`, `gpt-5.4-mini`, `gpt-4o-mini`, `gpt-4o` (must match the `ai_models.model_id` rows already in the DB).
3. Copy the **Endpoint** + **Key** from Keys & Endpoint blade.
4. Add `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_VERSION` to Vercel (see item 1).
5. Sign the **Microsoft DPA** and confirm EU Data Boundary in your Azure agreement.

**Until done:** AI works via NVIDIA Llama (default fallback, already configured).

---

### 3. Admin MFA enrolment 🔑 (manual — requires TOTP app)
**Section:** Platform Admin (`/bw-console-x9f3`)  
**Why:** Admin console has cross-workspace access. MFA is a P1 security baseline. Posture score capped at 70/100 without it.

1. Sign in to `/bw-console-x9f3` as each admin account (start with `jamahlthomas1996@gmail.com`).
2. Go to **Account settings → Security → Enable two-factor authentication**.
3. Scan the QR code with an authenticator app (Google Authenticator / Authy / 1Password).
4. Enter the 6-digit code to confirm enrolment.
5. Repeat for all admin accounts.
6. Confirm `/admin/security` shows all accounts ✅ — posture score rises to ~90/100.

---

### 4. Stripe Connect OAuth — supplier payout onboarding 🔑 (Stripe Dashboard)
**Section:** Money → Supplier payouts, Marketplace  
**Why:** Suppliers need a Connect Express account before `Pay via Stripe` buttons on invoices/disputes can settle funds. The "Pay via Stripe" button code is wired and live — it checks Connect status before redirecting.

1. Stripe Dashboard → **Connect → Settings** → enable Express accounts for UK.
2. Set the `STRIPE_CLIENT_ID` (`ca_...`) env var in both `.env.local` and Vercel.
3. Each supplier completes the Stripe Express onboarding flow (bank details, identity verification).
4. Test by creating a marketplace dispute payout in dev — confirm the Connect session URL redirects correctly.

**Note:** `STRIPE_CLIENT_ID` in `.env.local` is currently empty.

---

## P2 — Complete within first week of go-live

### 5. AI web/market search API key 🤖 (can wire once key provided)
**Section:** AI Copilot — web search and market comparables tools  
**Why:** `web.search` and `market.comparables` Copilot tools are correctly stubbed off pending an external search provider.

**Options (pick one):**
- `TAVILY_API_KEY` — [tavily.com](https://tavily.com) — best for AI web search (~$0.01/search)
- `SERPER_API_KEY` — [serper.dev](https://serper.dev) — Google search proxy
- `BRAVE_API_KEY` — [brave.com/search/api](https://brave.com/search/api/) — privacy-respecting

Once you add the key to Vercel, tell Claude Code — the tool wiring can be completed in code without further founder input.

---

### 6. ✅ RESOLVED — Translation strings seeding (2026-06-27)
**Section:** Admin → Global Translations (`/admin/global/translations`)  
**Status:** Closed. 1,484 rows seeded across 22 locales (en-GB approved, 21 others as `machine` pending review). The admin translations page now shows the full string list with machine translations in the review queue. Completeness for non-en-GB locales shows 0% until admins approve strings — this is correct behaviour.

---

### 7. ✅ RESOLVED — Non-GB legal copy needs no solicitor (founder decision 2026-06-26)
**Section:** Legal, Compliance, Portals  
**Founder decision (2026-06-26):** "We don't do anything legal with promises." Propvora makes
**no legal-advice claims** anywhere — non-GB jurisdictions render generic, non-advisory record/
document/evidence-tracking copy behind the permanent `NotLegalAdviceNotice` disclaimer. Because
nothing presented is legal advice or a legal promise, **no qualified-solicitor review is required**
for V1.

**State:** The jurisdiction engine (`src/lib/legal/jurisdiction.ts` + `src/lib/compliance/requirements.ts`)
already serves `generic` non-advice copy for Scotland/IE/AU/NZ/etc., each gated behind the
dismissible "not legal advice" notice. No code change, no legal review — closed for V1.
(If reviewed statutory packs are ever promoted to authoritative, *that* would re-introduce a
review gate — but the V1 generic non-advice posture does not.)

---

### 8. ✅ RESOLVED — Compliance packs data backfill (verified no-op 2026-06-26)
**Section:** Compliance → Compliance packs  
**Status:** Closed. A read-only Management-API check on 2026-06-26 confirmed all 15
workspaces already have `settings.countryCode` aligned to `business_country_code`
(15× GB/GB, no nulls, no US row). The backfill UPDATE matches 0 rows — no production
write needed. FIX-473 keeps future saves aligned go-forward. See
`release-gated/user-fixes/legal/compliance-packs-v1.md` for the verification record.

---

## P3 — Phase 1.5 / post-launch polish

### 9. ◑ PARTIAL — Full 8-viewport screenshot matrix 🤖 (2026-06-26)
**Sections affected:** Money detail pages, Portals, Work sub-tabs, Messages  
**Progress (2026-06-26):** Archive started under `release-gated/docs/screenshots/visual-regression/`.
- **Money** — ✅ all 8 viewports captured (clean: KPI strip, cashflow chart, mobile 2-up stacking + bottom tab bar).
- **Portals** — ✅ complete (pre-existing 9-size archive).
- **Work jobs** — ◑ 1536 captured clean (+ prior work-overview at 4 sizes); Messages — ◑ not captured.

**Blocker (environmental, not code):** the run hit a machine-memory ceiling — a concurrent
`next build` OOM'd (V8 code 134) and killed the dev server, then Chrome `captureScreenshot`
calls timed out under memory pressure. **Re-run with a single dev server and no competing
build** to finish Work + Messages. Procedure documented in
`release-gated/docs/screenshots/visual-regression/README.md`. No code changes involved.

---

### 10. BYOK (Bring Your Own Key) encryption — Enterprise feature 🔑
**Section:** AI Copilot → workspace-settings/ai  
**Why:** `ai_workspace_keys.key_ciphertext` column exists but the encrypt/decrypt helper + Enterprise settings UI are not built (Phase 1.5).

**Decision:** Do not advertise BYOK until built. The Enterprise plan description should not mention BYOK until Phase 1.5 is deployed.

---

### 11. AI document extraction / OCR pipeline 🔑 (new provider)
**Section:** AI Copilot — `doc.extract` tool  
**Why:** Reading uploaded certificates (EICR/Gas/EPC) requires an OCR/extraction provider. Not built.

**Options:** `unpdf`/`pdf-parse` for text-based PDFs; or a vision-capable model + pipeline for scanned images. This is a Phase 1.5 feature — not blocking V1.

---

### 12. Visual QA — Messages full 8-viewport matrix 🤖 (Chrome MCP)
**Section:** Messages & Notifications  
**File:** `release-gated/user-fixes/messages/live-visual-qa.md`  
**Why:** Live QA confirmed zero defects but the full 8-viewport screenshot archive was not captured.
**Status (2026-06-26):** Folded into item 9's archive run; not captured this run (memory-ceiling
blocker — see item 9). Re-run with a single dev server to complete. No code changes involved.

---

### 13. Work section — duplicate property row merge
**Section:** Work wizards  
**Why:** `W-WIZ-OPEN-06` — 2 duplicate property rows exist in the dev database that cannot be safely merged automatically (cannot infer which is the canonical record).

**Action:** Review the 2 property rows in Supabase and either delete the duplicate or merge tenancies/tasks to the canonical record. See `release-gated/user-fixes/work-wizards.md` for the row IDs.

---

## Resolved ✅ (reference only)

| Item | How resolved | Date |
|------|-------------|------|
| Stripe Payment Method Configurations | 4 PMCs wired (subscriptions/invoices/stays/marketplace), committed `5965886e` | 2026-06-27 |
| Vercel env vars (Stripe + portal) | STRIPE_PMC_*, STRIPE_PORTAL_*, FF_STRIPE_CONNECT, PORTALS_EXTERNAL_ENABLED added | 2026-06-27 |
| Translation strings seed | 1,484 rows across 22 locales seeded via PAT | 2026-06-27 |
| DB migration: branding/white-label columns | Applied via PAT | 2026-06-26 |
| Stripe billing portal configuration | Created `bpc_1TmgdoAHC49xkmre1uLDjg2O` via API | 2026-06-26 |
| SMTP delivery test | Confirmed via Resend (email ID: 3bc573a5...) | 2026-06-26 |
| Azure AI provider DB row | Already seeded (azure + 4 models in `ai_models`) | Prior session |
| Admin changelog first entry | FIX-A08 — inserted via PAT | 2026-06-26 |
| Admin operations table migrations | FIX-A07 — applied via PAT | 2026-06-26 |
| Portal leasing tables | Applied via PAT | Prior session |
| Money RLS test suite | `scripts/test/money-rls.mjs` — 24/24 pass | Prior session |
| Money deposit "Unknown Tenant" | Backfilled via PAT | Prior session |

---

## Quick-action summary for next session

To complete the maximum number of outstanding items in one session, provide:
1. **Vercel API token** → Claude Code pushes all env vars automatically
2. **Azure OpenAI key + endpoint** → Claude Code sets them in Vercel + updates `.env.local`
3. Say **"seed translation strings"** → Claude Code scans and seeds en-GB rows
4. Say **"apply compliance packs backfill"** → Claude Code runs the SQL via PAT
5. **Add one web search API key** (Tavily/Serper/Brave) → Claude Code wires the tool

Items 3–4 can be done right now without any additional access.
