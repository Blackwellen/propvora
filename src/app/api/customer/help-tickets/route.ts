import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Customer help / support tickets — `customer_help_tickets` under RLS
 * (workspace_id NULL + customer_id = auth.uid()). Used for support requests and
 * GDPR data-export / deletion requests (category drives downstream handling).
 *
 *   POST { subject, category?, priority?, bookingId?, tenancyId? } → { id }
 */

function missingTable(e: unknown): boolean {
  const c = (e as { code?: string } | null)?.code
  return c === "42P01" || c === "PGRST205"
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as
    | { subject?: string; category?: string; priority?: string }
    | null
  const subject = body?.subject?.trim()
  if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 })

  try {
    const { data, error } = await supabase
      .from("customer_help_tickets")
      .insert({
        customer_id: user.id,
        subject,
        category: typeof body?.category === "string" ? body.category : "support",
        priority: typeof body?.priority === "string" ? body.priority : "normal",
        status: "open",
        created_by: user.id,
      })
      .select("id")
      .maybeSingle()
    if (error) {
      if (missingTable(error)) return NextResponse.json({ error: "Support is not ready yet." }, { status: 503 })
      throw error
    }
    return NextResponse.json({ id: data?.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not submit your request" }, { status: 500 })
  }
}
