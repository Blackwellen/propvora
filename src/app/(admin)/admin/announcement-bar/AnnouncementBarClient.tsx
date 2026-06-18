"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, X, Send } from "lucide-react"
import { AdminCard, AdminStatusChip } from "@/components/admin/ui"
import { cn } from "@/lib/utils"
import { saveAnnouncementBar } from "./actions"
import type { AnnouncementBarConfig } from "@/lib/admin/pages/batch4"

const SEVERITIES: { key: AnnouncementBarConfig["severity"]; label: string; icon: typeof Info; bar: string; chip: "blue" | "emerald" | "amber" | "red" }[] = [
  { key: "info", label: "Info", icon: Info, bar: "bg-[#2563EB] text-white", chip: "blue" },
  { key: "success", label: "Success", icon: CheckCircle2, bar: "bg-emerald-600 text-white", chip: "emerald" },
  { key: "warning", label: "Warning", icon: AlertTriangle, bar: "bg-amber-500 text-white", chip: "amber" },
  { key: "critical", label: "Critical", icon: AlertOctagon, bar: "bg-red-600 text-white", chip: "red" },
]
const AUDIENCES: { key: AnnouncementBarConfig["audience"]; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "operators", label: "Property managers" },
  { key: "suppliers", label: "Suppliers" },
  { key: "customers", label: "Customers" },
  { key: "workspace", label: "Single workspace" },
]

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", on ? "bg-[#2563EB]" : "bg-slate-300")}>
      <span className="inline-block transform rounded-full bg-white transition-transform shadow" style={{ height: 18, width: 18, transform: on ? "translateX(22px)" : "translateX(4px)" }} />
    </button>
  )
}

const inputCls = "w-full h-9 rounded-xl border border-[#E2EAF6] bg-white px-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"

export default function AnnouncementBarClient({ initial, notConfigured }: { initial: AnnouncementBarConfig; notConfigured: boolean }) {
  const router = useRouter()
  const [c, setC] = useState<AnnouncementBarConfig>(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof AnnouncementBarConfig>(k: K, v: AnnouncementBarConfig[K]) => { setC((p) => ({ ...p, [k]: v })); setSaved(false) }
  const sev = SEVERITIES.find((s) => s.key === c.severity) ?? SEVERITIES[0]

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await saveAnnouncementBar(c)
      if (!res.ok) { setError(res.error ?? "Could not save."); return }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <>
      {notConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <span className="font-semibold">platform_settings not provisioned.</span> Changes cannot be persisted yet.
        </div>
      )}

      {/* Live preview */}
      <AdminCard>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Live preview</p>
        {c.message.trim() ? (
          <div className={cn("flex items-center gap-3 rounded-xl px-4 py-2.5", sev.bar)}>
            <sev.icon className="w-4 h-4 shrink-0" />
            <span className="text-[13px] font-medium flex-1">{c.message}</span>
            {c.ctaLabel && <span className="text-[12px] font-semibold underline underline-offset-2 shrink-0">{c.ctaLabel}</span>}
            {c.dismissible && <X className="w-4 h-4 opacity-80 shrink-0" />}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#CBD9EE] px-4 py-3 text-[12.5px] text-slate-400">Type a message to preview the bar.</div>
        )}
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Content + severity */}
        <AdminCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-[#0B1B3F]">Content</h3>
            <div className="flex items-center gap-2">
              <AdminStatusChip tone={c.enabled ? "emerald" : "slate"} dot>{c.enabled ? "Enabled" : "Off"}</AdminStatusChip>
              <Toggle on={c.enabled} onClick={() => set("enabled", !c.enabled)} label="Enable announcement bar" />
            </div>
          </div>

          <label className="block text-[12px] text-slate-500 mb-1">Message <span className="text-slate-400">({c.message.length}/280)</span></label>
          <textarea value={c.message} maxLength={280} onChange={(e) => set("message", e.target.value)} rows={3}
            placeholder="Scheduled maintenance on Saturday 02:00–04:00 BST. Some features may be briefly unavailable."
            className="w-full rounded-xl border border-[#E2EAF6] bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] resize-none" />

          <p className="text-[12px] text-slate-500 mt-3 mb-1.5">Severity</p>
          <div className="grid grid-cols-4 gap-2">
            {SEVERITIES.map((s) => (
              <button key={s.key} type="button" onClick={() => set("severity", s.key)}
                className={cn("flex flex-col items-center gap-1 rounded-xl border py-2 text-[11px] font-medium transition-colors", c.severity === s.key ? "border-[#2563EB] bg-[#F5F9FF] text-[#2563EB]" : "border-[#E2EAF6] text-slate-500 hover:border-[#C8DBF5]")}>
                <s.icon className="w-4 h-4" />{s.label}
              </button>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-700">
            <input type="checkbox" checked={c.dismissible} onChange={(e) => set("dismissible", e.target.checked)} className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/30" />
            Allow users to dismiss
          </label>
        </AdminCard>

        {/* CTA + audience + schedule */}
        <AdminCard>
          <h3 className="text-[14px] font-semibold text-[#0B1B3F] mb-3">Call to action</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[12px] text-slate-500 mb-1">Label</label>
              <input value={c.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="Learn more" className={inputCls} />
            </div>
            <div>
              <label className="block text-[12px] text-slate-500 mb-1">Link</label>
              <input value={c.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} placeholder="https://…" className={inputCls} />
            </div>
          </div>

          <p className="text-[12px] text-slate-500 mt-4 mb-1.5">Audience</p>
          <div className="flex flex-wrap gap-1.5">
            {AUDIENCES.map((a) => (
              <button key={a.key} type="button" onClick={() => set("audience", a.key)}
                className={cn("rounded-full border px-3 py-1 text-[12px] font-medium transition-colors", c.audience === a.key ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-[#E2EAF6] text-slate-600 hover:border-[#C8DBF5]")}>
                {a.label}
              </button>
            ))}
          </div>
          {c.audience === "workspace" && (
            <div className="mt-2">
              <label className="block text-[12px] text-slate-500 mb-1">Workspace ID</label>
              <input value={c.workspaceId ?? ""} onChange={(e) => set("workspaceId", e.target.value || null)} placeholder="workspace uuid" className={cn(inputCls, "font-mono text-[12px]")} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div>
              <label className="block text-[12px] text-slate-500 mb-1">Starts</label>
              <input type="datetime-local" value={c.startsAt ?? ""} onChange={(e) => set("startsAt", e.target.value || null)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[12px] text-slate-500 mb-1">Ends</label>
              <input type="datetime-local" value={c.endsAt ?? ""} onChange={(e) => set("endsAt", e.target.value || null)} className={inputCls} />
            </div>
          </div>
        </AdminCard>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] text-red-600">{error}</div>}

      <div className="sticky bottom-0 z-20 -mx-1 mt-2 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-[#E2EAF6] bg-white/95 backdrop-blur px-4 py-3 shadow-[0_-2px_12px_rgba(15,23,42,0.06)]">
        <span className="mr-auto text-[12px] text-slate-400">{saved ? "Saved. Changes are live." : "Publishing is logged to the audit trail."}</span>
        <button type="button" disabled={pending || notConfigured} onClick={submit}
          className="h-9 px-4 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] inline-flex items-center gap-1.5 disabled:opacity-50">
          <Send className="w-4 h-4" /> {pending ? "Saving…" : c.enabled ? "Publish bar" : "Save"}
        </button>
      </div>
    </>
  )
}
