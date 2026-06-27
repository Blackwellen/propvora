"use client"

import { useState } from "react"
import { Mail, Globe, Zap, Loader2, Check } from "lucide-react"
import { useAuthIdentities, linkProvider, sendMagicLink } from "@/lib/account/identities"

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  github: "GitHub",
  azure: "Microsoft",
}

export default function LoginMethodsPage() {
  const { identities, email, loading, error, hasPassword, refresh } = useAuthIdentities()
  const [magicBusy, setMagicBusy] = useState(false)
  const [magicMsg, setMagicMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [connectBusy, setConnectBusy] = useState(false)
  const [connectErr, setConnectErr] = useState<string | null>(null)

  const googleLinked = identities.some(i => i.provider === "google")

  async function handleMagicLink() {
    if (!email) return
    setMagicBusy(true); setMagicMsg(null)
    const res = await sendMagicLink(email)
    setMagicBusy(false)
    setMagicMsg(res.ok
      ? { kind: "ok", text: `Magic link sent to ${email}. Check your inbox.` }
      : { kind: "err", text: res.error ?? "Could not send the link." })
  }

  async function handleConnectGoogle() {
    setConnectBusy(true); setConnectErr(null)
    const res = await linkProvider("google")
    if (!res.ok) { setConnectErr(res.error ?? "Could not connect."); setConnectBusy(false) }
    // On success the browser redirects to Google; refresh covers the no-redirect case.
    else { await refresh(); setConnectBusy(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Login Methods</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Manage how you sign in to Propvora</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Your sign-in methods</h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            {/* Email & password */}
            <div className="flex items-center justify-between py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-slate-800">Email &amp; Password</p>
                    {hasPassword && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-brand-100)] text-[var(--brand)]">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{email || "—"}</p>
                  <p className="text-[11px] text-slate-400">Sign in with your email and password</p>
                </div>
              </div>
              <span className="text-[11.5px] font-medium text-emerald-600">Active</span>
            </div>

            {/* Magic link */}
            <div className="flex items-center justify-between py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">Magic Link</p>
                  <p className="text-[11px] text-slate-400">Passwordless sign-in via an email link</p>
                  {magicMsg && (
                    <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${magicMsg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
                      {magicMsg.kind === "ok" && <Check className="w-3 h-3" />}{magicMsg.text}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleMagicLink}
                disabled={magicBusy || !email}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {magicBusy && <Loader2 className="w-3 h-3 animate-spin" />}
                Send link
              </button>
            </div>

            {/* Linked OAuth identities */}
            {identities.map(i => (
              <div key={i.key} className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{PROVIDER_LABELS[i.provider] ?? i.provider}</p>
                    <p className="text-[11px] text-slate-400">{i.email ?? "Connected"}</p>
                  </div>
                </div>
                <span className="text-[11.5px] font-medium text-emerald-600">Connected</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add a login method */}
      {!loading && !googleLinked && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
          <h3 className="text-[14px] font-bold text-slate-900 mb-1">Add a login method</h3>
          <p className="text-[12.5px] text-slate-500 mb-4">
            Connect additional providers so you have multiple ways to access your account.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleConnectGoogle}
              disabled={connectBusy}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {connectBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              Connect Google
            </button>
          </div>
          {connectErr && <p className="text-[12px] text-red-500 mt-3">{connectErr}</p>}
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <p className="text-[12.5px] text-slate-500">
          <span className="font-semibold text-slate-700">Note:</span> Single sign-on providers must be
          enabled for your organisation before they can be connected. Contact your workspace administrator
          to configure additional providers.
        </p>
      </div>
    </div>
  )
}
