"use client"

import { useState, useEffect, useRef } from "react"
import { Building2, ChevronDown, Calendar as CalendarIcon, Check, Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import GlobalSearch from "./GlobalSearch"
import QuickCreateButton from "./QuickCreateButton"
import NotificationBell from "./NotificationBell"
import AccountMenu from "./AccountMenu"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

interface Workspace {
  id: string
  name: string
  slug: string
}

interface TopNavigationProps {
  workspaceName?: string
  workspaceId?: string
}

function WorkspaceSwitcher({ workspaceName, workspaceId }: TopNavigationProps) {
  const router = useRouter()
  const { switchWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
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
        .select("workspace_id, workspaces(id, name, slug)")
        .eq("user_id", user.id)
        .limit(20)
      if (data) {
        const list: Workspace[] = data
          .map((row: { workspace_id: string; workspaces: unknown }) => {
            const ws = row.workspaces as { id: string; name: string; slug: string } | null
            return ws ? { id: ws.id, name: ws.name, slug: ws.slug } : null
          })
          .filter(Boolean) as Workspace[]
        setWorkspaces(list)
      }
    } catch {
      // graceful — dropdown just stays empty
    } finally {
      setLoading(false)
    }
  }

  async function handleSwitch(id: string) {
    if (id === workspaceId) { setOpen(false); return }
    setSwitching(id)
    try {
      // Clears React Query cache + reloads workspace context (no cross-workspace leak)
      await switchWorkspace(id)
      router.push("/app")
    } catch {
      // noop
    } finally {
      setSwitching(null)
      setOpen(false)
    }
  }

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => { setOpen((v) => !v); fetchWorkspaces() }}
        className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-[#F8FBFF] border border-[#DDE8F7] text-[13px] font-semibold text-[#071B4D] hover:bg-[#EBF2FF] hover:border-[#B9D2F3] transition-all"
      >
        <Building2 className="w-4 h-4 text-[#2563EB] shrink-0" />
        <span className="max-w-[96px] sm:max-w-[160px] truncate">{workspaceName ?? "Propvora Estates"}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-12 left-0 z-50 w-[240px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
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
            <div className="py-1">
              {workspaces.map((ws) => {
                const isActive = ws.id === workspaceId
                const isSwitching = switching === ws.id
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitch(ws.id)}
                    disabled={isSwitching}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    </div>
                    <span className={`flex-1 text-[13px] truncate ${isActive ? "font-semibold text-[#2563EB]" : "text-slate-700"}`}>
                      {ws.name}
                    </span>
                    {isSwitching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : isActive ? (
                      <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}

          <div className="border-t border-slate-100 py-1">
            <button
              onClick={() => { setOpen(false); router.push("/onboarding") }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Plus className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <span className="text-[13px] text-slate-500">Create new workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TopNavigation({ workspaceName, workspaceId }: TopNavigationProps) {
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

        {/* Calendar shortcut — hidden on phones to save width */}
        <button
          onClick={() => router.push("/app/calendar")}
          aria-label="Open calendar"
          className="hidden sm:flex w-[44px] h-[44px] rounded-2xl bg-white border border-[#E2EAF6] items-center justify-center hover:bg-[#F0F7FF] hover:border-[#B9D2F3] transition-all shadow-sm"
        >
          <CalendarIcon className="w-5 h-5 text-[#071B4D]" />
        </button>

        <AccountMenu />
      </div>
    </header>
  )
}
