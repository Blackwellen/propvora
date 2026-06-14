"use client"

import { useState, useEffect } from "react"
import { Monitor, LogOut, Loader2, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import ConfirmDialog from "@/components/account/ConfirmDialog"

export default function SessionsPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [lastSignIn, setLastSignIn] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setEmail(user?.email ?? "")
        setLastSignIn(user?.last_sign_in_at ?? null)
      } catch { /* noop */ } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Sign out of ALL sessions on every device (Supabase global scope).
  async function signOutEverywhere() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut({ scope: "global" })
      router.push("/login")
    } catch {
      setSigningOut(false)
    }
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
  const browser =
    /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Browser"
  const platform =
    /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : "Unknown OS"

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Sessions &amp; Devices</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Manage where you&apos;re signed in</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-slate-900">This Device</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="flex items-center gap-3 py-3.5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Monitor className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-slate-800">{browser} on {platform}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Current
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {email}
                {lastSignIn && ` · Signed in ${new Date(lastSignIn).toLocaleString("en-GB")}`}
              </p>
            </div>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={signingOut}
            className="flex items-center gap-2 text-[13px] font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-60"
          >
            {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign out of all devices
          </button>
        </div>
      </div>

      {/* Honest note about the limitation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
          <div>
            <h3 className="text-[14px] font-bold text-slate-900 mb-1">About session history</h3>
            <p className="text-[13px] text-slate-500">
              A full list of every signed-in device with IP and location requires a server-side
              session log. For now you can sign out everywhere using the button above, which
              immediately revokes all of your sessions across every device.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Sign out of all devices?"
        description="This immediately revokes every active session across all of your devices, including this one. You'll need to sign in again everywhere."
        confirmLabel="Sign out everywhere"
        tone="danger"
        busy={signingOut}
        onConfirm={signOutEverywhere}
        onCancel={() => { if (!signingOut) setConfirmOpen(false) }}
      />
    </div>
  )
}
