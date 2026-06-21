# Feature Flag Registry — Propvora v2

Source: `src/lib/flags/registry.ts`

QA environment: set `NEXT_PUBLIC_QA_ALL_FLAGS=true` in `.env.local` to force all flags ON for browser testing.

Scoring: 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=not tested | N/A=not applicable

Status values: PENDING | IN PROGRESS | PASS | FAIL | BLOCKED

---

## Flag Matrix

| ID | Flag Name (camelCase) | DB Key (snake_case) | Area | Feature / Route / Component | Default State | QA State (NEXT_PUBLIC_QA_ALL_FLAGS) | Production Intended State | Source File | Plan Gate | Enabled In QA? | Browser Tested? | Issues Found | Fix Implemented | Score | Status |
|----|-----------------------|---------------------|------|-----------------------------|---------------|--------------------------------------|---------------------------|-------------|-----------|----------------|-----------------|--------------|-----------------|-------|--------|
| FLAG-001 | contextEngine | context_engine | Core / Multi-workspace | Central routeContext resolver. Adapts modules by workspace type, actor, and country. Off = V1 single-context behaviour. | OFF | ON | OFF (V1 ship) | src/lib/flags/registry.ts | None | Yes | No | — | — | 0 | PENDING |
| FLAG-002 | marketplaceEnabled | marketplace_enabled | Marketplace | Master switch for the combined marketplace OS. Off = no marketplace surface at all. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | None | Yes | No | — | — | 0 | PENDING |
| FLAG-003 | marketplaceStays | marketplace_stays | Marketplace | Property stay / booking listing type. Routes: /marketplace/stays, /marketplace/stays/[id]. Requires marketplaceEnabled. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | marketplaceEnabled | Yes | No | — | — | 0 | PENDING |
| FLAG-004 | marketplaceSuppliers | marketplace_suppliers | Marketplace | Supplier service / package listing type. Routes: /marketplace/suppliers, /marketplace/suppliers/[id]. Requires marketplaceEnabled. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | marketplaceEnabled | Yes | No | — | — | 0 | PENDING |
| FLAG-005 | marketplaceEmergency | marketplace_emergency | Marketplace | Emergency dispatch listing type and supplier chain. Routes: /marketplace/emergency, /marketplace/emergency/[id]. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | marketplaceEnabled | Yes | No | — | — | 0 | PENDING |
| FLAG-006 | marketplacePayments | marketplace_payments | Marketplace | Marketplace payment capture / payout flows and commission tracking. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | marketplaceEnabled, Stripe OAuth | Yes | No | — | — | 0 | PENDING |
| FLAG-007 | marketplaceEscrow | marketplace_escrow | Marketplace | Payment authorisation, delayed capture and platform-hold flows. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | marketplacePayments | Yes | No | — | — | 0 | PENDING |
| FLAG-008 | marketplaceDisputes | marketplace_disputes | Marketplace | Unified dispute lifecycle and resolution workflows. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | marketplacePayments | Yes | No | — | — | 0 | PENDING |
| FLAG-009 | bookingManagement | booking_management | PM Workspace | Reservation operations section: calendar, availability, check-in/out, turnover. Routes: /property-manager/bookings/*. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | None | Yes | No | — | — | 0 | PENDING |
| FLAG-010 | directBookingPages | direct_booking_pages | Public / PM | Public direct-booking pages with reduced/zero platform fee. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | bookingManagement | Yes | No | — | — | 0 | PENDING |
| FLAG-011 | customerWorkspace | customer_workspace | Customer | Lightweight customer / guest workspace route group and landing. Routes: /customer/* (/user/*). | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | registrationCustomer | Yes | No | — | — | 0 | PENDING |
| FLAG-012 | supplierWorkspace | supplier_workspace | Supplier | Full supplier workspace (services, packages, jobs, payouts). Routes: /supplier/*. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | registrationSupplier | Yes | No | — | — | 0 | PENDING |
| FLAG-013 | icalSync | ical_sync | PM Workspace / Bookings | Channel iCal import/export for booking availability. Component: iCalSyncPanel. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | bookingManagement | Yes | No | — | — | 0 | PENDING |
| FLAG-014 | canvasLite | canvas_lite | PM Workspace / Planning | Lightweight visual canvas / board surface for planning. Routes: /property-manager/planning/canvas. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | None | Yes | No | — | — | 0 | PENDING |
| FLAG-015 | multiCountryPortfolio | multi_country_portfolio | PM Workspace / Portfolio | Per-property country, jurisdiction and currency across a single workspace. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | globalCountryPacks | Yes | No | — | — | 0 | PENDING |
| FLAG-016 | globalCountryPacks | global_country_packs | Platform / i18n | Country pack legal/tax/compliance depth and support-status gating. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | None | Yes | No | — | — | 0 | PENDING |
| FLAG-017 | accountingGl | accounting_gl | PM Workspace / Money | Full double-entry accounting GL (chart of accounts, journals, trial balance, MTD, reconciliation). Off = Money basics + integrations only. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | None | Yes | No | — | — | 0 | PENDING |
| FLAG-018 | automationsFull | automations_full | PM + Supplier | Full automation engine: visual canvas, node registry, webhooks, integrations. Off = automations-lite only. Requires canvasLite. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | canvasLite | Yes | No | — | — | 0 | PENDING |
| FLAG-019 | portalTenant | portal_tenant | Tenant Portal | Magic-link tenant portal (tenancy, payments, maintenance, documents, messages). V1 kill-switch — default ON. | **ON** | ON | ON | src/lib/flags/registry.ts | None | Yes | No | — | — | 0 | PENDING |
| FLAG-020 | portalLandlord | portal_landlord | Landlord Portal | Magic-link landlord/owner portal (properties, financials, owner statements, maintenance, documents). V1 kill-switch — default ON. | **ON** | ON | ON | src/lib/flags/registry.ts | None | Yes | No | — | — | 0 | PENDING |
| FLAG-021 | portalSupplier | portal_supplier | Supplier Portal | Magic-link supplier portal (jobs, documents/evidence, invoices, payments, messages). V1 kill-switch — default ON. | **ON** | ON | ON | src/lib/flags/registry.ts | None | Yes | No | — | — | 0 | PENDING |
| FLAG-022 | registrationCustomer | registration_customer | Auth / Registration | Show the Customer choice on /register and Customer tab on /login. Off in V1. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | customerWorkspace | Yes | No | — | — | 0 | PENDING |
| FLAG-023 | registrationSupplier | registration_supplier | Auth / Registration | Show the Supplier choice on /register and Supplier tab on /login. Off in V1. | OFF | ON | OFF (staged) | src/lib/flags/registry.ts | supplierWorkspace | Yes | No | — | — | 0 | PENDING |

---

## Summary

| Category | Count | Default ON | Default OFF |
|----------|-------|-----------|------------|
| Marketplace flags | 7 | 0 | 7 |
| Booking flags | 2 | 0 | 2 |
| Workspace flags | 2 | 0 | 2 |
| Platform / context flags | 4 | 0 | 4 |
| Portal kill-switches (V1) | 3 | 3 | 0 |
| Registration flags | 2 | 0 | 2 |
| Accounting / GL | 1 | 0 | 1 |
| Automations | 1 | 0 | 1 |
| iCal / Canvas | 2 | 0 | 2 |
| **Total** | **23** | **3** | **20** |

---

## QA Instructions

1. Add `NEXT_PUBLIC_QA_ALL_FLAGS=true` to `.env.local` before starting browser QA.
2. For each flag, navigate to the routes/components it controls and verify they render correctly.
3. After testing, set `NEXT_PUBLIC_QA_ALL_FLAGS=false` and verify the V1 baseline still looks correct (portal flags still ON via `defaultEnabled: true`).
4. Record any rendering, navigation, or data errors in the Issues Found column.
5. Mark the Score and Status once testing is complete.
6. Section QA file: `/qa-release/sections/13-feature-flags.md`

---

_Last updated: 2026-06-20_
_Source of truth: `src/lib/flags/registry.ts`_
