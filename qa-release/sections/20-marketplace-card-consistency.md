# Section 20 — Marketplace Card Consistency

Coverage for card component consistency across all marketplace-facing and workspace-facing card surfaces. The canonical stay card is `StayCard` (shared between `/marketplace/stays` and `/customer/stays`). All other marketplace cards must follow the same layout contract: image, title, price/rating, CTA, loading skeleton, and empty state.

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## Marketplace Card Matrix

| ID | Card Type | Location | Feature Flag | Image OK? | Title OK? | Price OK? | Rating OK? | CTA OK? | Loading OK? | Empty OK? | Desktop OK? | Phone OK? | Brand Token? | Score | Status |
|----|-----------|----------|-------------|---------|---------|---------|----------|--------|-----------|---------|-----------|---------|------------|-------|--------|
| MCARD-001 | Stay card | /marketplace/stays | marketplaceStays | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | 5 | FIXED (FIX-097) — Airbnb-style: 3:2 aspect-ratio image, heart top-right, rating inline with location, price/night bottom, no border, hover scale transition |
| MCARD-002 | Service card (regular + featured) | /property-manager/marketplace/suppliers-hub?tab=services | marketplaceSuppliers | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | - | 4 | FIXED (FIX-019) — featured service cards now use same grid density as regular cards |
| MCARD-003 | Supplier card (regular + featured) | /property-manager/marketplace/suppliers-hub | marketplaceSuppliers | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | 5 | FIXED (FIX-097) — Upwork/Airtasker-style: 56px avatar, trade badge, star rating inline, bio snippet line-clamp-2, location+response time row, green checkmark badges (Vetted/Insured/24h), price + blue Contact CTA, border card hover:shadow-md |
| MCARD-004 | Emergency provider card | /property-manager/marketplace/suppliers-hub?tab=emergency | marketplaceEmergency | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | 5 | FIXED (FIX-097) — Red accent redesign: red-600 header strip with "Available Now" badge, prominent response time (bold red), phone number CTA visible immediately, bg-red-50 card, feature strip with red icons |
| MCARD-005 | Plan card | /pricing | none | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| MCARD-006 | Property/portfolio card | /property-manager/portfolio | none | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| MCARD-007 | Dashboard property card | /property-manager | none | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| MCARD-008 | PM Suppliers hub map popup | /property-manager/marketplace/suppliers-hub/map | supplierWorkspace | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | N/A | - | 4 | FIXED (FIX-020) — premium popup cards with image/rating/badges/price; correct basePath links |
| MCARD-009 | Stay listing card (PM) | /property-manager/listings | directBookingPages | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — directBookingPages flag must be ON |

---

## QA Protocol for Card Consistency

1. For each card type: inspect the component source to confirm it uses the canonical card primitive or the shared marketplace card.
2. Image: confirm aspect ratio is consistent (e.g., 16:9 or 3:2), alt text is present, lazy loading is applied.
3. Title: confirm max 2 lines with ellipsis overflow — no text wrapping that breaks card height.
4. Price: confirm currency symbol is correct, decimal places are formatted, "From" label is used where applicable.
5. Rating: confirm star/score component is consistent across all card types.
6. CTA: confirm primary CTA is a `<button>` or `<a>` with correct aria-label, not a raw div.
7. Loading: confirm skeleton loader matches card layout exactly (no layout shift when data loads).
8. Empty: confirm empty state for zero-result searches shows correct illustration and copy.
9. Desktop: test card grid at 1536, 1366, 1280, 1024 — confirm column count adapts correctly.
10. Phone: test card stack at 430, 390, 375 — confirm single-column, no horizontal overflow.
11. Brand token: confirm card background, border-radius, and shadow use CSS custom properties.
