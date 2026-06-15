"use client"

import { useState, useEffect, useId } from "react"
import { Shield, Monitor, Loader2, Check, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import ConfirmDialog from "@/components/account/ConfirmDialog"

/** Password policy: at least 8 characters, one uppercase letter and one number. */
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "New password must be at least 8 characters."
  if (!/[A-Z]/.test(pw)) return "Include at least one uppercase letter."
  if (!/[0-9]/.test(pw)) return "Include at least one number."
  return null
}

function InputField({
  label, value, onChange, type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
      />
    </div>
  )
}

interface MfaFactor {
  id: string
  status: string
  friendly_name?: string | null
}

export default function SecurityPage() {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  const [email, setEmail] = useState("")

  // Email change
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)

  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [mfaSupported, setMfaSupported] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollData, setEnrollData] = useState<{ factorId: string; qr: string; secret: string } | null>(null)
  const [verifyCode, setVerifyCode] = useState("")
  const [mfaMsg, setMfaMsg] = useState<string | null>(null)
  const [disableTarget, setDisableTarget] = useState<string | null>(null)
  const [disabling, setDisabling] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setEmail(user?.email ?? "")
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (error) { setMfaSupported(false); return }
        setFactors((data?.totp ?? []) as MfaFactor[])
      } catch {
        setMfaSupported(false)
      }
    })()
  }, [])

  const mfaEnabled = factors.some(f => f.status === "verified")

  async function handlePasswordChange() {
    setPwMsg(null)
    const policyError = validatePassword(newPw)
    if (policyError) { setPwMsg({ kind: "err", text: policyError }); return }
    if (newPw !== confirmPw) { setPwMsg({ kind: "err", text: "Passwords do not match." }); return }
    setPwSaving(true)
    try {
      const supabase = createClient()
      // Re-authenticate by verifying the current password first
      if (email) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPw })
        if (signInErr) { setPwMsg({ kind: "err", text: "Current password is incorrect." }); setPwSaving(false); return }
      }
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) { setPwMsg({ kind: "err", text: error.message }); setPwSaving(false); return }
      setPwMsg({ kind: "ok", text: "Password updated successfully." })
      setCurrentPw(""); setNewPw(""); setConfirmPw("")
      setTimeout(() => setShowPasswordForm(false), 1500)
    } catch {
      setPwMsg({ kind: "err", text: "Something went wrong. Please try again." })
    } finally {
      setPwSaving(false)
    }
  }

  async function handleEmailChange() {
    setEmailMsg(null)
    const trimmed = newEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailMsg({ kind: "err", text: "Enter a valid email address." }); return
    }
    if (trimmed.toLowerCase() === email.toLowerCase()) {
      setEmailMsg({ kind: "err", text: "That is already your email address." }); return
    }
    setEmailSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ email: trimmed })
      if (error) { setEmailMsg({ kind: "err", text: error.message }); return }
      setEmailMsg({
        kind: "ok",
        text: `Confirmation links sent. Check both ${email} and ${trimmed} to complete the change.`,
      })
      setNewEmail("")
    } catch {
      setEmailMsg({ kind: "err", text: "Something went wrong. Please try again." })
    } finally {
      setEmailSaving(false)
    }
  }

  async function startEnroll() {
    setMfaMsg(null)
    setEnrolling(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" })
      if (error || !data) { setMfaMsg(error?.message ?? "Could not start MFA enrolment."); setEnrolling(false); return }
      setEnrollData({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
    } catch {
      setMfaMsg("MFA enrolment is not available.")
    } finally {
      setEnrolling(false)
    }
  }

  async function verifyEnroll() {
    if (!enrollData) return
    setMfaMsg(null)
    try {
      const supabase = createClient()
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enrollData.factorId })
      if (chErr || !challenge) { setMfaMsg(chErr?.message ?? "Verification failed."); return }
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: challenge.id,
        code: verifyCode.trim(),
      })
      if (error) { setMfaMsg("Invalid code. Please try again."); return }
      const { data } = await supabase.auth.mfa.listFactors()
      setFactors((data?.totp ?? []) as MfaFactor[])
      setEnrollData(null); setVerifyCode("")
      setMfaMsg("Two-factor authentication enabled.")
    } catch {
      setMfaMsg("Verification failed.")
    }
  }

  async function disableMfa(factorId: string) {
    setDisabling(true)
    setMfaMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) { setMfaMsg(error.message); return }
      const { data } = await supabase.auth.mfa.listFactors()
      setFactors((data?.totp ?? []) as MfaFactor[])
      setMfaMsg("Two-factor authentication disabled.")
    } catch {
      setMfaMsg("Could not disable two-factor authentication.")
    } finally {
      setDisabling(false)
      setDisableTarget(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Security</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Manage your password and two-factor authentication
        </p>
      </div>

      {/* Security score */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: mfaEnabled ? "#059669" : "#D97706" }} />
            <h3 className="text-[14px] font-bold text-slate-900">Security Status</h3>
          </div>
          <span className={cn(
            "text-[12px] font-semibold px-3 py-1 rounded-full",
            mfaEnabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          )}>
            {mfaEnabled ? "2FA enabled" : "2FA not enabled"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200">
            <p className="text-[11px] font-semibold text-slate-600">Password</p>
            <p className="text-[12px] font-bold mt-1 text-emerald-700">Set</p>
          </div>
          <div className={cn("p-4 rounded-xl border", mfaEnabled ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200")}>
            <p className="text-[11px] font-semibold text-slate-600">Two-Factor Auth</p>
            <p className={cn("text-[12px] font-bold mt-1", mfaEnabled ? "text-emerald-700" : "text-amber-700")}>
              {mfaEnabled ? "Enabled" : "Not enabled"}
            </p>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Password</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Change the password for your account</p>
          </div>
          <button
            onClick={() => { setShowPasswordForm(s => !s); setPwMsg(null) }}
            className="px-4 py-2 rounded-xl border border-slate-200 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {showPasswordForm ? "Cancel" : "Change password"}
          </button>
        </div>
        {showPasswordForm && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <InputField label="Current password" value={currentPw} onChange={setCurrentPw} type="password" />
            <InputField label="New password" value={newPw} onChange={setNewPw} type="password" />
            <InputField label="Confirm new password" value={confirmPw} onChange={setConfirmPw} type="password" />
            {pwMsg && (
              <p className={cn("text-[12px]", pwMsg.kind === "ok" ? "text-emerald-600" : "text-red-600")}>{pwMsg.text}</p>
            )}
            <button
              onClick={handlePasswordChange}
              disabled={pwSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors mt-2 disabled:opacity-70"
            >
              {pwSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {pwSaving ? "Updating…" : "Update password"}
            </button>
          </div>
        )}
      </div>

      {/* Email address */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Email address</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Sign-in email{email ? ` · ${email}` : ""}
            </p>
          </div>
          <button
            onClick={() => { setShowEmailForm(s => !s); setEmailMsg(null); setNewEmail("") }}
            className="px-4 py-2 rounded-xl border border-slate-200 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {showEmailForm ? "Cancel" : "Change email"}
          </button>
        </div>
        {showEmailForm && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-[12px] text-slate-600">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#2563EB]" />
              For your security, changing your email sends a confirmation link to{" "}
              <span className="font-semibold">both</span> your current and new address. The change
              only takes effect once you confirm from each inbox.
            </div>
            <InputField label="New email address" value={newEmail} onChange={setNewEmail} type="email" />
            {emailMsg && (
              <p className={cn("text-[12px]", emailMsg.kind === "ok" ? "text-emerald-600" : "text-red-600")}>{emailMsg.text}</p>
            )}
            <button
              onClick={handleEmailChange}
              disabled={emailSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors mt-2 disabled:opacity-70"
            >
              {emailSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {emailSaving ? "Sending…" : "Send confirmation"}
            </button>
          </div>
        )}
      </div>

      {/* MFA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Two-Factor Authentication</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Add an authenticator-app code to your sign-in
            </p>
          </div>
          {!mfaSupported ? (
            <span className="text-[12px] text-slate-400">Unavailable</span>
          ) : mfaEnabled ? (
            <button
              onClick={() => { const f = factors.find(x => x.status === "verified"); if (f) setDisableTarget(f.id) }}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-[12.5px] font-semibold hover:bg-red-50 transition-colors"
            >
              Disable 2FA
            </button>
          ) : !enrollData ? (
            <button
              onClick={startEnroll}
              disabled={enrolling}
              className="px-4 py-2 rounded-xl bg-[#059669] text-white text-[12.5px] font-semibold hover:bg-[#047857] transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {enrolling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Enable 2FA
            </button>
          ) : null}
        </div>

        {!mfaSupported && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-[12px] text-slate-500">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            Multi-factor authentication is not enabled for this Supabase project. Enable the MFA add-on to use 2FA.
          </div>
        )}

        {enrollData && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[12.5px] text-slate-600 mb-3">
              Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
            </p>
            {/* QR is a data URI returned by Supabase — safe, no external URL */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enrollData.qr} alt="2FA QR code" className="w-40 h-40 rounded-xl border border-slate-200" />
            <p className="text-[11px] text-slate-400 mt-2">Manual key: <span className="font-mono">{enrollData.secret}</span></p>
            <div className="flex items-center gap-2 mt-3 max-w-xs">
              <input
                aria-label="6-digit verification code"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-[#2563EB]"
              />
              <button
                onClick={verifyEnroll}
                className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
              >
                Verify
              </button>
            </div>
          </div>
        )}

        {mfaMsg && <p className="text-[12px] text-slate-600 mt-3 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" />{mfaMsg}</p>}
      </div>

      {/* Session note — honest about Supabase capabilities */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-[14px] font-bold text-slate-900">Sessions</h3>
        </div>
        <p className="text-[13px] text-slate-500">
          Manage your active session on the{" "}
          <a href="/app/account/sessions" className="text-[#2563EB] font-medium hover:underline">Sessions &amp; Devices</a> page.
        </p>
      </div>

      <ConfirmDialog
        open={disableTarget !== null}
        title="Disable two-factor authentication?"
        description="Your account will no longer require an authenticator code at sign-in. We recommend keeping two-factor authentication on for stronger account security."
        confirmLabel="Disable 2FA"
        tone="danger"
        busy={disabling}
        onConfirm={() => { if (disableTarget) disableMfa(disableTarget) }}
        onCancel={() => { if (!disabling) setDisableTarget(null) }}
      />
    </div>
  )
}
