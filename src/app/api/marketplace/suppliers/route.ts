import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchSuppliers, type SupplierSearchParams } from "@/lib/marketplace/suppliers"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/marketplace/suppliers — operator-side supplier directory search.

   The OPERATOR is the buyer browsing the cross-workspace supplier directory.
   Reads PUBLISHED supplier/emergency/service listings enriched with real
   supplier-profile / trust / services data (see lib/marketplace/suppliers.ts).
   Auth-gated (any authenticated user); returns only browse-safe public fields.

   Query params: q, serviceCategory, zone, countryCode, minRating, verifiedOnly,
   emergencyOnly, minPence, maxPence, page, pageSize, ids (csv).
─────────────────────────────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const sp = new URL(request.url).searchParams
    const str = (k: string): string | undefined => {
      const v = sp.get(k)
      const t = v?.trim()
      return t ? t : undefined
    }
    const int = (k: string): number | undefined => {
      const raw = sp.get(k)
      if (raw === null || raw.trim() === "") return undefined
      const n = Number(raw)
      return Number.isFinite(n) ? n : undefined
    }
    const idsRaw = str("ids")

    const params: SupplierSearchParams = {
      query: str("q") ?? str("query"),
      serviceCategory: str("serviceCategory"),
      zone: str("zone"),
      countryCode: str("countryCode"),
      minRating: int("minRating"),
      verifiedOnly: sp.get("verifiedOnly") === "true",
      emergencyOnly: sp.get("emergencyOnly") === "true",
      minPence: int("minPence"),
      maxPence: int("maxPence"),
      page: int("page"),
      pageSize: int("pageSize"),
      ids: idsRaw ? idsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    }

    const result = await searchSuppliers(supabase, params)
    return NextResponse.json(result)
  } catch (err) {
    captureException(err, { source: "api/marketplace/suppliers", requestId })
    return NextResponse.json({ error: "Supplier search failed", requestId }, { status: 500 })
  }
}
