"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { sanitizeHtml } from "./sanitize"
import { SEVERITIES, type AnnouncementSeverity } from "./types"

export interface CommsActionResult {
  ok: boolean
  error?: string
}

async function audit(action: string, resourceType: string, resourceId: string | null, meta: Record<string, unknown>) {
  try {
    const db = createAdminClient()
    await db.from("audit_logs").insert({
      workspace_id: null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      new_data: meta,
    })
  } catch {
    /* non-fatal */
  }
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : ""
  return s === "" ? null : s
}

function parseTags(v: FormDataEntryValue | null): string[] {
  if (typeof v !== "string") return []
  return v
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 24)
}

// ── Changelog ────────────────────────────────────────────────────────────────

export async function saveChangelogEntry(form: FormData): Promise<CommsActionResult> {
  const admin = await requireAdmin()
  const id = emptyToNull(form.get("id"))
  const title = emptyToNull(form.get("title"))
  if (!title) return { ok: false, error: "Title is required." }

  const published = form.get("published") === "on" || form.get("published") === "true"
  const row = {
    version: emptyToNull(form.get("version")),
    title,
    body_html: sanitizeHtml(form.get("body_html") as string),
    category: emptyToNull(form.get("category")),
    tags: parseTags(form.get("tags")),
    published,
    // Set published_at on first publish; clear when unpublished.
    published_at: published ? (emptyToNull(form.get("published_at")) ?? new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  }

  try {
    const db = createAdminClient()
    if (id) {
      const { error } = await db.from("changelog_entries").update(row).eq("id", id)
      if (error) return { ok: false, error: "Could not update entry." }
      await audit("changelog.updated", "changelog_entry", id, { by: admin.userId, published })
    } else {
      const { data, error } = await db
        .from("changelog_entries")
        .insert({ ...row, created_by: admin.userId })
        .select("id")
        .maybeSingle()
      if (error) return { ok: false, error: "Could not create entry." }
      await audit("changelog.created", "changelog_entry", (data?.id as string) ?? null, { by: admin.userId, published })
    }
    revalidatePath("/admin/changelog")
    revalidatePath("/changelog")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not save entry." }
  }
}

export async function setChangelogPublished(id: string, published: boolean): Promise<CommsActionResult> {
  const admin = await requireAdmin()
  if (!id) return { ok: false, error: "Missing id." }
  try {
    const db = createAdminClient()
    const { error } = await db
      .from("changelog_entries")
      .update({
        published,
        published_at: published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    if (error) return { ok: false, error: "Could not update publish state." }
    await audit("changelog.publish_toggled", "changelog_entry", id, { by: admin.userId, published })
    revalidatePath("/admin/changelog")
    revalidatePath("/changelog")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not update publish state." }
  }
}

export async function deleteChangelogEntry(id: string): Promise<CommsActionResult> {
  const admin = await requireAdmin()
  if (!id) return { ok: false, error: "Missing id." }
  try {
    const db = createAdminClient()
    const { error } = await db.from("changelog_entries").delete().eq("id", id)
    if (error) return { ok: false, error: "Could not delete entry." }
    await audit("changelog.deleted", "changelog_entry", id, { by: admin.userId })
    revalidatePath("/admin/changelog")
    revalidatePath("/changelog")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not delete entry." }
  }
}

// ── Announcements ────────────────────────────────────────────────────────────

function normaliseSeverity(v: FormDataEntryValue | null): AnnouncementSeverity {
  const s = typeof v === "string" ? v : "info"
  return (SEVERITIES as string[]).includes(s) ? (s as AnnouncementSeverity) : "info"
}

export async function saveAnnouncement(form: FormData): Promise<CommsActionResult> {
  const admin = await requireAdmin()
  const id = emptyToNull(form.get("id"))
  const title = emptyToNull(form.get("title"))
  if (!title) return { ok: false, error: "Title is required." }

  const published = form.get("published") === "on" || form.get("published") === "true"
  const dismissible = form.get("dismissible") === "on" || form.get("dismissible") === "true"
  const row = {
    workspace_id: emptyToNull(form.get("workspace_id")), // null = global
    title,
    body_html: sanitizeHtml(form.get("body_html") as string),
    severity: normaliseSeverity(form.get("severity")),
    audience: emptyToNull(form.get("audience")) ?? "all",
    starts_at: emptyToNull(form.get("starts_at")),
    ends_at: emptyToNull(form.get("ends_at")),
    dismissible,
    published,
    updated_at: new Date().toISOString(),
  }

  try {
    const db = createAdminClient()
    if (id) {
      const { error } = await db.from("announcements").update(row).eq("id", id)
      if (error) return { ok: false, error: "Could not update announcement." }
      await audit("announcement.updated", "announcement", id, { by: admin.userId, published })
    } else {
      const { data, error } = await db
        .from("announcements")
        .insert({ ...row, created_by: admin.userId })
        .select("id")
        .maybeSingle()
      if (error) return { ok: false, error: "Could not create announcement." }
      await audit("announcement.created", "announcement", (data?.id as string) ?? null, { by: admin.userId, published })
    }
    revalidatePath("/admin/announcements")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not save announcement." }
  }
}

export async function setAnnouncementPublished(id: string, published: boolean): Promise<CommsActionResult> {
  const admin = await requireAdmin()
  if (!id) return { ok: false, error: "Missing id." }
  try {
    const db = createAdminClient()
    const { error } = await db
      .from("announcements")
      .update({ published, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return { ok: false, error: "Could not update publish state." }
    await audit("announcement.publish_toggled", "announcement", id, { by: admin.userId, published })
    revalidatePath("/admin/announcements")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not update publish state." }
  }
}

export async function deleteAnnouncement(id: string): Promise<CommsActionResult> {
  const admin = await requireAdmin()
  if (!id) return { ok: false, error: "Missing id." }
  try {
    const db = createAdminClient()
    const { error } = await db.from("announcements").delete().eq("id", id)
    if (error) return { ok: false, error: "Could not delete announcement." }
    await audit("announcement.deleted", "announcement", id, { by: admin.userId })
    revalidatePath("/admin/announcements")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not delete announcement." }
  }
}
