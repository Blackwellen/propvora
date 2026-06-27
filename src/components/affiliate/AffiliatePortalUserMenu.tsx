"use client"

import { useState } from "react"
import { LogOut, ChevronDown, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AffiliatePortalUserMenu({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    try {
      await createClient().auth.signOut()
    } finally {
      window.location.assign("/affiliate-login")
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]"><User className="h-4 w-4" /></span>
        <span className="hidden max-w-[140px] truncate sm:inline">{email ?? "Account"}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2 text-[12px] text-slate-500 truncate">{email}</div>
            <button
              onClick={signOut}
              disabled={busy}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 text-slate-400" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
