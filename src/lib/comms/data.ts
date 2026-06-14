import "server-only"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Announcement, AnnouncementSeverity, ChangelogEntry } from "./types"

// Schema-gap guards: a missing table/column resolves to empty rather than
// throwing, so pages render an honest empty state before the migration lands.
const MISSING_RELATION = "42P01"
const UNDEFINED_COLUMN = "42703"
function isSchemaGap(code?: string) {
  return code === MISSING_RELATION || code === UNDEFINED_COLUMN
}

// ── Row mappers ──────────────────────────────────────────────────────────────

type Row = Record<string, unknown>

function mapChangelog(r: Row): ChangelogEntry {
  return {
    id: r.id as string,
    version: (r.version as string) ?? null,
    title: (r.title as string) ?? "Untitled",
    bodyHtml: (r.body_html as string) ?? null,
    category: (r.category as string) ?? null,
    tags: (r.tags as string[]) ?? [],
    published: Boolean(r.published),
    publishedAt: (r.published_at as string) ?? null,
    createdAt: (r.created_at as string) ?? null,
    updatedAt: (r.updated_at as string) ?? null,
  }
}

function mapAnnouncement(r: Row): Announcement {
  return {
    id: r.id as string,
    workspaceId: (r.workspace_id as string) ?? null,
    title: (r.title as string) ?? "Untitled",
    bodyHtml: (r.body_html as string) ?? null,
    severity: ((r.severity as string) ?? "info") as AnnouncementSeverity,
    audience: (r.audience as string) ?? "all",
    startsAt: (r.starts_at as string) ?? null,
    endsAt: (r.ends_at as string) ?? null,
    dismissible: r.dismissible === undefined ? true : Boolean(r.dismissible),
    published: Boolean(r.published),
    createdAt: (r.created_at as string) ?? null,
    updatedAt: (r.updated_at as string) ?? null,
  }
}

const CHANGELOG_COLS =
  "id, version, title, body_html, category, tags, published, published_at, created_at, updated_at"
const ANNOUNCEMENT_COLS =
  "id, workspace_id, title, body_html, severity, audience, starts_at, ends_at, dismissible, published, created_at, updated_at"

// ── Public changelog (anon-safe; uses the SSR client + RLS) ──────────────────

export async function listPublishedChangelog(limit = 100): Promise<ChangelogEntry[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("changelog_entries")
      .select(CHANGELOG_COLS)
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return data.map(mapChangelog)
  } catch {
    return []
  }
}

// ── Admin reads (service role) ───────────────────────────────────────────────

export async function adminListChangelog(limit = 200): Promise<ChangelogEntry[]> {
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from("changelog_entries")
      .select(CHANGELOG_COLS)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return []
      return []
    }
    return (data ?? []).map(mapChangelog)
  } catch {
    return []
  }
}

export async function adminListAnnouncements(limit = 200): Promise<Announcement[]> {
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from("announcements")
      .select(ANNOUNCEMENT_COLS)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return []
      return []
    }
    return (data ?? []).map(mapAnnouncement)
  } catch {
    return []
  }
}

/** Workspaces for the admin announcement scope picker (id + name). */
export async function adminListWorkspaceOptions(
  limit = 500,
): Promise<Array<{ id: string; name: string }>> {
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from("workspaces")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(limit)
    if (error || !data) return []
    return data.map((w) => ({ id: w.id as string, name: (w.name as string) ?? "Workspace" }))
  } catch {
    return []
  }
}
