import "server-only"
import { NextResponse } from "next/server"
import { getGlobalFlag } from "./public"
import type { V2FlagKey } from "./index"

/**
 * Server-side flag gate for V2 API routes. Returns a 404 response when the flag
 * is OFF (global), else null. Closes the "direct API leak" — a hidden public
 * surface (marketplace checkout, booking reserve, etc.) must not be callable by
 * URL even though its page is redirected.
 *
 *   export async function POST(req: Request) {
 *     const gated = await flagGate("marketplaceEnabled")
 *     if (gated) return gated
 *     …
 *   }
 */
export async function flagGate(flag: V2FlagKey): Promise<NextResponse | null> {
  if (await getGlobalFlag(flag)) return null
  return NextResponse.json(
    { error: "This feature is not available." },
    { status: 404 }
  )
}
