"use client"

import { useEffect, useState } from "react"
import { UserRound, Building2, Wrench, type LucideIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { switchToPersona } from "@/lib/actions/workspace"

type Persona = "customer" | "operator" | "supplier"

const META: Record<Persona, { label: string; icon: LucideIcon }> = {
  customer: { label: "Go to customer site", icon: UserRound },
  operator: { label: "Go to property manager", icon: Building2 },
  supplier: { label: "Go to supplier", icon: Wrench },
}

/**
 * Cross-persona shortcuts for the avatar dropdown. A single account can hold
 * customer / operator / supplier memberships (same email); this renders a
 * "Go to …" link for each requested target the account actually belongs to.
 * Targets with no matching workspace are omitted entirely (no dead links).
 *
 * Clicking switches the active workspace to that persona's workspace, then does
 * a full navigation to its shell home (crossing route-group layouts).
 */
export default function PersonaLinks({
  targets,
  onNavigate,
}: {
  targets: Persona[]
  onNavigate?: () => void
}) {
  const [present, setPresent] = useState<Record<Persona, boolean>>({
    customer: false,
    operator: false,
    supplier: false,
  })
  const [busy, setBusy] = useState<Persona | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || cancelled) return
        const { data } = await supabase
          .from("workspace_members")
          .select("workspaces!inner(type)")
          .eq("user_id", user.id)
          .limit(50)
        const next: Record<Persona, boolean> = { customer: false, operator: false, supplier: false }
        for (const row of data ?? []) {
          const t = (row as { workspaces?: { type?: string } | null }).workspaces?.type
          if (t === "customer" || t === "operator" || t === "supplier") next[t] = true
        }
        if (!cancelled) setPresent(next)
      } catch {
        /* leave all false — links simply won't render */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const visible = targets.filter((t) => present[t])
  if (visible.length === 0) return null

  async function go(type: Persona) {
    setBusy(type)
    try {
      const home = await switchToPersona(type)
      onNavigate?.()
      if (home) window.location.assign(home)
      else setBusy(null)
    } catch {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="h-px bg-slate-100 mx-3 my-1" />
      {visible.map((t) => {
        const { label, icon: Icon } = META[t]
        return (
          <button
            key={t}
            type="button"
            onClick={() => go(t)}
            disabled={busy != null}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-[#071B4D] hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Icon className="w-4 h-4 text-slate-500 shrink-0" />
            {busy === t ? "Switching…" : label}
          </button>
        )
      })}
    </>
  )
}
