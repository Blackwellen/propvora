"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check, Eye, EyeOff, Lock, Monitor, Shield, Smartphone, LogOut, QrCode, Key, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@/lib/supabase/client"
import { Toggle, SESSIONS_MOCK } from "./shared"

const passwordSchema = z.object({
  current:  z.string().min(1, "Current password required"),
  password: z.string().min(8, "Minimum 8 characters"),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] })

type PasswordData = z.infer<typeof passwordSchema>

type MfaStep = "idle" | "loading" | "qr" | "verifying" | "enrolled" | "error"

interface EnrollData {
  factorId: string
  qrCode: string  // SVG data URI
  secret: string
  uri: string
}

export default function SecurityTab() {
  const [showPwd,    setShowPwd]    = useState({ current: false, new: false, confirm: false })
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [sessions,   setSessions]   = useState(SESSIONS_MOCK)
  const [pwdError,   setPwdError]   = useState<string | null>(null)

  // MFA state
  const [mfaStep,    setMfaStep]    = useState<MfaStep>("loading")
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null)
  const [totpCode,   setTotpCode]   = useState("")
  const [mfaError,   setMfaError]   = useState<string | null>(null)
  const [enrolledFactorId, setEnrolledFactorId] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)

  const form = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  // Check current MFA enrollment status on mount
  const checkMfaStatus = useCallback(async () => {
    setMfaStep("loading")
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) { setMfaStep("idle"); return }
      const verified = data?.totp?.filter(f => f.status === "verified") ?? []
      if (verified.length > 0) {
        setEnrolledFactorId(verified[0].id)
        setMfaStep("enrolled")
      } else {
        setMfaStep("idle")
      }
    } catch {
      setMfaStep("idle")
    }
  }, [])

  useEffect(() => { checkMfaStatus() }, [checkMfaStatus])

  async function onSubmit(data: PasswordData) {
    setSaving(true); setPwdError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) { setPwdError("Not signed in."); return }
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.current,
      })
      if (reauthErr) { setPwdError("Current password is incorrect."); return }
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) { setPwdError(error.message); return }
      await supabase.from("profiles").update({ password_changed_at: new Date().toISOString() }).eq("id", user.id)
      setSaved(true); form.reset()
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setPwdError("Could not update password. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function startEnroll() {
    setMfaError(null)
    setMfaStep("loading")
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Propvora Authenticator",
      })
      if (error || !data) {
        setMfaError(error?.message ?? "Could not start enrollment. Please try again.")
        setMfaStep("idle")
        return
      }
      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      })
      setTotpCode("")
      setMfaStep("qr")
    } catch {
      setMfaError("Unexpected error. Please try again.")
      setMfaStep("idle")
    }
  }

  async function verifyEnroll() {
    if (!enrollData || totpCode.length !== 6) return
    setMfaError(null)
    setMfaStep("verifying")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code: totpCode,
      })
      if (error) {
        setMfaError("Incorrect code — check your authenticator app and try again.")
        setMfaStep("qr")
        return
      }
      setEnrolledFactorId(enrollData.factorId)
      setEnrollData(null)
      setTotpCode("")
      setMfaStep("enrolled")
    } catch {
      setMfaError("Verification failed. Please try again.")
      setMfaStep("qr")
    }
  }

  async function unenroll() {
    if (!enrolledFactorId) return
    setMfaError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.mfa.unenroll({ factorId: enrolledFactorId })
      if (error) { setMfaError(error.message); return }
      setEnrolledFactorId(null)
      setMfaStep("idle")
    } catch {
      setMfaError("Could not remove 2FA. Please try again.")
    }
  }

  function cancelEnroll() {
    setEnrollData(null)
    setTotpCode("")
    setMfaError(null)
    setMfaStep("idle")
  }

  return (
    <div className="space-y-8">
      {/* Change password */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          Change Password
        </h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          {(
            [
              ["current", "Current Password", "current"],
              ["password", "New Password", "new"],
              ["confirm", "Confirm New Password", "confirm"],
            ] as [keyof PasswordData, string, keyof typeof showPwd][]
          ).map(([field, label, k]) => (
            <div key={field} className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{label}</label>
              <div className="relative">
                <input
                  {...form.register(field)}
                  type={showPwd[k] ? "text" : "password"}
                  className="w-full h-10 pl-3 pr-10 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPwd(p => ({ ...p, [k]: !p[k] }))}
                >
                  {showPwd[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors[field] && (
                <p className="text-xs text-red-600">{form.formState.errors[field]?.message}</p>
              )}
            </div>
          ))}
          {pwdError && <p className="text-xs text-red-600">{pwdError}</p>}
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            leftIcon={saved ? <Check className="w-4 h-4" /> : undefined}
          >
            {saved ? "Password Updated!" : "Update Password"}
          </Button>
        </form>
      </div>

      {/* 2FA — real Supabase TOTP enrollment */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              Two-Factor Authentication
            </h3>
            <p className="text-xs text-slate-500 mt-1">Add an extra layer of security using an authenticator app.</p>
          </div>
          {mfaStep === "enrolled" && (
            <Badge variant="success">Enabled</Badge>
          )}
        </div>

        {mfaError && (
          <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {mfaError}
          </div>
        )}

        {/* Idle — not enrolled */}
        {mfaStep === "idle" && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<QrCode className="w-4 h-4" />}
            onClick={startEnroll}
          >
            Set up authenticator app
          </Button>
        )}

        {/* Loading */}
        {mfaStep === "loading" && (
          <p className="text-xs text-slate-400 animate-pulse">Checking 2FA status…</p>
        )}

        {/* QR code step */}
        {mfaStep === "qr" && enrollData && (
          <div className="space-y-4 max-w-sm">
            <p className="text-xs text-slate-600">
              Scan this QR code with <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>1Password</strong>, then enter the 6-digit code below.
            </p>

            {/* QR image */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrollData.qrCode}
                alt="TOTP QR Code"
                width={160}
                height={160}
                className="block"
              />
            </div>

            {/* Manual entry toggle */}
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
              onClick={() => setShowSecret(s => !s)}
            >
              <Key className="w-3 h-3" />
              {showSecret ? "Hide" : "Can't scan? Enter manually"}
            </button>
            {showSecret && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Manual entry key:</p>
                <code className="text-xs font-mono text-slate-800 break-all">{enrollData.secret}</code>
              </div>
            )}

            {/* Code entry */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-40 h-10 px-3 rounded-lg text-sm font-mono text-center border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] tracking-widest"
                onKeyDown={e => e.key === "Enter" && totpCode.length === 6 && verifyEnroll()}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={totpCode.length !== 6}
                onClick={verifyEnroll}
              >
                Verify and enable
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<X className="w-3.5 h-3.5" />}
                onClick={cancelEnroll}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Verifying */}
        {mfaStep === "verifying" && (
          <p className="text-xs text-slate-400 animate-pulse">Verifying code…</p>
        )}

        {/* Enrolled */}
        {mfaStep === "enrolled" && (
          <div className="space-y-3">
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> 2FA is active — your account is protected.
            </p>
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-red-600 underline transition-colors"
              onClick={unenroll}
            >
              Remove authenticator
            </button>
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Active Sessions</h3>
          <Button variant="destructive-soft" size="sm">Sign out all devices</Button>
        </div>
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 bg-white">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                {s.device.includes("iPhone")
                  ? <Smartphone className="w-4 h-4 text-slate-500" />
                  : <Monitor className="w-4 h-4 text-slate-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">{s.device}</p>
                  {s.current && <Badge variant="success" size="sm">Current</Badge>}
                </div>
                <p className="text-xs text-slate-400">{s.location} · {s.last}</p>
              </div>
              {!s.current && (
                <Button
                  variant="outline"
                  size="xs"
                  leftIcon={<LogOut className="w-3 h-3" />}
                  onClick={() => setSessions(p => p.filter(x => x.id !== s.id))}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
