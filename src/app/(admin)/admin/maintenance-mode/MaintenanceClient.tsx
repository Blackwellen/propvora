"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ServerCog, Lock, Activity, ShieldCheck, Plus, X, Save } from "lucide-react"
import { AdminCard, AdminConfirmDialog, AdminStatusChip } from "@/components/admin/ui"
import { cn } from "@/lib/utils"
import { saveMaintenance } from "./actions"
import type { MaintenanceConfig } from "@/lib/admin/pages/batch4"

const TYPE_CARDS: { mode: MaintenanceConfig["mode"]; label: string; desc: string; icon: typeof Lock }[] = [
  { mode: "full", label: "Full maintenance", desc: "Entire platform offline. Only the allowlist + admins can sign in.", icon: Lock },
  { mode: "restricted", label: "Restricted access", desc: "Read-only mode. Sign-in works, writes are blocked.", icon: ShieldCheck },
  { mode: "degraded", label: "Degraded service", desc: "Banner only. Everything stays online with a heads-up notice.", icon: Activity },
]

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", on ? "bg-[#2563EB]" : "bg-slate-300")}
    >
      <span className={cn("inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform shadow", on ? "translate-x-5" : "translate-x-1")} style={{ height: 18, width: 18 }} />
    </button>
  )
}

export default function MaintenanceClient({ initial, notConfigured }: { initial: MaintenanceConfig; notConfigured: boolean }) {
  const router = useRouter()
  const [config, setConfig] = useState<MaintenanceConfig>(initial)
  const [allowInput, setAllowInput] = useState("")
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof MaintenanceConfig>(k: K, v: MaintenanceConfig[K]) => setConfig((c) => ({ ...c, [k]: v }))

  function addAllow() {
    const v = allowInput.trim()
    if (!v) return
    if (!config.allowlist.includes(v)) set("allowlist", [...config.allowlist, v])
    setAllowInput("")
  }

  function submit(intent: "enable" | "draft" | "schedule") {
    setError(null)
    startTransition(async () => {
      const res = await saveMaintenance({ ...config, intent })
      if (!res.ok) {
        setError(res.error ?? "Could not save.")
        return
      }
      router.refresh()
    })
  }

  return (
    <>
      {notConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <span className="font-semibold">platform_settings not provisioned.</span> Changes cannot be persisted until the table exists. The controls below are read-only previews.
        </div>
      )}

      {/* Enable toggle + type cards */}
      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center"><ServerCog className="w-[18px] h-[18px]" /></span>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0B1B3F]">Enable maintenance mode</h2>
              <p className="text-[12.5px] text-slate-500">When enabled, the chosen access policy is applied platform-wide.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AdminStatusChip tone={config.enabled ? "amber" : "emerald"} dot>{config.enabled ? "Active" : "Standby"}</AdminStatusChip>
            <Toggle on={config.enabled} onClick={() => set("enabled", !config.enabled)} label="Enable maintenance mode" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {TYPE_CARDS.map((t) => {
            const active = config.mode === t.mode
            return (
              <button
                key={t.mode}
                type="button"
                onClick={() => set("mode", t.mode)}
                className={cn("text-left rounded-xl border p-3.5 transition-colors", active ? "border-[#2563EB] bg-[#F5F9FF] ring-1 ring-[#2563EB]/30" : "border-[#E2EAF6] hover:border-[#C8DBF5]")}
              >
                <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", active ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500")}><t.icon className="w-4 h-4" /></span>
                <p className="text-[13px] font-semibold text-[#0B1B3F]">{t.label}</p>
                <p className="text-[11.5px] text-slate-500 mt-0.5 leading-snug">{t.desc}</p>
              </button>
            )
          })}
        </div>
      </AdminCard>

      {/* Message + allowlist */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h3 className="text-[14px] font-semibold text-[#0B1B3F] mb-2">Maintenance message</h3>
          <textarea
            value={config.message}
            onChange={(e) => set("message", e.target.value)}
            rows={6}
            placeholder="We're performing scheduled maintenance and will be back shortly. Thank you for your patience."
            className="w-full rounded-xl border border-[#E2EAF6] bg-white px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] resize-none"
          />
          <p className="mt-1.5 text-[11px] text-slate-400">Shown to users on the maintenance screen / banner.</p>
        </AdminCard>

        <AdminCard>
          <h3 className="text-[14px] font-semibold text-[#0B1B3F] mb-2">Access allowlist</h3>
          <div className="flex gap-2">
            <input
              value={allowInput}
              onChange={(e) => setAllowInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAllow() } }}
              placeholder="email or workspace id"
              className="flex-1 h-9 rounded-xl border border-[#E2EAF6] bg-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            />
            <button type="button" onClick={addAllow} className="h-9 px-3 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold inline-flex items-center gap-1 hover:bg-[#1d4ed8]"><Plus className="w-4 h-4" /> Add</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {config.allowlist.length === 0 ? (
              <p className="text-[12px] text-slate-400">No exemptions. Only platform admins bypass maintenance.</p>
            ) : config.allowlist.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 rounded-full border border-[#E2EAF6] bg-slate-50 px-2.5 py-1 text-[12px] text-slate-700">
                {a}
                <button type="button" aria-label={`Remove ${a}`} onClick={() => set("allowlist", config.allowlist.filter((x) => x !== a))} className="text-slate-400 hover:text-red-600"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-700">
            <input type="checkbox" checked={config.allowAdmins} onChange={(e) => set("allowAdmins", e.target.checked)} className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/30" />
            Always allow platform admins to sign in
          </label>
        </AdminCard>
      </div>

      {/* Schedule */}
      <AdminCard>
        <h3 className="text-[14px] font-semibold text-[#0B1B3F] mb-3">Schedule a window</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[12px] text-slate-500">
            Starts at
            <input
              type="datetime-local"
              value={config.scheduledFor ?? ""}
              onChange={(e) => set("scheduledFor", e.target.value || null)}
              className="mt-1 block h-9 rounded-xl border border-[#E2EAF6] bg-white px-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </label>
          <p className="text-[11px] text-slate-400 max-w-xs">Scheduling does not take the platform offline now — it records the intended window and notifies on save.</p>
        </div>
      </AdminCard>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] text-red-600">{error}</div>}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-20 -mx-1 mt-2 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-[#E2EAF6] bg-white/95 backdrop-blur px-4 py-3 shadow-[0_-2px_12px_rgba(15,23,42,0.06)]">
        <span className="mr-auto text-[12px] text-slate-400">Changes apply platform-wide. Enabling is logged to the audit trail.</span>
        <button type="button" disabled={pending || notConfigured} onClick={() => submit("draft")} className="h-9 px-4 rounded-xl border border-[#E2EAF6] text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Save as draft</button>
        <button type="button" disabled={pending || notConfigured || !config.scheduledFor} onClick={() => submit("schedule")} className="h-9 px-4 rounded-xl border border-[#E2EAF6] text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Schedule</button>
        <button type="button" disabled={pending || notConfigured} onClick={() => setConfirm(true)} className="h-9 px-4 rounded-xl bg-amber-600 text-white text-[13px] font-semibold hover:bg-amber-700 inline-flex items-center gap-1.5 disabled:opacity-50"><Save className="w-4 h-4" /> Save &amp; enable</button>
      </div>

      <AdminConfirmDialog
        open={confirm}
        title="Enable maintenance mode?"
        description={`This applies "${TYPE_CARDS.find((t) => t.mode === config.mode)?.label}" platform-wide immediately. Non-allowlisted users will be affected.`}
        confirmLabel="Enable now"
        busy={pending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); submit("enable") }}
      />
    </>
  )
}
