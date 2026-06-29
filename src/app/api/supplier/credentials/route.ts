import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  listSupplierCredentials,
  addSupplierCredential,
  deleteSupplierCredential,
  type SupplierCredentialInput,
} from "@/lib/supplier/credentials"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function isSupplierWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    if (data) return true
  } catch {
    /* fall through */
  }
  try {
    const { data } = await supabase
      .from("supplier_workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

/** GET /api/supplier/credentials?workspaceId=... */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const workspaceId = (new URL(request.url).searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const items = await listSupplierCredentials(supabase, workspaceId)
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/credentials GET", requestId })
    return NextResponse.json({ error: "Failed to load credentials", requestId }, { status: 500 })
  }
}

/** POST /api/supplier/credentials  Body: { workspaceId, credential } */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => ({}))) as {
      workspaceId?: string
      credential?: SupplierCredentialInput
    }
    const workspaceId = (body.workspaceId ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }
    if (!body.credential?.credential_type?.trim()) {
      return NextResponse.json({ error: "credential_type is required" }, { status: 400 })
    }

    const item = await addSupplierCredential(supabase, workspaceId, body.credential)
    return NextResponse.json({ item }, { status: 201 })
  } catch (err) {
    captureException(err, { source: "api/supplier/credentials POST", requestId })
    return NextResponse.json({ error: "Failed to add credential", requestId }, { status: 500 })
  }
}

/** DELETE /api/supplier/credentials?workspaceId=...&id=... */
export async function DELETE(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    const id = (url.searchParams.get("id") ?? "").trim()
    if (!workspaceId || !id) {
      return NextResponse.json({ error: "workspaceId and id are required" }, { status: 400 })
    }
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    await deleteSupplierCredential(supabase, workspaceId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { source: "api/supplier/credentials DELETE", requestId })
    return NextResponse.json({ error: "Failed to delete credential", requestId }, { status: 500 })
  }
}
