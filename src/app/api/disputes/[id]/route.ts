// ============================================================================
// GET /api/disputes/[id] — a single REAL dispute (header + audit timeline +
// best-effort booking context), mapped to the rich `Dispute` UI shape.
// Access: platform admin, or a member of any workspace party to the dispute.
// ============================================================================
import { NextResponse } from "next/server"
import { loadDisputeForUser } from "@/lib/disputes/load"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { dispute, status } = await loadDisputeForUser(id)
  if (status === "unauthenticated") return NextResponse.json({ dispute: null, error: status }, { status: 401 })
  if (status === "forbidden") return NextResponse.json({ dispute: null, error: status }, { status: 403 })
  if (status === "not-found" || !dispute) return NextResponse.json({ dispute: null, error: "not-found" }, { status: 404 })
  return NextResponse.json({ dispute, source: "live" })
}
