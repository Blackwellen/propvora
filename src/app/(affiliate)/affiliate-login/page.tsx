"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, TrendingUp, Wallet } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function mapErr(code?: string): string {
  if (code === "invalid_credentials") return "Incorrect email or password. Please try again."
  if (code === "email_not_confirmed") return "Please confirm your email first — check your inbox."
  if (code === "too_many_requests") return "Too many sign-in attempts. Please wait a minute and try again."
  return "Couldn’t sign you in. Please try again."
}

async function checkRateLimit(action: string): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/rate-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    if (res.status === 429) {
      const json = await res.json().catch(() => ({}))
      return (json as { message?: string }).message ?? "Too many attempts. Please wait and try again."
    }
    return null
  } catch {
    return null
  }
}

function AffiliateLoginInner() {
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(params.get("error") === "no_workspace" ? "We couldn’t set up your affiliate space — please sign in again." : null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)
    const gate = await checkRateLimit("login")
    if (gate) { setErr(gate); setBusy(false); return }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) { setErr(mapErr(error.code ?? error.message)); setBusy(false); return }
    // Hard navigation so the proxy sees the fresh session for /affiliate.
    window.location.assign("/affiliate")
  }

  async function onGoogle() {
    setBusy(true); setErr(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/affiliate`, queryParams: { access_type: "offline", prompt: "consent" } },
    })
    if (error) { setErr("Couldn’t start Google sign-in."); setBusy(false) }
  }

  return (
    <div className="flex min-h-screen">
      {/* Form */}
      <div className="flex flex-1 flex-col">
        <div className="px-6 py-5 sm:px-10">
          <Link href="/affiliate-programme"><Image src="/propvora-logo-dark.png" alt="Propvora" width={130} height={28} priority /></Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-[400px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-600"><Sparkles className="h-3.5 w-3.5" /> Affiliate portal</span>
            <h1 className="mt-4 text-2xl font-bold text-[#0D1B2A]">Sign in to your affiliate account</h1>
            <p className="mt-1.5 text-sm text-slate-500">Track referrals, see your earnings and manage payouts.</p>

            {err && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-semibold text-slate-600">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[14px] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100" />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-semibold text-slate-600">Password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-10 text-[14px] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100" />
                  <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </label>
              <button type="submit" disabled={busy} className="h-11 w-full rounded-xl bg-[#2563EB] text-[14px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
              <div className="text-right">
                <Link href="/forgot-password" className="text-[12.5px] text-slate-500 hover:text-[#2563EB]">Forgot password?</Link>
              </div>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-[12px] text-slate-400">or</span></div>
            </div>
            <button onClick={onGoogle} disabled={busy} className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-[13.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Continue with Google
            </button>

            <div className="mt-6 space-y-2 text-center text-[13px] text-slate-500">
              <p>New to the programme? <Link href="/affiliate-programme/apply" className="font-semibold text-[#2563EB] hover:text-[#1d4ed8]">Apply to become an affiliate</Link></p>
              <p>Have an approval code? <Link href="/register?next=/affiliate" className="font-semibold text-[#2563EB] hover:text-[#1d4ed8]">Create your account</Link></p>
            </div>
          </div>
        </div>
      </div>

      {/* Right brand panel */}
      <div className="hidden flex-1 flex-col justify-center bg-gradient-to-br from-[#0D1B2A] to-[#1e3a5f] px-12 text-white lg:flex">
        <h2 className="text-3xl font-bold leading-tight">Earn for every business you bring to Propvora.</h2>
        <p className="mt-3 max-w-md text-[15px] text-white/70">Share your link, track conversions in real time, and get paid by Stripe or bank transfer.</p>
        <ul className="mt-8 space-y-4">
          {[
            { icon: TrendingUp, t: "Recurring commission", s: "Earn on eligible subscription revenue per referral." },
            { icon: Wallet, t: "Reliable payouts", s: "Stripe Connect or manual bank details — your choice." },
            { icon: Sparkles, t: "Live dashboard", s: "Links, referrals and cleared earnings in one place." },
          ].map(({ icon: I, t, s }) => (
            <li key={t} className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><I className="h-4 w-4" /></span>
              <div><p className="text-[14px] font-semibold">{t}</p><p className="text-[13px] text-white/60">{s}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function AffiliateLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>}>
      <AffiliateLoginInner />
    </Suspense>
  )
}
