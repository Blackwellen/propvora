// Shared comms domain types (changelog + announcements).

export type AnnouncementSeverity = "info" | "warning" | "critical" | "success"

export interface ChangelogEntry {
  id: string
  version: string | null
  title: string
  bodyHtml: string | null
  category: string | null
  tags: string[]
  published: boolean
  publishedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface Announcement {
  id: string
  workspaceId: string | null
  title: string
  bodyHtml: string | null
  severity: AnnouncementSeverity
  audience: string
  startsAt: string | null
  endsAt: string | null
  dismissible: boolean
  published: boolean
  createdAt: string | null
  updatedAt: string | null
}

export const SEVERITIES: AnnouncementSeverity[] = ["info", "warning", "critical", "success"]

export const CHANGELOG_CATEGORIES = [
  "Feature",
  "Improvement",
  "Fix",
  "Security",
  "Deprecation",
] as const
