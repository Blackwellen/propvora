"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ChevronDown, User, Settings, LogOut, ShieldCheck, LifeBuoy } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import PersonaLinks from "./PersonaLinks"

interface AccountMenuProps {
  name?: string
  role?: string
  initials?: string
}

function initialsOf(name: string): string {
  return (
    name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "U"
  )
}

export default function AccountMenu({
  name,
  role,
  initials,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })
  const [liveUser, setLiveUser] = useState<{ name: string; email: string | null; avatarUrl: string | null } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Live signed-in user (no fake placeholder). Also checks platform_role for admin link.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u || cancelled) return
        let display = (u.user_metadata?.display_name as string) || ""
        let avatarUrl: string | null = null
        try {
          const { data: p } = await supabase
            .from("profiles")
            .select("display_name, first_name, last_name, avatar_url, platform_role")
            .eq("id", u.id)
            .maybeSingle()
          if (p) {
            display = (p.display_name as string) || [p.first_name, p.last_name].filter(Boolean).join(" ") || display
            const key = p.avatar_url as string | null
            if (key) avatarUrl = key.startsWith("http") || key.startsWith("/api/") ? key : `/api/files/${key}`
            if (!cancelled) setIsAdmin((p.platform_role as string) === "admin")
          }
        } catch { /* ignore */ }
        if (!display) display = u.email?.split("@")[0] ?? "Your account"
        if (!cancelled) setLiveUser({ name: display, email: u.email ?? null, avatarUrl })
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [])

  // Position dropdown relative to button using fixed coords (escapes overflow:hidden)
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [open])

  // Close on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
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

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // window.location.assign avoids the proxy bounce loop that router.push causes
    // when the proxy redirects authed users off /login back to /app.
    window.location.assign("/login")
  }

  const displayName = name ?? liveUser?.name ?? "Your account"
  const displayRole = role ?? liveUser?.email ?? "View profile"
  const displayInitials = initials ?? initialsOf(liveUser?.name ?? "U")

  const dropdown = open ? (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: dropPos.top,
        right: dropPos.right,
        zIndex: 9999,
        width: 220,
      }}
      className="bg-white rounded-2xl border border-[#E2EAF6] shadow-[0_12px_40px_rgba(15,23,42,0.14)] overflow-hidden max-h-[min(70vh,440px)] flex flex-col"
    >
      <div className="px-4 py-3 border-b border-slate-50 shrink-0">
        <p className="text-[13px] font-semibold text-[#071B4D]">{displayName}</p>
        <p className="text-[11px] text-[#64748B]">{displayRole}</p>
      </div>
      <div className="py-1.5 overflow-y-auto overscroll-contain">
        <Link
          href="/property-manager/account"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <User className="w-4 h-4 text-slate-400" />
          Account Settings
        </Link>
        <Link
          href="/property-manager/workspace-settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Workspace Settings
        </Link>
        {/* Cross-persona shortcut — customer is excluded from the workspace
            switcher, so it gets an explicit door here (only if the account has
            a customer workspace). */}
        <PersonaLinks targets={["customer"]} onNavigate={() => setOpen(false)} />
        <Link
          href="/property-manager/help"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <LifeBuoy className="w-4 h-4 text-slate-400" />
          Help &amp; Support
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-violet-700 hover:bg-violet-50 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-violet-500" />
            Platform Admin
          </Link>
        )}
        <div className="h-px bg-slate-100 mx-3 my-1" />
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2.5 h-[44px] px-3 rounded-2xl bg-white border border-[#E2EAF6] hover:bg-[#F0F7FF] hover:border-[#B9D2F3] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[#0EA5E9] flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-sm overflow-hidden">
          {liveUser?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={liveUser.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            displayInitials
          )}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[13px] font-semibold text-[#071B4D] leading-tight">{displayName}</p>
          <p className="text-[11px] text-[#64748B]">{displayRole}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
      </button>

      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </>
  )
}
