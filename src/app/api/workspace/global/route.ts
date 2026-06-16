import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveCountryPackContext } from "@/lib/context/country-pack-context"
import { listSelectableCountries } from "@/lib/international/workspace-jurisdiction"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Workspace GLOBAL settings data.
 *
 * GET ?workspaceId= → the full resolved country-pack context for the workspace's
 * business country (locale, tax, privacy, sanctions, release gate, gates +
 * disclaimers) plus the selectable-country list. Read is RLS-scoped: the caller
 * must be a member of the workspace.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = request.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
  }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Resolve the workspace's business country.
  let code = "GB"
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("business_country_code")
      .eq("id", workspaceId)
      .maybeSingle()
    if (ws?.business_country_code) code = String(ws.business_country_code).toUpperCase()
  } catch {
    /* default GB */
  }

  const [intl, countries] = await Promise.all([
    resolveCountryPackContext(supabase, code),
    listSelectableCountries(supabase),
  ])

  return NextResponse.json({
    intl,
    countries,
    canEdit: ["owner", "admin"].includes(String(member.role)),
  })
}
