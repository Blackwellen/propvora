"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import {
  generateShareToken,
  sha256Hex,
  ALL_CAPABILITIES,
  type ShareCapability,
  type ShareResourceType,
} from "./share"
import { recordShareAudit, SHARE_AUDIT_ACTIONS } from "./share-audit"

// ============================================================================
// In-app issuance of /p/[token] recipient share links. Authenticated workspace
// users mint a link (resource + capabilities + expiry), copy it once, and can
// revoke it. The raw token is returned EXACTLY ONCE and stored only as a hash.
// ============================================================================

const RESOURCE_TYPES: ShareResourceType[] = [
  "document",
  "documents",
  "invoice",
  "job",
  "work_order",
  "tenancy",
  "property",
]

export interface IssueShareResult {
  ok: boolean
  error?: string
  id?: string
  /** Raw recipient URL — shown ONCE, never recoverable. */
  url?: string
  expiresAt?: string
}

async function clientIp(): Promise<string | null> {
  try {
    const h = await headers()
    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      null
    )
  } catch {
    return null
  }
}

function appBase(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://propvora.com"
  return base.replace(/\/$/, "")
}

/** Mint a recipient share link. Returns the raw URL once. */
export async function issueShareLink(input: {
  workspaceId: string
  resourceType: string
  resourceIds: string[]
  capabilities: string[]
  expiryDays: number
  title?: string
  recipientLabel?: string
  contactId?: string | null
}): Promise<IssueShareResult> {
  const { workspaceId } = input
  if (!workspaceId) return { ok: false, error: "No workspace selected." }

  const resourceType = input.resourceType as ShareResourceType
  if (!RESOURCE_TYPES.includes(resourceType)) {
    return { ok: false, error: "Unsupported resource type." }
  }

  const resourceIds = Array.isArray(input.resourceIds)
    ? input.resourceIds.filter((x) => typeof x === "string" && x.length > 0)
    : []
  // Single-resource grants must name the resource; collection grants may not.
  const isCollection = resourceType === "documents"
  if (!isCollection && resourceIds.length === 0) {
    return { ok: false, error: "Select at least one resource to share." }
  }

  const capabilities: ShareCapability[] = Array.isArray(input.capabilities)
    ? (input.capabilities.filter((c) =>
        ALL_CAPABILITIES.includes(c as ShareCapability)
      ) as ShareCapability[])
    : ["view"]
  if (!capabilities.includes("view")) capabilities.unshift("view")

  const expiryDays =
    typeof input.expiryDays === "number" && input.expiryDays > 0
      ? Math.min(input.expiryDays, 365)
      : 14

  // 1. Authenticate + authorise the issuer against the workspace.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Please sign in." }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member) return { ok: false, error: "You do not have access to this workspace." }

  const admin = createAdminClient()

  // 2. Verify every named resource actually belongs to this workspace, so a
  //    user can never mint a link pointing at another tenant's data.
  if (resourceIds.length > 0) {
    const table =
      resourceType === "invoice"
        ? "invoices"
        : resourceType === "job" || resourceType === "work_order"
          ? "jobs"
          : resourceType === "tenancy"
            ? "tenancies"
            : resourceType === "property"
              ? "properties"
              : "documents"
    try {
      const { data: owned, error } = await admin
        .from(table)
        .select("id")
        .eq("workspace_id", workspaceId)
        .in("id", resourceIds)
      if (error) return { ok: false, error: "Could not verify the selected resource." }
      const ownedIds = new Set((owned ?? []).map((r) => String((r as { id: string }).id)))
      const allOwned = resourceIds.every((id) => ownedIds.has(id))
      if (!allOwned) {
        return { ok: false, error: "One or more resources are not in this workspace." }
      }
    } catch {
      return { ok: false, error: "Could not verify the selected resource." }
    }
  }

  // 3. Mint token; store only its hash.
  const rawToken = generateShareToken()
  const tokenHash = sha256Hex(rawToken)
  const expiresAt = new Date(Date.now() + expiryDays * 86400_000).toISOString()

  let id: string
  try {
    const { data, error } = await admin
      .from("portal_share_links")
      .insert({
        workspace_id: workspaceId,
        contact_id: input.contactId ?? null,
        resource_type: resourceType,
        resource_ids: resourceIds,
        capabilities,
        title: input.title?.trim() || null,
        recipient_label: input.recipientLabel?.trim() || null,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select("id")
      .single()
    if (error || !data) {
      if ((error as { code?: string })?.code === "42P01") {
        return { ok: false, error: "Share links are not provisioned in this environment." }
      }
      console.error("[issueShareLink]", error)
      return { ok: false, error: "Could not create the share link." }
    }
    id = data.id as string
  } catch (e) {
    console.error("[issueShareLink] threw", e)
    return { ok: false, error: "Could not create the share link." }
  }

  // 4. Audit (never the raw token).
  await recordShareAudit({
    workspaceId,
    action: SHARE_AUDIT_ACTIONS.MINTED,
    shareLinkId: id,
    resourceType: "portal_share_link",
    resourceId: id,
    metadata: {
      by: user.id,
      resource_type: resourceType,
      resource_count: resourceIds.length,
      capabilities,
      expires_at: expiresAt,
    },
    ip: await clientIp(),
  })

  revalidatePath("/property-manager/contacts/portal-access")

  return {
    ok: true,
    id,
    url: `${appBase()}/p/${rawToken}`,
    expiresAt,
  }
}

/** Revoke a share link (sets revoked_at). Recipient access denied immediately. */
export async function revokeShareLink(input: {
  workspaceId: string
  id: string
}): Promise<{ ok: boolean; error?: string }> {
  const { workspaceId, id } = input
  if (!workspaceId || !id) return { ok: false, error: "Missing parameters." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Please sign in." }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member) return { ok: false, error: "You do not have access to this workspace." }

  const admin = createAdminClient()
  try {
    const { error } = await admin
      .from("portal_share_links")
      .update({ revoked_at: new Date().toISOString(), revoked_by: user.id, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", workspaceId) // tenant gate
    if (error) return { ok: false, error: "Could not revoke the link." }
  } catch {
    return { ok: false, error: "Could not revoke the link." }
  }

  await recordShareAudit({
    workspaceId,
    action: SHARE_AUDIT_ACTIONS.REVOKED,
    shareLinkId: id,
    metadata: { by: user.id },
    ip: await clientIp(),
  })

  revalidatePath("/property-manager/contacts/portal-access")
  return { ok: true }
}
