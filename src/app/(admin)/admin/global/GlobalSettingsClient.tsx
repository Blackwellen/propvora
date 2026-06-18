"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Globe2, Palette, Bell, ShieldCheck, ScrollText, Plug, Save, RotateCcw } from "lucide-react"
import { AdminCard, AdminStatusChip } from "@/components/admin/ui"
import { cn } from "@/lib/utils"
import { saveGlobalSettings } from "./actions"
import { DEFAULT_GLOBAL, type GlobalSettings } from "@/lib/admin/global-settings.types"

type TabKey = "locale" | "branding" | "notifications" | "security" | "compliance" | "integrations"
const TABS: { key: TabKey; label: string; icon: typeof Globe2 }[] = [
  { key: "locale", label: "Locale", icon: Globe2 },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "compliance", label: "Compliance", icon: ScrollText },
  { key: "integrations", label: "Integrations", icon: Plug },
]

const inputCls = "w-full h-9 rounded-xl border border-[#E2EAF6] bg-white px-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-slate-600 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", on ? "bg-[#2563EB]" : "bg-slate-300")}>
      <span className="inline-block rounded-full bg-white shadow transition-transform" style={{ height: 18, width: 18, transform: on ? "translateX(22px)" : "translateX(4px)" }} />
    </button>
  )
}

export default function GlobalSettingsClient({ initial, notConfigured }: { initial: GlobalSettings; notConfigured: boolean }) {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>("locale")
  const [s, setS] = useState<GlobalSettings>(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof GlobalSettings>(k: K, v: GlobalSettings[K]) => { setS((p) => ({ ...p, [k]: v })); setSaved(false) }

  function save() {
    setError(null)
    startTransition(async () => {
      const res = await saveGlobalSettings(s)
      if (!res.ok) { setError(res.error ?? "Could not save."); return }
      setSaved(true)
      router.refresh()
    })
  }
  function reset() {
    setS({ ...DEFAULT_GLOBAL, stripeConfigured: s.stripeConfigured, resendConfigured: s.resendConfigured, supabaseConfigured: s.supabaseConfigured })
    setSaved(false)
  }

  return (
    <>
      {notConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <span className="font-semibold">platform_settings not provisioned.</span> Defaults shown below cannot be persisted yet.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar rounded-xl border border-[#E2EAF6] bg-white p-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={cn("inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors", tab === t.key ? "bg-[#0D1B2A] text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100")}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <AdminCard>
        {tab === "locale" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default timezone"><input value={s.defaultTimezone} onChange={(e) => set("defaultTimezone", e.target.value)} className={inputCls} /></Field>
            <Field label="Default locale"><input value={s.defaultLocale} onChange={(e) => set("defaultLocale", e.target.value)} className={inputCls} /></Field>
            <Field label="Default currency"><input value={s.defaultCurrency} onChange={(e) => set("defaultCurrency", e.target.value)} className={inputCls} /></Field>
            <Field label="Week starts on">
              <select value={s.weekStart} onChange={(e) => set("weekStart", e.target.value)} className={inputCls}>
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </Field>
          </div>
        )}

        {tab === "branding" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name"><input value={s.productName} onChange={(e) => set("productName", e.target.value)} className={inputCls} /></Field>
            <Field label="Support email"><input value={s.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} className={inputCls} /></Field>
            <Field label="Support URL" hint="Where the in-app help links point."><input value={s.supportUrl} onChange={(e) => set("supportUrl", e.target.value)} className={inputCls} /></Field>
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-4">
            <Field label="System 'from' email" hint="Sender for transactional platform email."><input value={s.systemFromEmail} onChange={(e) => set("systemFromEmail", e.target.value)} className={inputCls} /></Field>
            <div className="flex items-center justify-between rounded-xl border border-[#EEF3FB] px-3.5 py-3">
              <div><p className="text-[13px] font-medium text-slate-700">Weekly digest</p><p className="text-[11px] text-slate-400">Send the workspace activity digest by default.</p></div>
              <Toggle on={s.digestEnabled} onClick={() => set("digestEnabled", !s.digestEnabled)} label="Weekly digest" />
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[#EEF3FB] px-3.5 py-3">
              <div><p className="text-[13px] font-medium text-slate-700">Enforce MFA for admins</p><p className="text-[11px] text-slate-400">Platform admins must complete step-up MFA (AAL2).</p></div>
              <Toggle on={s.enforceMfaAdmins} onClick={() => set("enforceMfaAdmins", !s.enforceMfaAdmins)} label="Enforce MFA for admins" />
            </div>
            <Field label="Session timeout (minutes)"><input type="number" min={5} max={1440} value={s.sessionTimeoutMins} onChange={(e) => set("sessionTimeoutMins", Number(e.target.value))} className={inputCls} /></Field>
          </div>
        )}

        {tab === "compliance" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary data region">
              <select value={s.dataRegion} onChange={(e) => set("dataRegion", e.target.value)} className={inputCls}>
                <option value="uk">United Kingdom</option>
                <option value="eu">European Union</option>
                <option value="us">United States</option>
              </select>
            </Field>
            <Field label="Default retention (days)" hint="Applies to operational logs unless overridden."><input type="number" min={30} value={s.retentionDays} onChange={(e) => set("retentionDays", Number(e.target.value))} className={inputCls} /></Field>
          </div>
        )}

        {tab === "integrations" && (
          <ul className="space-y-2.5">
            {[
              { label: "Stripe (billing)", ok: s.stripeConfigured },
              { label: "Resend (email)", ok: s.resendConfigured },
              { label: "Supabase (data / auth)", ok: s.supabaseConfigured },
            ].map((i) => (
              <li key={i.label} className="flex items-center justify-between rounded-xl border border-[#EEF3FB] px-3.5 py-3">
                <span className="text-[13px] font-medium text-slate-700">{i.label}</span>
                <AdminStatusChip tone={i.ok ? "emerald" : "slate"} dot>{i.ok ? "Configured" : "Not configured"}</AdminStatusChip>
              </li>
            ))}
            <p className="text-[11px] text-slate-400 pt-1">Presence is derived from server environment variables. Secret values are never read or displayed.</p>
          </ul>
        )}
      </AdminCard>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] text-red-600">{error}</div>}

      <div className="sticky bottom-0 z-20 -mx-1 mt-2 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-[#E2EAF6] bg-white/95 backdrop-blur px-4 py-3 shadow-[0_-2px_12px_rgba(15,23,42,0.06)]">
        <span className="mr-auto text-[12px] text-slate-400">{saved ? "Saved. Defaults updated." : "Changes apply to new workspaces and platform-wide defaults."}</span>
        <button type="button" disabled={pending} onClick={reset} className="h-9 px-4 rounded-xl border border-[#E2EAF6] text-[13px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 disabled:opacity-50"><RotateCcw className="w-4 h-4" /> Reset to defaults</button>
        <button type="button" disabled={pending || notConfigured} onClick={save} className="h-9 px-4 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] inline-flex items-center gap-1.5 disabled:opacity-50"><Save className="w-4 h-4" /> {pending ? "Saving…" : "Save changes"}</button>
      </div>
    </>
  )
}
