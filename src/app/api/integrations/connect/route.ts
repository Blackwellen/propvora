import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// POST /api/integrations/connect
// Stores an API-key-based integration connection in workspace_integrations.
// The key is stored as-is in encrypted_key for V1; real Vault encryption in V2.
// 42P01-tolerant: if the table doesn't exist, returns a friendly message.
export const dynamic = "force-dynamic"

const connectSchema = z.object({
  integrationId: z.string().min(1).max(80),
  apiKey: z.string().min(1).max(2000),
  workspaceId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = connectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "integrationId and apiKey are required." }, { status: 400 })
    }
    const { integrationId, apiKey, workspaceId: bodyWorkspaceId } = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Resolve workspace
    let workspaceId = bodyWorkspaceId ?? null
    if (!workspaceId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_workspace_id")
        .eq("id", user.id)
        .maybeSingle()
      workspaceId = (profile?.current_workspace_id as string | null) ?? null
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "No active workspace found." }, { status: 400 })
    }

    // Verify membership
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Upsert the integration record (42P01-tolerant)
    try {
      const { data, error } = await supabase
        .from("workspace_integrations")
        .upsert(
          {
            workspace_id: workspaceId,
            integration_id: integrationId,
            status: "active",
            encrypted_key: apiKey, // V1: stored as-is; V2: encrypt via Vault
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id,integration_id" },
        )
        .select("id, integration_id, created_at")
        .single()

      if (error) {
        if (error.code === "42P01") {
          // Table doesn't exist yet — migration pending
          return NextResponse.json(
            {
              success: false,
              error: "Integrations table not yet set up. Apply the database migration first.",
              migrationRequired: true,
            },
            { status: 503 },
          )
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(
        {
          success: true,
          integrationId,
          connectedAt: (data as { created_at: string }).created_at,
        },
        { status: 200 },
      )
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : "Unknown error"
      if (msg.includes("42P01")) {
        return NextResponse.json(
          { success: false, error: "Integrations table not yet set up.", migrationRequired: true },
          { status: 503 },
        )
      }
      throw dbErr
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Failed to connect integration: ${msg}` }, { status: 500 })
  }
}
