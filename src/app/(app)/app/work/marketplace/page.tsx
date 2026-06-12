import { redirect } from "next/navigation"

// Marketplace is consolidated into the Suppliers area — no separate surface.
export const dynamic = "force-dynamic"

export default function MarketplacePage() {
  redirect("/app/work/suppliers/preferred")
}
