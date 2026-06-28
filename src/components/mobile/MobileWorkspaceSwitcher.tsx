"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { Building2, Store, User as UserIcon, Check, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type WsType = "operator" | "supplier" | "customer"
type Ws = { id: string; name: string; type: WsType }

const TYPE_HOME: Record<WsType, string> = {
  operator: "/property-manager",
  supplier: "/supplier",
  customer: "/user",
}
const TYPE_META: Record<WsType, { label: string; icon: typeof Building2 }> = {
  operator: { label: "Property management", icon: Building2 },
  supplier: { label: "Supplier", icon: Store },
  customer: { label: "Customer", icon: UserIcon },
}
const norm = (t: unknown): WsType => (t === "supplier" || t === "customer" ? t : "operator")

/**
 * Mobile workspace switcher — the small-screen counterpart of the desktop
 * top-nav switcher (which is hidden below `lg`). Lives at the top of each mobile
 * shell's "More"/menu sheet so users on every role can switch the active
 * workspace. Customer is a separate login persona and is omitted (matches the
 * desktop switcher). If the account has only one switchable workspace, it shows
 * the current workspace as a static header (no dropdown).
 */
export default function MobileWorkspaceSwitcher({ onSwitch }: { onSwitch?: () => void }) {
  const { workspace, switchWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<Ws[]>([])
  const [loaded, setLoaded] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("workspace_members")
          .select("workspace_id, workspaces(id, name, type)")
          .eq("user_id", user.id)
          .limit(50)
        let supplierOn = false
        try {
          const fr = await fetch("/api/flags/public")
          if (fr.ok) supplierOn = Boolean((await fr.json())?.supplierWorkspace)
        } catch { /* default off */ }
        const rows = (data ?? [])
          .map((r: { workspaces: unknown }) => {
            const w = r.workspaces as { id: string; name: string; type?: string } | null
            return w ? { id: w.id, name: w.name, type: norm(w.type) } : null
          })
          .filter(Boolean) as Ws[]
        const visible = rows
          .filter((w) => w.type !== "customer")
          .filter((w) => w.type !== "supplier" || supplierOn)
        if (!cancelled) { setList(visible); setLoaded(true) }
      } catch { if (!cancelled) setLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [])

  const activeName = workspace?.name ?? "Your workspace"
  const activeType = norm(workspace?.type)
  const ActiveIcon = TYPE_META[activeType].icon
  const hasOthers = list.length > 1

  async function handleSwitch(ws: Ws) {
    if (ws.id === workspace?.id) { setOpen(false); return }
    setSwitching(ws.id)
    try {
      await switchWorkspace(ws.id)
      const home = TYPE_HOME[ws.type]
      // Cross-type switches cross route-group roots → hard navigation so the
      // correct shell/side-nav renders (matches the desktop switcher).
      window.location.assign(home)
    } catch {
      setSwitching(null)
      setOpen(false)
    }
    onSwitch?.()
  }

  return (
    <div className="mb-3 rounded-2xl border border-[#E8EEF8] bg-white">
      <button
        type="button"
        onClick={() => hasOthers && setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup={hasOthers ? "menu" : undefined}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)]">
          <ActiveIcon className="h-[18px] w-[18px] text-[var(--brand)]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-[#071B4D]">{activeName}</span>
          <span className="block text-[11px] text-slate-500">{TYPE_META[activeType].label}</span>
        </span>
        {hasOthers && (
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
        )}
      </button>

      {open && hasOthers && (
        <div role="menu" className="border-t border-slate-100 p-1.5">
          {list.map((ws) => {
            const Icon = TYPE_META[ws.type].icon
            const active = ws.id === workspace?.id
            return (
              <button
                key={ws.id}
                role="menuitem"
                onClick={() => handleSwitch(ws)}
                disabled={!!switching}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50 disabled:opacity-60"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-700">{ws.name}</span>
                {switching === ws.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : active ? (
                  <Check className="h-4 w-4 text-[var(--brand)]" />
                ) : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
