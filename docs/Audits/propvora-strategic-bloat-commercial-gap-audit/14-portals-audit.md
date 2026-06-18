# 14 — Portals Audit (Tenant / Landlord / Supplier / Customer)

**Status:** Draft · 2026-06-18 · Author: platform/data architect
**Conforms to:** `_shared-strategic-brief.md` (Layer **B** for tenant/landlord/supplier portals = "the retention engine, KEEP"; customer/guest = Layer **D**, V2; route target ~25 visible portal routes).
**Sources:** `src/app/(portal)/**`, `(tenant)/**`, `(landlord)/**`, `(supplier)/supplier-portal/**`, `(customer)/**`, `src/lib/portal/{session,verify,flags,messaging,share,...}.ts`, `src/app/api/portal/verify/route.ts`.

---

## 0. Verdict

Propvora ships **two parallel portal implementations**, and conflating them is the main risk:

1. **Authenticated workspace-member portals** — `(tenant)/tenant-portal/*` (8), `(landlord)/landlord-portal/*` (8), `(supplier)/supplier-portal/*` (7). These run **inside** the app auth/RLS model (a portal user who is a `workspace_members` row, or a sub-membership). They are the operator's *in-product* extension surfaces.
2. **External magic-link portals** — `(portal)/portal/[sessionId]/{tenant,landlord,supplier}/*` (≈35 page files) + `/p/[token]` redeem + login/expired/revoked. These have **no Supabase session**; authorization is `portal_sessions` + `src/lib/portal/session.ts` (service-role, app-scoped). **Gated OFF** by `isExternalPortalEnabled()` (`NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED !== "true"` → disabled, fail-closed).

**Tenant/landlord/supplier portals are Layer B and essential-for-operator-SaaS — they are NOT a separate platform bet.** Their value is **operator retention**: a landlord who logs into Propvora's landlord portal to see their statements, and a tenant who reports maintenance through the tenant portal, are reasons the *operator* keeps paying. The **customer/guest workspace is the separate platform bet** (Layer D, consumer marketplace) — defer.

**Session model is sound:** 8-hour TTL (`SESSION_TTL_SECONDS = 60*60*8`, clamped to token expiry), HMAC-signed httpOnly cookie, SHA-256 token-hash lookup, revoke + expiry fail-closed, URL-`sessionId`-bound (`getSessionForRoute` rejects cookie-A-replayed-on-route-B). This is the correct design for an unauthenticated external surface.

---

## 1. Portal-by-portal

### 1.1 Tenant portal — **Layer B · V1 · ESSENTIAL**
Authenticated `(tenant)/tenant-portal/*`: `page` (home), `tenancy`, `rent`, `maintenance`, `documents`, `messages`, `viewings`, `settings` (8).
Magic-link `(portal)/portal/[sessionId]/tenant/*`: `page`, `tenancy`, `payments` (+`[paymentId]`), `maintenance` (+`[requestId]`, `report`), `documents`, `messages`.

| Dimension | Assessment |
|---|---|
| Essential for operator SaaS? | **Yes.** Tenant self-service (rent status, report a repair, sign/see docs) directly reduces the operator's inbound load — the core "no spreadsheets/Fixflo" pitch. |
| Separate platform bet? | No. |
| V1 scope | **rent/payments, maintenance (report + track), documents, messages, tenancy summary.** |
| Deferred | `viewings` (lettings-funnel; V1.5), advanced settings. |
| Session/RLS | Authenticated path = WM-RLS. Magic-link path = `portal_sessions` (PS), 8h TTL, scope frozen to `workspaceId`+`tenancyIds`. |
| Retention value | **High** — tenant-facing touchpoints are why the operator's tenants stay in-platform. |

### 1.2 Landlord portal — **Layer B · V1 · ESSENTIAL**
Authenticated `(landlord)/landlord-portal/*`: `page`, `properties` (+`[id]`), `work`, `statements`, `documents`, `messages`, `settings` (8).
Magic-link `landlord/*`: `page`, `properties` (+`[id]`), `financials`, `payments` (+`[paymentId]`), `maintenance` (+`[requestId]`), `documents`, `messages`.

