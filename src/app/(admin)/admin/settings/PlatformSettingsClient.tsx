"use client"

import React, { useMemo, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Save, Download, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react"
import { AdminConfirmDialog } from "@/components/admin/ui"
import { savePlatformSetting, setFeatureFlag } from "../actions"
import { saveMaintenanceMode } from "@/lib/admin/mutations"
import type { PlatformFlag } from "@/lib/admin/data"

const TABS = [
  { key: "general", label: "General" },
  { key: "platform", label: "Platform" },
  { key: "billing", label: "Billing" },
  { key: "ai", label: "AI" },
  { key: "email", label: "Email / SMTP" },
  { key: "storage", label: "Storage" },
  { key: "compliance", label: "Compliance" },
  { key: "flags", label: "Feature flags" },
  { key: "ratelimits", label: "Rate limits" },
  { key: "support", label: "Support" },
]

interface GeneralCfg { platform_name?: string; support_email?: string; trial_length_days?: number }
interface MaintenanceCfg { enabled?: boolean; message?: string; allow_admins?: boolean }

type Toast = { kind: "ok" | "err"; msg: string } | null

const inputCls =
  "w-full h-10 px-3 rounded-xl border border-[#E2EAF6] bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
const labelCls = "block text-[12px] font-semibold text-slate-600 mb-1.5"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

function Toggle({ on, onChange, tone = "emerald" }: { on: boolean; onChange: (v: boolean) => void; tone?: "emerald" | "amber" }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`w-10 h-[22px] rounded-full transition-colors relative shrink-0 ${on ? (tone === "amber" ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-200"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  )
}

function ToastBar({ toast }: { toast: Toast }) {
  if (!toast) return null
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-[12px] ${toast.kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      {toast.kind === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />}
      <span>{toast.msg}</span>
    </div>
  )
}

export default function PlatformSettingsClient({
  settingsAvailable,
  flagsAvailable,
  general,
  maintenance,
  flags,
}: {
  settingsAvailable: boolean
  flagsAvailable: boolean
  general: GeneralCfg
  maintenance: MaintenanceCfg
  flags: PlatformFlag[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") && TABS.some((t) => t.key === searchParams.get("tab")) ? (searchParams.get("tab") as string) : "general"

  function goTab(key: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set("tab", key)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // General/platform config (persisted under platform_settings key="general").
  const [name, setName] = useState(general.platform_name ?? "Propvora")
  const [supportEmail, setSupportEmail] = useState(general.support_email ?? "")
  const [trialDays, setTrialDays] = useState(String(general.trial_length_days ?? 14))

  // Maintenance banner (persisted under platform_settings key="maintenance").
  const [maintEnabled, setMaintEnabled] = useState(!!maintenance.enabled)
  const [maintMsg, setMaintMsg] = useState(maintenance.message ?? "")
  const [maintAllowAdmins, setMaintAllowAdmins] = useState(maintenance.allow_admins ?? true)

  // Feature flags (live toggles).
  const [flagState, setFlagState] = useState(flags)

  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [confirmPublish, setConfirmPublish] = useState(false)

  function touch() { setDirty(true); setToast(null) }

  async function toggleFlag(key: string, next: boolean) {
    setToast(null)
    setFlagState((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: next } : f)))
    const res = await setFeatureFlag(key, next)
    if (!res.ok) {
      setFlagState((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !next } : f)))
      setToast({ kind: "err", msg: res.error ?? "Failed to save flag" })
    } else {
      setToast({ kind: "ok", msg: `Flag "${key}" updated.` })
    }
  }

  async function saveAll(publish: boolean) {
    setBusy(true); setToast(null)
    try {
      const g = await savePlatformSetting("general", {
        platform_name: name,
        support_email: supportEmail,
        trial_length_days: Number(trialDays) || 14,
      })
      const m = await saveMaintenanceMode({ enabled: maintEnabled, message: maintMsg, allowAdmins: maintAllowAdmins })
      if (!g.ok || !m.ok) {
        setToast({ kind: "err", msg: g.error ?? m.error ?? "Failed to save" })
      } else {
        setDirty(false)
        setToast({ kind: "ok", msg: publish ? "Configuration saved and published." : "Changes saved." })
      }
    } finally {
      setBusy(false)
    }
  }

  // Build an export snapshot of the editable config.
  const snapshot = useMemo(() => ({
    general: { platform_name: name, support_email: supportEmail, trial_length_days: Number(trialDays) || 14 },
    maintenance: { enabled: maintEnabled, message: maintMsg, allow_admins: maintAllowAdmins },
    feature_flags: flagState.map((f) => ({ key: f.key, enabled: f.enabled })),
  }), [name, supportEmail, trialDays, maintEnabled, maintMsg, maintAllowAdmins, flagState])

  function download(format: "json" | "yaml") {
    let content: string
    if (format === "json") {
      content = JSON.stringify(snapshot, null, 2)
    } else {
      const toYaml = (obj: unknown, indent = 0): string => {
        const pad = "  ".repeat(indent)
        if (Array.isArray(obj)) return obj.map((v) => `${pad}- ${typeof v === "object" ? "\n" + toYaml(v, indent + 1) : String(v)}`).join("\n")
        if (obj && typeof obj === "object") {
          return Object.entries(obj as Record<string, unknown>)
            .map(([k, v]) => (v && typeof v === "object" ? `${pad}${k}:\n${toYaml(v, indent + 1)}` : `${pad}${k}: ${String(v)}`))
            .join("\n")
        }
        return `${pad}${String(obj)}`
      }
      content = toYaml(snapshot)
    }
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `platform-settings.${format}`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const notProvisioned = !settingsAvailable

  return (
    <div className="pb-24">
      {/* Tabs */}
      <div role="tablist" className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 mb-4">
        {TABS.map((t) => {
          const active = t.key === tab
          return (
            <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => goTab(t.key)}
              className={`inline-flex items-center h-9 px-3.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors ${active ? "bg-[#0D1B2A] text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
              {t.label}
            </button>
          )
        })}
      </div>

      {notProvisioned && (
        <div className="mb-4"><ToastBar toast={{ kind: "err", msg: "platform_settings table not provisioned — values below will not persist until the migration is applied." }} /></div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GENERAL / PLATFORM */}
        {(tab === "general" || tab === "platform") && (
          <>
            <section className="bg-white border border-[#E2EAF6] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h3 className="text-[14px] font-semibold text-[#0B1B3F] mb-4">Platform identity</h3>
              <div className="space-y-3.5">
                <Field label="Platform name"><input className={inputCls} value={name} onChange={(e) => { setName(e.target.value); touch() }} /></Field>
                <Field label="Support email"><input type="email" className={inputCls} value={supportEmail} onChange={(e) => { setSupportEmail(e.target.value); touch() }} placeholder="support@propvora.com" /></Field>
                <Field label="Trial length (days)" hint="Applied to new self-serve sign-ups."><input type="number" className={inputCls} value={trialDays} onChange={(e) => { setTrialDays(e.target.value); touch() }} /></Field>
              </div>
            </section>
            <section className="bg-white border border-[#E2EAF6] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h3 className="text-[14px] font-semibold text-[#0B1B3F] mb-4">Maintenance banner</h3>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div><p className="text-[13px] font-medium text-slate-800">Enable maintenance mode</p><p className="text-[11px] text-slate-400">Shows a platform-wide notice.</p></div>
                  <Toggle on={maintEnabled} tone="amber" onChange={(v) => { setMaintEnabled(v); touch() }} />
                </div>
                <Field label="Notice message"><textarea rows={3} className={inputCls + " h-auto py-2"} value={maintMsg} onChange={(e) => { setMaintMsg(e.target.value); touch() }} placeholder="We're performing scheduled maintenance and will be back shortly." /></Field>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={maintAllowAdmins} onChange={(e) => { setMaintAllowAdmins(e.target.checked); touch() }} className="w-4 h-4 rounded accent-[#2563EB]" />
                  <span className="text-[13px] text-slate-700">Allow platform admins to bypass</span>
                </label>
              </div>
            </section>
          </>
        )}

        {/* FEATURE FLAGS */}
        {tab === "flags" && (
          <section className="bg-white border border-[#E2EAF6] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-2">
            <h3 className="text-[14px] font-semibold text-[#0B1B3F] mb-4">Feature flags</h3>
            {!flagsAvailable ? (
              <ToastBar toast={{ kind: "err", msg: "platform_feature_flags table not provisioned — flags cannot persist." }} />
            ) : flagState.length === 0 ? (
              <p className="text-[13px] text-slate-400">No feature flags defined.</p>
            ) : (
              <div className="space-y-1">
                {flagState.map((f) => (
                  <div key={f.key} className="flex items-center justify-between py-3 border-b border-[#F1F5FB] last:border-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-slate-800 capitalize">{f.key.replace(/_/g, " ")}</p>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{f.key}</span>
                      </div>
                      {f.description && <p className="text-[11px] text-slate-400 mt-0.5">{f.description}</p>}
                    </div>
                    <Toggle on={f.enabled} onChange={(v) => toggleFlag(f.key, v)} />
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-slate-400">Flags persist immediately on toggle and each change is written to the audit log.</p>
          </section>
        )}

        {/* Read-only / config-derived tabs */}
        {tab === "billing" && <ConfigInfo title="Billing" lines={[["Provider", "Stripe"], ["Webhook verification", "Enforced"], ["Plans", "Managed in Subscriptions"]]} note="Live billing keys are managed via server environment. Plan and price configuration lives under Subscriptions." />}
        {tab === "ai" && <ConfigInfo title="AI" lines={[["Gateway", "Configured via AI Models"], ["Cost controls", "Per-workspace caps"]]} note="Provider, model routes, fallbacks and guardrails are managed on the AI Models page." />}
        {tab === "email" && <ConfigInfo title="Email / SMTP" lines={[["Transport", "Resend"], ["From domain", "Verified in Resend"]]} note="Transactional email is sent via Resend. SMTP credentials are server-side only." />}
        {tab === "storage" && <ConfigInfo title="Storage" lines={[["Object storage", "Cloudflare R2"], ["Access", "Signed URLs"], ["Scan", "On upload"]]} note="Documents and media are stored in private R2 buckets and served via short-lived signed URLs." />}
        {tab === "compliance" && <ConfigInfo title="Compliance" lines={[["Data residency", "EU/UK"], ["Audit trail", "Immutable"], ["DSAR / erasure", "Data Requests"]]} note="Subject-access and erasure requests are handled on the Data Requests page; the audit log is append-only." />}
        {tab === "ratelimits" && <ConfigInfo title="Rate limits" lines={[["API throttling", "Edge-enforced"], ["Auth attempts", "Supabase policy"]]} note="A dedicated rate-limit log sink is not yet wired; limits are enforced at the edge and auth layer." />}
        {tab === "support" && <ConfigInfo title="Support" lines={[["Support email", supportEmail || "—"], ["Help centre", "/help"], ["Status page", "System Health"]]} note="Support routing uses the platform support email configured under General." />}
      </div>

      {/* Sticky save / publish bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[var(--side-offset,232px)] z-40 px-4 sm:px-6 pb-4 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur border border-[#E2EAF6] rounded-2xl shadow-[0_14px_40px_rgba(15,23,42,0.12)] px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {toast ? <ToastBar toast={toast} /> : (
              <p className="text-[12.5px] text-slate-500">{dirty ? "You have unsaved changes." : "All changes saved. Export the live configuration as JSON or YAML."}</p>
            )}
          </div>
          <button type="button" onClick={() => download("json")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#E2EAF6] bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4" /> JSON</button>
          <button type="button" onClick={() => download("yaml")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#E2EAF6] bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4" /> YAML</button>
          <button type="button" disabled={!dirty || busy} onClick={() => { setName(general.platform_name ?? "Propvora"); setSupportEmail(general.support_email ?? ""); setTrialDays(String(general.trial_length_days ?? 14)); setMaintEnabled(!!maintenance.enabled); setMaintMsg(maintenance.message ?? ""); setMaintAllowAdmins(maintenance.allow_admins ?? true); setDirty(false); setToast(null) }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#E2EAF6] bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><RotateCcw className="w-4 h-4" /> Discard</button>
          <button type="button" disabled={busy || notProvisioned} onClick={() => saveAll(false)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#E2EAF6] bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Save className="w-4 h-4" /> Save</button>
          <button type="button" disabled={busy || notProvisioned} onClick={() => setConfirmPublish(true)} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 disabled:opacity-40">{busy ? "Working…" : "Publish"}</button>
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmPublish}
        title="Publish platform configuration?"
        description="This saves the current configuration and makes it live for the whole platform. The change is recorded in the audit log."
        confirmLabel="Publish"
        danger={false}
        busy={busy}
        onCancel={() => setConfirmPublish(false)}
        onConfirm={async () => { await saveAll(true); setConfirmPublish(false) }}
      />
    </div>
  )
}

function ConfigInfo({ title, lines, note }: { title: string; lines: [string, string][]; note: string }) {
  return (
    <section className="bg-white border border-[#E2EAF6] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-2">
      <h3 className="text-[14px] font-semibold text-[#0B1B3F] mb-4">{title}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {lines.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-[#F1F5FB] pb-2">
            <dt className="text-[12.5px] text-slate-500">{k}</dt>
            <dd className="text-[12.5px] font-medium text-[#0B1B3F]">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] text-slate-400">{note}</p>
    </section>
  )
}
