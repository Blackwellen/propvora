"use client"

import { useCallback, useEffect, useState } from "react"
import DOMPurify from "isomorphic-dompurify"
import { Info, AlertTriangle, AlertOctagon, CheckCircle2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Severity = "info" | "warning" | "critical" | "success"

interface BannerAnnouncement {
  id: string
  title: string
  body_html: string | null
  severity: Severity
  starts_at: string | null
  ends_at: string | null
  dismissible: boolean
}

const SEVERITY_UI: Record<
  Severity,
  { wrap: string; icon: typeof Info; iconColor: string; title: string }
> = {
  info: {
    wrap: "bg-[var(--brand-soft)] border-[#BFDBFE]",
    icon: Info,
    iconColor: "text-[var(--brand)]",
    title: "text-[#1e40af]",
  },
  success: {
    wrap: "bg-[#ECFDF5] border-[#A7F3D0]",
    icon: CheckCircle2,
    iconColor: "text-[#059669]",
    title: "text-[#065f46]",
  },
  warning: {
    wrap: "bg-[#FFFBEB] border-[#FDE68A]",
    icon: AlertTriangle,
    iconColor: "text-[#d97706]",
    title: "text-[#92400e]",
  },
  critical: {
    wrap: "bg-[#FEF2F2] border-[#FECACA]",
    icon: AlertOctagon,
    iconColor: "text-[#dc2626]",
    title: "text-[#991b1b]",
  },
}

/**
 * In-app announcement banner.
 *
 * Fetches PUBLISHED announcements visible to the signed-in user (RLS limits
 * rows to global + own-workspace), filters by the active time window and the
 * user's not-yet-dismissed set, then renders a stack of dismissible banners.
 * Dismissing writes an `announcement_dismissals` row (RLS: own rows only).
 *
 * Self-contained — safe to drop into any authenticated app surface.
 */
export default function AnnouncementBanner() {
  const [items, setItems] = useState<BannerAnnouncement[]>([])
  const [dismissing, setDismissing] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const nowIso = new Date().toISOString()

    // RLS already scopes to published + (global OR member). We additionally
    // enforce the active window in the query.
    const { data: rows, error } = await supabase
      .from("announcements")
      .select("id, title, body_html, severity, starts_at, ends_at, dismissible")
      .eq("published", true)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
      .order("created_at", { ascending: false })
      .limit(20)
    if (error || !rows || rows.length === 0) {
      setItems([])
      return
    }

    // Filter out anything this user has already dismissed.
    const { data: dismissed } = await supabase
      .from("announcement_dismissals")
      .select("announcement_id")
      .eq("user_id", user.id)
    const dismissedIds = new Set((dismissed ?? []).map((d) => d.announcement_id as string))

    setItems(
      (rows as BannerAnnouncement[]).filter((r) => !dismissedIds.has(r.id)),
    )
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const dismiss = useCallback(async (id: string) => {
    setDismissing((prev) => new Set(prev).add(id))
    // Optimistically remove from view.
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      await supabase
        .from("announcement_dismissals")
        .insert({ announcement_id: id, user_id: user.id })
    } catch {
      /* non-fatal: row stays dismissed for this session regardless */
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {items.map((a) => {
        const ui = SEVERITY_UI[a.severity] ?? SEVERITY_UI.info
        const Icon = ui.icon
        return (
          <div
            key={a.id}
            role="status"
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm ${ui.wrap}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ui.iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${ui.title}`}>{a.title}</p>
              {a.body_html && (
                <div
                  className="text-sm text-slate-600 mt-0.5 [&_a]:underline [&_a]:font-medium"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.body_html) }}
                />
              )}
            </div>
            {a.dismissible && (
              <button
                onClick={() => dismiss(a.id)}
                disabled={dismissing.has(a.id)}
                aria-label="Dismiss announcement"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