| Dimension | Assessment |
|---|---|
| Essential for operator SaaS? | **Yes — arguably the single highest-retention portal.** The owner/landlord client of a letting agent logging in to see **owner statements + property performance** is the agent's reason to keep paying (it's the deliverable the agent would otherwise email monthly). |
| Separate platform bet? | No. |
| V1 scope | **statements/financials, properties + performance, maintenance visibility, documents, messages.** |
| Deferred | none material; `work` view can fold into property detail. |
| Session/RLS | WM-RLS (auth) / PS (magic-link), scope frozen to landlord's `propertyIds`. |
| Retention value | **Highest** of the three. |

### 1.3 Supplier portal — **Layer B · V1 · ESSENTIAL (operator-coordination subset only)**
Authenticated `(supplier)/supplier-portal/*`: `page`, `jobs` (+`[id]`), `invoices` (+`[id]`), `verification`, `settings` (7).
Magic-link `supplier/*`: `page`, `jobs` (+`[id]`), `invoices` (+`[id]`), `payments` (+`[paymentId]`), `documents` (+`[documentId]`), `messages`.

| Dimension | Assessment |
|---|---|
| Essential for operator SaaS? | **Yes, the *coordination* subset** — a supplier receiving a job, quoting, uploading evidence/invoice through the operator's portal is core maintenance ops. |
| Separate platform bet? | **The supplier-*as-SaaS* workspace is** (the ~60 `supplier_workspace_*` tables, doc 12 §2.7) — that is Layer D, distinct from this portal. **Do not confuse the supplier *portal* (B, keep) with the independent supplier *workspace* (D, defer).** |
| V1 scope | **jobs (receive/quote/schedule/complete), invoices, documents/evidence upload, messages, verification.** |
| Deferred | supplier-side mirrored accounting/automations/insights/reputation (cut from supplier per brief §3). |
| Session/RLS | WM/SWM (auth) / PS (magic-link), scope frozen to assigned jobs. |
| Retention value | **High** — closes the maintenance loop without the operator chasing by phone. |

### 1.4 Customer / guest — **Layer D · V2 · DEFER (`customerWorkspace` OFF)**
`(customer)/customer/*` (≈45 pages: stays, lets, bookings/disputes, payments, reviews, affiliate, maintenance, messages, saved/favourites, search). Backed by `customer_*` tables (doc 12 §2.9).

| Dimension | Assessment |
|---|---|
| Essential for operator SaaS? | **No.** This is the **consumer/marketplace side** — a guest booking a stay or a renter applying for a let. It is the separate platform bet the verdict explicitly stages to V2. |
| Separate platform bet? | **Yes — the clearest one in the codebase.** |
| V1 scope | none (flag OFF). |
| Session/RLS | dedicated `customer_workspace_members`. |
| Retention value | Consumer acquisition, not operator retention → V2. |

### 1.5 Magic-link redemption / shell — **Layer B · V1 infra**
`(portal)/portal/login`, `/expired`, `/revoked`, `/portal/[sessionId]` (router), `/p/[token]` (redeem). Plus `src/lib/portal/{verify,share,share-issue,share-audit}.ts` and the share-link surface (`portal_share_links`, `share_links/*`). This is the **operator-issued share** path (send a document pack / evidence request / statement to an external contact) — Layer B retention glue, V1.

---

## 2. Session / RLS / TTL model (the security spine)

