"use client"

import { useEffect, useState } from "react"
import { X, KeyRound, Smartphone, Loader2, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { customerInputClass } from "@/components/customer/ui"

/* ──────────────────────────────────────────────────────────────────────────
   Customer security modals — wired directly to Supabase Auth (no customer
   backend migration required). Password change uses auth.updateUser; 2FA uses
   the TOTP MFA enrol → challenge → verify flow.
─────────────────────────────────────────────────────────────────────────── */

function ModalShell({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">{icon}</span>
            <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function PasswordChangeModal({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const [pw, setPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (pw.length < 8) { setError("Password must be at least 8 characters."); return }
    if (pw !== confirm) { setError("Passwords don't match."); return }
    setBusy(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password: pw })
      if (err) { setError(err.message); setBusy(false); return }
      onDone("Password updated.")
      onClose()
    } catch {
      setError("Something went wrong. Please try again.")
      setBusy(false)
    }
  }

  return (
    <ModalShell title="Change password" icon={<KeyRound className="w-4 h-4" />} onClose={onClose}>
      <div className="space-y-3">
        <label className="block">
          <span className="text-[12.5px] font-medium text-slate-600">New password</span>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className={customerInputClass + " mt-1"} placeholder="At least 8 characters" autoComplete="new-password" />
        </label>
        <label className="block">
          <span className="text-[12.5px] font-medium text-slate-600">Confirm new password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={customerInputClass + " mt-1"} placeholder="Re-enter password" autoComplete="new-password" />
        </label>
        {error && <p className="text-[12.5px] text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="border border-slate-200 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-slate-700">Cancel</button>
          <button onClick={submit} disabled={busy} className="bg-[#2563EB] text-white rounded-xl px-4 py-2 text-[12.5px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Update password
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

export function TwoFactorModal({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const [step, setStep] = useState<"loading" | "scan" | "done">("loading")
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Enrol a TOTP factor when the modal opens.
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const supabase = createClient()
        const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: "totp" })
        if (!active) return
        if (err) { setError(err.message); setStep("scan"); return }
        setFactorId(data.id)
        setQr(data.totp.qr_code)
        setSecret(data.totp.secret)
        setStep("scan")
      } catch {
        if (!active) return
        setError("Could not start 2FA setup.")
        setStep("scan")
      }
    })()
    return () => { active = false }
  }, [])

  async function verify() {
    if (!factorId) { setError("Setup not ready. Close and retry."); return }
    if (code.trim().length < 6) { setError("Enter the 6-digit code from your authenticator app."); return }
    setBusy(true)
    setError(null)
    try {
      const supabase = createClient()
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) { setError(challenge.error.message); setBusy(false); return }
      const verifyRes = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: code.trim() })
      if (verifyRes.error) { setError(verifyRes.error.message); setBusy(false); return }
      onDone("Two-factor authentication enabled.")
      onClose()
    } catch {
      setError("Verification failed. Please try again.")
      setBusy(false)
    }
  }

  return (
    <ModalShell title="Enable two-factor authentication" icon={<Smartphone className="w-4 h-4" />} onClose={onClose}>
      {step === "loading" ? (
        <div className="py-8 flex items-center justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          <p className="text-[12.5px] text-slate-600">Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password), then enter the 6-digit code to confirm.</p>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="2FA QR code" className="w-44 h-44 mx-auto rounded-lg border border-slate-200" />
          )}
          {secret && <p className="text-[11px] text-center text-slate-400 break-all">Manual key: {secret}</p>}
          <label className="block">
            <span className="text-[12.5px] font-medium text-slate-600">6-digit code</span>
            <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={customerInputClass + " mt-1 tracking-widest text-center"} placeholder="000000" />
          </label>
          {error && <p className="text-[12.5px] text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="border border-slate-200 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-slate-700">Cancel</button>
            <button onClick={verify} disabled={busy} className="bg-[#2563EB] text-white rounded-xl px-4 py-2 text-[12.5px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Verify & enable
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}
