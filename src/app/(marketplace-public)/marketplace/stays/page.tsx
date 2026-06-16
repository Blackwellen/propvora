// ============================================================================
// CANONICAL BROWSE ROUTE DECISION (stays marketplace)
//
// There were two public "browse stays" surfaces:
//   • /stay/search        — the deep, Airbnb-grade stays experience (search nav,
//                            category/price/type/amenity filters, map+list split,
//                            photo-carousel cards, wishlist, similar stays). This
//                            reads real PUBLISHED booking_listings via
//                            src/lib/booking/public.ts.
//   • /marketplace/stays   — a thin wrapper over the generic marketplace search
//                            client (marketplace_listings projection).
//
// Decision: /stay/search is the ONE canonical stays browse route, and /stay is
// the canonical stays surface (it hosts the [slug] detail, checkout, pay,
// wishlist, compare). /marketplace/stays now permanently REDIRECTS there so we
// have a single source of truth, no duplicated/diverging UIs, and the deeper
// experience always wins. The marketplace nav keeps pointing at /marketplace/stays
// for discoverability; this redirect funnels those visitors into the real thing.
// ============================================================================

import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function StaysMarketplaceRedirect() {
  redirect("/stay/search")
}
