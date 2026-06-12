"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, User, Settings, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AccountMenuProps {
  name?: string
  role?: string
  initials?: string
}

export default function AccountMenu({
  name,
  role,
  initials,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const displayName = name ?? "James Taylor"
  const displayRole = role ?? "Administrator"
  const displayInitials = initials ?? "JT"

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
      className="bg-white rounded-2xl border border-[#E2EAF6] shadow-[0_12px_40px_rgba(15,23,42,0.14)] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-50">
        <p className="text-[13px] font-semibold text-[#071B4D]">{displayName}</p>
        <p className="text-[11px] text-[#64748B]">{displayRole}</p>
      </div>
      <div className="py-1.5">
        <Link
          href="/app/account"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <User className="w-4 h-4 text-slate-400" />
          Account Settings
        </Link>
        <Link
          href="/app/workspace-settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Workspace Settings
        </Link>
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
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2.5 h-[44px] px-3 rounded-2xl bg-white border border-[#E2EAF6] hover:bg-[#F0F7FF] hover:border-[#B9D2F3] transition-all shadow-sm"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-sm">
          {displayInitials}
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
