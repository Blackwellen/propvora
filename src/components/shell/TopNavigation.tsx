"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Building2, ChevronDown, Calendar as CalendarIcon, Check, Loader2, Plus, Sparkles, Store, User as UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import GlobalSearch from "./GlobalSearch"
import QuickCreateButton from "./QuickCreateButton"
import NotificationBell from "./NotificationBell"
import AccountMenu from "./AccountMenu"
import TutorialLauncher from "@/guided-help/components/TutorialLauncher"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { zIndex } from "@/lib/ui/z-index"

// ─── Workspace types → routing ─────────────────────────────────────────────
// Each workspace carries a `type` that determines which shell/route-group it
// lives in. Switching must land on the chosen workspace's OWN home so the
// correct side-nav (operator / supplier / customer) renders.
type WorkspaceType = "operator" | "supplier" | "customer"

interface Workspace {
  id: string
  name: string
  slug: string
  type: WorkspaceType
}

/** Home route (and therefore shell) for each workspace type. */
const TYPE_HOME: Record<WorkspaceType, string> = {
  operator: "/property-manager", // → rewrites to (app)/app, operator AppShell
  supplier: "/supplier",          // → (supplier-workspace) group
  customer: "/user",              // → rewrites to (customer)/customer
}

const TYPE_META: Record<WorkspaceType, { label: string; icon: typeof Building2 }> = {
  operator: { label: "Property management", icon: Building2 },
  supplier: { label: "Supplier", icon: Store },
  customer: { label: "Customer", icon: UserIcon },
}

const TYPE_ORDER: WorkspaceType[] = ["operator", "supplier", "customer"]

function normaliseType(raw: unknown): WorkspaceType {
  return raw === "supplier" || raw === "customer" ? raw : "operator"
}

interface TopNavigationProps {
  workspaceName?: string
  workspaceId?: string
  /** Base path for workspace-relative shortcuts (e.g. calendar). */
  base?: string
  /** If provided, renders an "Ask AI" Copilot button in the right action group. */
  onOpenCopilot?: () => void
  /** Guided-walkthroughs kill-switch (default ON). When false the tour launcher is hidden. */
  guidedHelp?: boolean
}