| Property | Value | Source |
|---|---|---|
| Boundary for external portal | `portal_sessions` via `src/lib/portal/session.ts` (NOT RLS — external users have no auth session) | session.ts L7-20 |
| Cookie | `pv_portal_session`, httpOnly, Secure(prod), SameSite=Lax, signed `<token>.<hmac>` | session.ts L29,134-142 |
| Token storage | only SHA-256 `session_token_hash` stored; raw token never persisted | session.ts L183-191 |
| TTL | **8h cap**, clamped down to the magic-link token's own `expires_at` | `api/portal/verify/route.ts` L36,113-121 |
| Fail-closed conditions | missing secret, malformed/tampered cookie, unknown/revoked/expired session, missing workspace_id → `null` (deny) | session.ts L199-204 |
| Replay protection | `getSessionForRoute` asserts `session.id === routeSessionId` | session.ts L267-273 |
| Scope freeze | `workspaceId`+`contactId` re-bound from the **row** (not the scope blob) so a malformed scope can't widen access; `propertyIds`/`tenancyIds` allow-lists frozen at verify | session.ts L209-226 |
| Master flag | `isExternalPortalEnabled()` — default OFF, only `"true"` enables | flags.ts |
| Heartbeat / audit | `last_seen_at` best-effort update; `portal_verify_attempts`, `share_link_*` audit | session.ts L242-249 |

**Assessment:** this is **production-grade** for an unauthenticated surface. The single most important operational note: because the external path uses the **service-role client**, every `.from()` on it MUST be filtered to `scope.workspaceId` — there is no RLS backstop (echoed in doc 12 §5 rec 5).

---

## 3. Recommended V1 portal scope (route target)

Brief §4 budgets **~25 visible portal routes**. My V1 cut:

| Surface | V1 routes | Notes |
|---|---|---|
| Tenant | home, tenancy, rent/payments, maintenance (+report/track), documents, messages (~7) | defer `viewings` |
| Landlord | home, properties (+detail/performance), statements/financials, maintenance, documents, messages (~7) | fold `work` into property detail |
| Supplier | home, jobs (+detail), invoices, documents/evidence, messages, verification (~7) | exclude supplier-as-SaaS |
| Magic-link infra | login, expired, revoked, redeem, session router (~4) | shared shell |
| **Total** | **~25** | matches target |
| Customer/guest | **0 in V1** | `customerWorkspace` OFF (Layer D) |

**One implementation, not two, where possible:** [VERIFY] whether the authenticated `(tenant|landlord|supplier)-portal` route groups and the magic-link `(portal)/[sessionId]/...` pages render the *same* components with different data layers. If they diverge, that is duplicate maintenance; converge on shared portal components fed by either `workspace_members`-RLS (logged-in) or `portal_sessions`-scope (magic-link). This is the biggest portal-side simplification available.

---

## 4. Recommendations (Reason · Risk · Action)

1. **Keep tenant/landlord/supplier portals in V1; defer customer entirely.** *Reason:* B-layer portals drive operator retention (the paying buyer's reason to stay); customer is the V2 consumer bet. *Risk:* shipping customer dilutes the 30-second story (brief §4). *Action:* leave `(customer)/*` code intact, `customerWorkspace` OFF, out of all nav.
2. **Decide the external magic-link flag for V1 deliberately.** *Reason:* `isExternalPortalEnabled()` defaults OFF, so today the *unauthenticated* portal is dark — but the operator-retention value (sending a landlord their statement by link without making them create an account) is exactly the B-layer pitch. *Risk:* shipping with it OFF guts half the portal value; shipping ON exposes the service-role surface. *Action:* turn it ON for V1 **after** confirming every external `.from()` is workspace-scoped; keep the 8h TTL.
3. **Converge duplicate portal implementations.** *Reason:* authenticated + magic-link portals appear to duplicate tenant/landlord/supplier views. *Risk:* drift between the two (a fix lands in one). *Action:* [VERIFY] and refactor to shared components with a pluggable data source.
4. **Cut supplier-as-SaaS from the V1 supplier portal.** *Reason:* brief §3 — mirrored accounting/automations/insights belong to the deferred Layer D supplier workspace, not the operator's supplier *portal*. *Risk:* surface confusion between "supplier coordinated by operator" and "supplier running their own SaaS". *Action:* V1 supplier portal = jobs/invoices/docs/messages/verification only.
5. **Treat the share-link surface as V1 Layer-B glue.** *Reason:* operator-issued document/evidence/statement share links (`portal_share_links`, `src/lib/portal/share.ts`) are low-cost, high-retention, and reuse the same session spine. *Risk:* none material. *Action:* keep in V1; ensure expiry/revoke UX (`/expired`, `/revoked`) is wired (it is — pages exist).
