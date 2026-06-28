import { createClient } from "@/lib/supabase/server"
import AnnouncementBar from "./AnnouncementBar"

// Server wrapper for the platform announcement bar. Reads the same
// platform_settings(key='announcement_bar') row the admin console writes, so an
// announcement appears site-wide with no deploy. Honours enabled, the
// start/end window, and the "all" audience (workspace-targeted announcements
// are surfaced inside the relevant shell, not globally).
export default async function AnnouncementBanner() {
  let cfg: {
    enabled?: boolean
    message?: string
    severity?: string
    ctaLabel?: string
    ctaHref?: string
    dismissible?: boolean
    audience?: string
    startsAt?: string | null
    endsAt?: string | null
  } = {}
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "announcement_bar")
      .maybeSingle()
    cfg = (data?.value ?? {}) as typeof cfg
  } catch {
    return null
  }

  if (!cfg.enabled || !cfg.message?.trim()) return null
  // Global bar only renders the "all" audience; targeted ones show in-app.
  if (cfg.audience && cfg.audience !== "all") return null

  const now = Date.now()
  if (cfg.startsAt && now < Date.parse(cfg.startsAt)) return null
  if (cfg.endsAt && now > Date.parse(cfg.endsAt)) return null

  return (
    <AnnouncementBar
      message={cfg.message}
      severity={cfg.severity ?? "info"}
      ctaLabel={cfg.ctaLabel}
      ctaHref={cfg.ctaHref}
      dismissible={cfg.dismissible !== false}
      sig={`${cfg.message}|${cfg.severity}|${cfg.endsAt ?? ""}`}
    />
  )
}
