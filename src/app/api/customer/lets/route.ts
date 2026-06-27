import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  listViewings, listApplications, listOffers, listTenancies, listRecommendedLets,
} from "@/lib/customer/lets"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/customer/lets?type=viewings|applications|offers|tenancies|recommended|all
 *
 * RLS-scoped reads of the customer's Lets data (the authed client enforces
 * customer_id = auth.uid()). Powers the Lets hub tabs. Tolerant → empty arrays.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const type = new URL(req.url).searchParams.get("type") ?? "all"
  try {
    switch (type) {
      case "viewings": return NextResponse.json({ viewings: await listViewings(supabase) })
      case "applications": return NextResponse.json({ applications: await listApplications(supabase) })
      case "offers": return NextResponse.json({ offers: await listOffers(supabase) })
      case "tenancies": return NextResponse.json({ tenancies: await listTenancies(supabase) })
      case "recommended": return NextResponse.json({ recommended: await listRecommendedLets(supabase) })
      default: {
        const [viewings, applications, offers, tenancies, recommended] = await Promise.all([
          listViewings(supabase), listApplications(supabase), listOffers(supabase),
          listTenancies(supabase), listRecommendedLets(supabase),
        ])
        return NextResponse.json({ viewings, applications, offers, tenancies, recommended })
      }
    }
  } catch {
    return NextResponse.json({ viewings: [], applications: [], offers: [], tenancies: [], recommended: [] })
  }
}
