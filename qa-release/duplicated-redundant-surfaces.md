# Duplicated / Redundant Surfaces

Last updated: 2026-06-20

> Surfaces that overlap in function, have conflicting routes, or are candidates for merge or removal.

## Known Duplications

| ID | Area | Surface A | Surface B | Overlap | Recommendation |
|---|---|---|---|---|---|
| DUP-001 | PM Routing | `/app/*` URL space | `/property-manager/*` URL space | Same pages served from both paths via rewrite | Keep `/property-manager/*` as canonical. `/app/*` redirect is correct. Audit all internal links (FIX-010 done). |
| DUP-002 | Customer routing | `/customer/*` | `/user/*` | Same pages — `/customer/` redirects to `/user/` | Keep `/user/*` as canonical (file system). Consider flipping to `/customer/` canonical long-term. |
| DUP-003 | Tenant portal | `/portal/[sessionId]/tenant/*` | `/tenant-portal/*` | Both serve tenant portal; one is token-session, one is cookie-session | Both serve different auth modes — NOT a duplicate. Keep both. Document difference clearly. |
| DUP-004 | Landlord portal | `/portal/[sessionId]/landlord/*` | `/landlord-portal/*` | Same dual-mode pattern | As DUP-003 — keep both. |
| DUP-005 | Marketplace | `/property-manager/marketplace/suppliers-hub` | `/suppliers` (public) | PM views suppliers from workspace; public views supplier directory | Different contexts — NOT a true duplicate. |
| DUP-006 | Work suppliers | `/property-manager/work/suppliers` | `/property-manager/marketplace/suppliers-hub` | Both surface supplier discovery for PM | Review: may be same component in two nav locations. Consider merge if content is identical. |

## Candidates for Removal

| ID | Route/Component | Reason | Decision |
|---|---|---|---|
| REM-001 | `/app/*` route group | All routes duplicated by `/property-manager/*` rewrite; `/app/*` is purely a redirect shell | Keep the redirect for backwards-compat but document as "alias only". |
| REM-002 | Old account routes `/property-manager/account-settings` vs `/property-manager/account` | Possible duplicate nav entries | Check if both exist and merge if so. |

## Not Duplicates (confirmed)

- Portal token-session vs cookie-session portals — serve different auth contexts
- Supplier workspace vs supplier portal — different shell, different auth
- Customer workspace (`/customer`) vs customer marketplace (`/stays`) — different purpose
