"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shield, ShieldCheck, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (signInError || !data.user) {
        setError("Invalid email or password.")
        setLoading(false)
        return
      }

      // Verify platform-admin privilege (RLS allows self-read of own profile).
      const { data: profile } = await supabase
        .from("profiles")
        .select("platform_role")
        .eq("id", data.user.id)
        .maybeSingle()

      if (!profile || profile.platform_role !== "admin") {
        await supabase.auth.signOut()
        setError("Access denied. This portal is restricted to platform administrators.")
        setLoading(false)
        return
      }

      // Hard navigation so the proxy sees the fresh session and the admin layout
      // guard (`getAdminIdentity`) runs with the updated cookie.
      window.location.assign("/admin")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, var(--brand-soft) 0%, var(--bg-surface) 40%, var(--accent-soft) 100%)" }}
    >
      {/* LEFT: Form panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-5">
          <Link href="/" className="flex items-center">
            <Image src="/propvora-logo-dark.png" alt="Propvora" width={520} height={130} className="h-10 w-auto" priority />
          </Link>
          <Link href="/" className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors">
            Back to home
          </Link>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10">
          <div className="w-full max-w-[420px]">
            <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] border border-slate-100/80 p-6 sm:p-8">
              {/* Heading */}
              <div className="mb-7">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] border border-blue-100 px-3 py-1 mb-3">
                  <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wide">Platform Administration</span>
                </div>
                <h1 className="text-[28px] font-bold text-[#06122F] tracking-tight mb-1.5">Admin Portal</h1>
                <p className="text-[14px] text-slate-500 leading-relaxed">Authorised platform administrators only.</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-[13px] text-red-700">{error}</p>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-4 [&_input]:!bg-white [&_input]:!text-slate-900 [&_input]:!border-[#E2E8F0]"
              >
                <div>
                  <label htmlFor="admin-email" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Admin email</label>
                  <Input
                    id="admin-email"
                    type="email"
                    aria-label="Admin email"
                    placeholder="admin@propvora.com"
                    autoComplete="email"
                    autoFocus
                    leftElement={<Mail className="h-4 w-4" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Password</label>
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    aria-label="Password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    leftElement={<Lock className="h-4 w-4" />}
                    rightElement={
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="pointer-events-auto text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full !h-11 !rounded-xl">
                  {loading ? "Authenticating…" : "Sign in to Admin Portal"}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-300" />
                <p className="text-[11.5px] text-slate-400 text-center leading-relaxed">
                  Restricted to authorised platform administrators. Access attempts are logged and monitored.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-[13px] text-slate-500">
              Not an administrator?{" "}
              <Link href="/login" className="font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors">
                Customer sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: image with admin glass cards */}
      <div className="hidden lg:block relative w-[52%] xl:w-[55%] shrink-0 overflow-hidden">
        <Image src="/auth2.png" alt="Propvora platform" fill className="object-cover object-center" priority sizes="55vw" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,18,47,0.30) 0%, rgba(6,18,47,0.55) 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-center items-end pr-12 gap-4">
          {([
            { icon: ShieldCheck, title: "Privileged access", desc: "Platform-wide controls for the Propvora team." },
            { icon: Activity, title: "Audited & monitored", desc: "Every admin action is logged with a full audit trail." },
          ] as const).map((c) => (
            <div key={c.title} className="w-[230px] rounded-2xl px-5 py-4 shadow-lg" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.9)" }}>
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center mb-3">
                <c.icon className="text-[#2563EB]" style={{ width: 18, height: 18 }} />
              </div>
              <p className="text-[13.5px] font-bold text-[#06122F] mb-1">{c.title}</p>
              <p className="text-[12px] text-slate-500 leading-snug">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="absolute bottom-6 left-8">
          <p className="text-[11.5px] text-white/70">&copy; 2026 Blackwellen Ltd, t/a Propvora · Platform Administration</p>
        </div>
      </div>
    </div>
  )
}
