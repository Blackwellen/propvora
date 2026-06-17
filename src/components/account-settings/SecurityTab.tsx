"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check, Eye, EyeOff, Lock, Monitor, Shield, Smartphone, LogOut } from "lucide-react"
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

export default function SecurityTab() {
  const [showPwd,    setShowPwd]    = useState({ current: false, new: false, confirm: false })
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [sessions,   setSessions]   = useState(SESSIONS_MOCK)
  const [pwdError,   setPwdError]   = useState<string | null>(null)

  const form = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

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
                  className="w-full h-10 pl-3 pr-10 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
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

      {/* 2FA */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              Two-Factor Authentication
            </h3>
            <p className="text-xs text-slate-500 mt-1">Add an extra layer of security to your account.</p>
          </div>
          <Toggle checked={mfaEnabled} onChange={setMfaEnabled} />
        </div>
        {mfaEnabled && (
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <Check className="w-3 h-3" /> 2FA is enabled
          </p>
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