export function WorkspaceSwitcher({ workspaceName, workspaceId }: TopNavigationProps) {
  const router = useRouter()
  const { workspace, switchWorkspace } = useWorkspace()
  // Active workspace comes from live context first, props as fallback.
  const activeName = workspace?.name ?? workspaceName
  const activeId = workspace?.id ?? workspaceId
  const [open, setOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // Position the (portaled) panel under the trigger. Portaling to <body> escapes
  // the topbar's `backdrop-filter` stacking context, which would otherwise trap
  // the dropdown beneath the page content ("sinks under the top bar" bug).
  useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, left: r.left })
    }
  }, [open])

  // Close on outside click or Escape (trigger + portaled panel both excluded).
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    if (open) {
      document.addEventListener("mousedown", handleClick)
      document.addEventListener("keydown", handleKey)
    }
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  async function fetchWorkspaces() {
    if (workspaces.length > 0) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("workspace_members")
        .select("workspace_id, workspaces(id, name, slug, type)")
        .eq("user_id", user.id)
        .limit(50)
      if (data) {
        // Staged platform: the supplier workspace is only switchable when the
        // supplierWorkspace flag is on (V1: off). Without this, a pre-existing
        // supplier membership leaks into the switcher even with the feature off.
        let supplierOn = false
        try {
          const fr = await fetch("/api/flags/public")
          if (fr.ok) { const f = await fr.json(); supplierOn = Boolean(f?.supplierWorkspace) }
        } catch { /* default off */ }
        const list: Workspace[] = (data
          .map((row: { workspace_id: string; workspaces: unknown }) => {
            const ws = row.workspaces as { id: string; name: string; slug: string; type?: string } | null
            return ws ? { id: ws.id, name: ws.name, slug: ws.slug, type: normaliseType(ws.type) } : null
          })
          .filter(Boolean) as Workspace[])
          // Customer is a buyer/guest identity, not a workspace you "switch" into
          // from an operator/supplier context — it has its own entry point (the
          // login persona switch) and is deliberately omitted here.
          .filter((ws) => ws.type !== "customer")
          // Hide supplier workspaces unless the supplierWorkspace flag is on.
          .filter((ws) => ws.type !== "supplier" || supplierOn)
        setWorkspaces(list)
      }
    } catch {
      // graceful — dropdown just stays empty
    } finally {
      setLoading(false)
    }
  }

  async function handleSwitch(ws: Workspace) {
    if (ws.id === activeId) { setOpen(false); return }
    setSwitching(ws.id)
    try {
      // 1. Persist the active workspace + clear cross-workspace cache.
      await switchWorkspace(ws.id)
      const home = TYPE_HOME[ws.type]
      const currentType = normaliseType(workspace?.type)
      // 2. Route to the chosen workspace's HOME so the correct shell/side-nav
      //    renders. Crossing workspace TYPES means crossing route-group root
      //    layouts (operator ↔ supplier ↔ customer), each with its own
      //    server-side membership gate — a hard navigation guarantees the
      //    destination layout runs and the side-nav fully swaps. Same-type
      //    switches stay a soft navigation (faster, no full reload).
      if (ws.type !== currentType) {
        window.location.assign(home)
        return // full page load takes over; keep spinner until unload.
      }
      router.push(home)
      router.refresh()
    } catch {
      // noop — stay put
    } finally {
      setSwitching(null)
      setOpen(false)
    }
  }

  const grouped = TYPE_ORDER
    .map((type) => ({ type, items: workspaces.filter((w) => w.type === type) }))
    .filter((g) => g.items.length > 0)

  const panel = open && typeof window !== "undefined"
    ? createPortal(
        <div
          ref={panelRef}
          role="menu"
          aria-label="Switch workspace"
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: zIndex.dropdown, width: 260 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-[0_16px_48px_rgba(15,23,42,0.16)] overflow-hidden"
        >
          <div className="px-3 py-2.5 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Your Workspaces</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="px-3 py-4 text-[12px] text-slate-400 text-center">No workspaces found</div>
          ) : (
            <div className="py-1 max-h-[min(60vh,380px)] overflow-y-auto overscroll-contain">
              {grouped.map((group) => {
                const meta = TYPE_META[group.type]
                const GroupIcon = meta.icon
                return (
                  <div key={group.type} className="py-0.5">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {meta.label}
                    </p>
                    {group.items.map((ws) => {
                      const isActive = ws.id === activeId
                      const isSwitching = switching === ws.id
                      return (
                        <button
                          key={ws.id}
                          role="menuitem"
                          onClick={() => handleSwitch(ws)}
                          disabled={isSwitching}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left disabled:opacity-60"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
                            <GroupIcon className="w-3.5 h-3.5 text-[var(--brand)]" />
                          </div>
                          <span className={`flex-1 text-[13px] truncate ${isActive ? "font-semibold text-[var(--brand)]" : "text-slate-700"}`}>
                            {ws.name}
                          </span>
                          {isSwitching ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                          ) : isActive ? (
                            <Check className="w-3.5 h-3.5 text-[var(--brand)]" />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          <div className="border-t border-slate-100 py-1">
            <button
              role="menuitem"
              onClick={() => { setOpen(false); router.push("/onboarding") }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Plus className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <span className="text-[13px] text-slate-500">Create new workspace</span>
            </button>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="shrink-0">
      <button
        ref={triggerRef}
        onClick={() => { setOpen((v) => !v); fetchWorkspaces() }}
        aria-label="Switch workspace"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#F8FBFF] border border-[#DDE8F7] text-[13px] font-semibold text-[#071B4D] hover:bg-[#EBF2FF] hover:border-[#B9D2F3] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
      >
        <Building2 className="w-4 h-4 text-[var(--brand)] shrink-0" />
        <span className="max-w-[96px] sm:max-w-[160px] truncate">{activeName ?? "Your workspace"}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {panel}
    </div>
  )
}

export default function TopNavigation({ workspaceName, workspaceId, base = "/property-manager", onOpenCopilot, guidedHelp = true }: TopNavigationProps) {
  const router = useRouter()
  return (
    <header
      style={{
        borderRadius: 24,
        background: "rgba(255, 255, 255, 0.94)",
        border: "1px solid #E2EAF6",
        boxShadow: "0 14px 40px rgba(15, 23, 42, 0.06)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 mb-3 sm:mb-4 shrink-0 h-14 sm:h-[72px]"
      aria-label="Workspace toolbar"
    >
      {/* Left: Workspace chip with switcher */}
      <WorkspaceSwitcher workspaceName={workspaceName} workspaceId={workspaceId} />

      {/* Center: Search — hidden on small screens, flex-1 spacer keeps actions right */}
      <div className="flex-1 flex justify-center px-1 sm:px-4 min-w-0">
        <div className="hidden md:block w-full max-w-md">
          <GlobalSearch />
        </div>
      </div>

      {/* Right: actions. Secondary shortcuts drop away on smaller screens. */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <QuickCreateButton />

        <NotificationBell />

        {guidedHelp && <TutorialLauncher placement="topnav" />}

        {/* Calendar shortcut — hidden on phones to save width */}
        <button
          onClick={() => router.push(`${base}/calendar`)}
          aria-label="Open calendar"
          className="hidden sm:flex w-[44px] h-[44px] rounded-2xl bg-white border border-[#E2EAF6] items-center justify-center hover:bg-[#F0F7FF] hover:border-[#B9D2F3] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
        >
          <CalendarIcon className="w-5 h-5 text-[#071B4D]" />
        </button>

        {/* Ask AI button — only rendered when a copilot handler is provided
            (e.g. supplier workspace where ChatBubble is not mounted). */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            aria-label="Open AI Copilot"
            className="hidden sm:flex items-center gap-1.5 px-3 h-[44px] rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--color-brand-100)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI</span>
          </button>
        )}

        <AccountMenu />
      </div>
    </header>
  )
}
