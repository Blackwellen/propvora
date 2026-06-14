"use client"

import { createClient } from "@/lib/supabase/client"

// ============================================================
// Portal documents — aligned to the LIVE schema.
//
// There is NO `tenant_documents` / `landlord_documents` table. Documents
// are stored per-property in `property_documents`:
//
//   property_documents (
//     id, workspace_id, property_id, name, file_url, file_type,
//     file_size, category, uploaded_by, created_at, updated_at
//   )
//
// Portal pages previously read/wrote the phantom tables and so showed a
// permanently empty list and silently dropped uploads. This module is the
// single, schema-correct document data layer for the tenant + landlord
// portals. Reads are ALWAYS scoped to the caller's own property id set
// (empty set => []), so a portal user never sees another owner/tenant's
// files. 42P01-safe.
// ============================================================

export interface PortalDocRow {
  id: string
  name: string | null
  file_url: string | null
  file_type: string | null
  file_size: number | null
  category: string | null
  property_id: string | null
  created_at: string | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

/**
 * Documents on a set of properties, newest first. Empty id set => [].
 * STRICTLY scoped to the passed property ids — callers must pass only the
 * ids the portal user is entitled to.
 */
export async function getPropertyDocuments(propertyIds: string[]): Promise<PortalDocRow[]> {
  const ids = propertyIds.filter(Boolean)
  if (ids.length === 0) return []
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("property_documents")
      .select("id, name, file_url, file_type, file_size, category, property_id, created_at")
      .in("property_id", ids)
      .order("created_at", { ascending: false })
    if (error) {
      if (code(error) === "42P01") return []
      return []
    }
    return (data ?? []) as unknown as PortalDocRow[]
  } catch {
    return []
  }
}
