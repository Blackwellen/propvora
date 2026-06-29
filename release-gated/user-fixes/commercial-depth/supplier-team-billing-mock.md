# Supplier Team account — billing sub-view is a mock (V2, deferred)

**Status:** Documented deferral — NOT a V1-live blocker (surface is unreachable in V1).
**Found:** 2026-06-28, commercial-depth audit (session-fullaudit).

## What's wrong
`src/features/supplier/team/account/TeamAccountViews.tsx` (`TeamRolesBilling`, Billing sub-view) shows **fabricated** commercial data:
- Plan: hardcoded `"Professional"` (no such supplier plan exists)
- Price: hardcoded `£2,985 / month`, `8 seats`
- Invoices: hardcoded `May/Apr/Mar 2025` at `£2,985.00`
- Buttons are toast-only stubs: "Manage billing" → toast "Opening billing portal…", "Upgrade plan" → toast "Plan change started.", "Invoices" / per-row download → toast "Invoice downloaded."

## Why it's not a V1 blocker
It is **doubly gated** and unreachable in the V1 release:
1. The entire `(supplier-workspace)` route group is behind the `supplierWorkspace` **V2 feature flag (default OFF)** — server layout guard re-enabled in FIX-641.
2. Within the Account hub it only renders when `isTeam` is true (`src/app/(supplier-workspace)/supplier/account/page.tsx`): `isTeam ? <TeamRolesBilling/> : <SupplierTeamPage/>`.

## Why Claude Code could NOT just wire it (genuine blocker)
There are **no supplier *plan* products in `src/lib/billing/catalog.generated.json`** — only supplier *add-ons* (`supplier_pro_profile`, `supplier_team`, `supplier_emergency`, …). The canonical billing catalog (`src/lib/billing/plans.ts`) defines operator plan tiers only. So there is no real supplier subscription/price to display or charge — the numbers shown are necessarily fabricated until supplier plan tiers exist.

## Exact manual steps to resolve (owner / product + Stripe)
1. **Decide the supplier plan model:** do suppliers pay a subscription (e.g. Supplier Free / Pro / Team / Enterprise) or only buy add-ons on top of a free base? This is a pricing/product decision.
2. If subscription tiers are wanted: add supplier plan **products + prices** in Stripe and extend `scripts/stripe-setup-catalog.mjs` so `catalog.generated.json` gains a `supplierPlans` (or equivalent) section, with display metadata in `plans.ts`.
3. Then wire `TeamRolesBilling` Billing sub-view to the real data the same way the operator billing page does (read the workspace's supplier subscription; "Manage billing" → `/api/billing/portal`; "Upgrade" → real checkout/portal; invoices from Stripe). Remove all hardcoded £2,985 / "Professional" / toast stubs.
4. Until then, the surface stays behind the `supplierWorkspace` V2 flag (already OFF) so the mock is never shown to a real user.

## Alternative (if supplier subscriptions are NOT planned for the supplier workspace)
Remove the Billing sub-view from `TeamRolesBilling` entirely (suppliers manage billing elsewhere / only add-ons), so no fabricated subscription UI exists.
