// Client-safe type exports from the batch4 admin data layer.
// No server-only imports here — safe to import from 'use client' components.

export interface MaintenanceConfig {
  enabled: boolean
  mode: "full" | "restricted" | "degraded"
  message: string
  allowlist: string[]
  allowAdmins: boolean
  scheduledFor: string | null
}

export interface AdminBugRow {
  id: string
  kind: string
  status: string
  severity: string
  route: string | null
  message: string | null
  digest: string | null
  workspaceId: string | null
  workspaceName: string | null
  createdAt: string | null
}

export interface AnnouncementBarConfig {
  enabled: boolean
  message: string
  severity: "info" | "success" | "warning" | "critical"
  ctaLabel: string
  ctaHref: string
  dismissible: boolean
  audience: "all" | "operators" | "suppliers" | "customers" | "workspace"
  workspaceId: string | null
  startsAt: string | null
  endsAt: string | null
}
