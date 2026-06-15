import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { recordAcceptance, getCoreAcceptanceStatus } from "@/lib/legal/acceptance"
import { CORE_ACCEPTANCE_DOCUMENTS, type LegalDocumentType } from "@/lib/legal/documents"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DOC_TYPES = [
  "terms_of_service",
  "privacy_policy",
  "acceptable_use",
  "data_processing",
  "cookie_policy",
  "affiliate_terms",
] as const

const schema = z.object({
  // Documents to accept at their current version. Defaults to the core set.
  documents: z.array(z.enum(DOC_TYPES)).min(1).optional(),
})

/**
 * GET /api/legal/accept — return the signed-in user's acceptance status for the
 * core documents (current vs accepted version, and whether re-acceptance is
 * needed). Lets the UI surface the accepted version and prompt on policy change.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const status = await getCoreAcceptanceStatus(supabase, user.id)
  return NextResponse.json(
    { ok: true, status },
    { headers: { "Cache-Control": "no-store" } },
  )
}

/**
 * POST /api/legal/accept — record (re-)acceptance of one or more legal documents
 * at their CURRENT published version for the signed-in user. Used when a policy
 * version changes and the user re-accepts. Idempotent per (user, doc, version).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const docs: LegalDocumentType[] =
    parsed.data.documents ?? [...CORE_ACCEPTANCE_DOCUMENTS]

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  const userAgent = request.headers.get("user-agent")

  const results = []
  for (const type of docs) {
    results.push(
      await recordAcceptance(supabase, user.id, type, {
        context: "re_acceptance",
        ip,
        userAgent,
      }),
    )
  }

  const failed = results.filter((r) => !r.ok)
  if (failed.length) {
    return NextResponse.json(
      { ok: false, error: "Some acceptances could not be recorded.", results },
      { status: 500 },
    )
  }
  return NextResponse.json({ ok: true, results }, { headers: { "Cache-Control": "no-store" } })
}
