"use client"

import React, { useMemo, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Download, Filter, Lock, ShieldAlert } from "lucide-react"
import {
  AdminSectionCard,
  AdminTable,
  AdminStatusChip,
  AdminEmptyState,
  AdminSearchInput,
  type AdminTone,
} from "@/components/admin/ui"
import type { AdminAuditRow } from "@/lib/admin/data"

interface SavedView { key: string; label: string; action?: string; range?: string }

const SAVED_VIEWS: SavedView[] = [
  { key: "all", label: "All events" },
  { key: "security", label: "Security & lifecycle", action: "__security__" },
  { key: "24h", label: "Last 24 hours", range: "24h" },
  { key: "settings", label: "Settings changes", action: "platform_settings.updated" },
]

const SECURITY_HINTS = ["suspend", "ban", "delete", "archive", "revoke", "reset", "role"]

function actionTone(action: string): AdminTone {
  const a = action.toLowerCase()
  if (SECURITY_HINTS.some((h) => a.includes(h))) return "red"
  if (a.includes("updated") || a.includes("toggled")) return "amber"
  if (a.includes("created") || a.includes("restored") || a.includes("reactivated")) return "emerald"
  return "slate"
}

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"
}

export default function AuditLogClient({
  events,
  actions,
}: {
  events: AdminAuditRow[]
  actions: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const q = (searchParams.get("q") ?? "").trim().toLowerCase()
  const action = searchParams.get("action") ?? ""
  const view = searchParams.get("view") ?? "all"
  const [exported, setExported] = useState(false)

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (value) params.set(key, value); else params.delete(key)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const filtered = useMemo(() => {
    let rows = events
    if (view === "security") rows = rows.filter((r) => SECURITY_HINTS.some((h) => r.action.toLowerCase().includes(h)))
    if (view === "24h") {
      const cut = Date.now() - 24 * 3600_000
      rows = rows.filter((r) => r.createdAt && new Date(r.createdAt).getTime() >= cut)
    }
    if (view === "settings") rows = rows.filter((r) => r.action === "platform_settings.updated")
    if (action) rows = rows.filter((r) => r.action === action)
    if (q) {
      rows = rows.filter((r) =>
        `${r.action} ${r.actorName ?? ""} ${r.actorEmail ?? ""} ${r.resourceType ?? ""} ${r.workspaceName ?? ""} ${r.ip ?? ""}`
          .toLowerCase()
          .includes(q),
      )
    }
    return rows
  }, [events, view, action, q])

  function exportCsv() {
    const header = ["timestamp", "action", "actor", "actor_email", "resource_type", "resource_id", "workspace", "ip"]
    const lines = filtered.map((r) =>
      [
        r.createdAt ?? "",
        r.action,
        r.actorName ?? "",
        r.actorEmail ?? "",
        r.resourceType ?? "",
        r.resourceId ?? "",
        r.workspaceName ?? "",
        r.ip ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    const csv = [header.join(","), ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 2500)
  }

  return (
    <AdminSectionCard
      title="Event trail"
      icon={Filter}
      actions={
        <div className="flex items-center gap-2">
          <AdminStatusChip tone="slate"><Lock className="w-3 h-3" /> Immutable</AdminStatusChip>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#E2EAF6] bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-[#C8DBF5] transition-colors"
          >
            <Download className="w-4 h-4" /> {exported ? "Exported" : "Export CSV"}
          </button>
        </div>
      }
    >
      {/* Saved views + filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {SAVED_VIEWS.map((v) => {
          const active = v.key === view
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setParam("view", v.key === "all" ? "" : v.key)}
              className={`inline-flex items-center h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors ${
                active || (v.key === "all" && !view)
                  ? "bg-[#0D1B2A] text-white"
                  : "bg-white border border-[#E2EAF6] text-slate-600 hover:bg-slate-50"
              }`}
            >
              {v.label}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-56"><AdminSearchInput placeholder="Search actor, IP, resource…" /></div>
          <select
            value={action}
            onChange={(e) => setParam("action", e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E2EAF6] bg-white text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={ShieldAlert}
          title={events.length === 0 ? "No recorded events yet" : "No events match these filters"}
          description={events.length === 0
            ? "Administrative actions are written here as they happen. The trail is append-only and cannot be edited or deleted."
            : "Adjust the saved view, action filter or search to see more events."}
        />
      ) : (
        <AdminTable
          minWidth={900}
          head={[
            { label: "Timestamp" },
            { label: "Action" },
            { label: "Actor" },
            { label: "Resource" },
            { label: "Workspace" },
            { label: "IP", align: "right" },
          ]}
        >
          {filtered.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-slate-500 tabular-nums">{fmt(e.createdAt)}</td>
              <td className="px-4 py-2.5"><AdminStatusChip tone={actionTone(e.action)} dot><span className="font-mono text-[11px]">{e.action}</span></AdminStatusChip></td>
              <td className="px-4 py-2.5">
                <p className="text-[12.5px] font-medium text-[#0B1B3F] truncate max-w-[160px]" title={e.actorName ?? undefined}>{e.actorName ?? "System"}</p>
                {e.actorEmail && <p className="text-[11px] text-slate-400 truncate max-w-[160px]" title={e.actorEmail}>{e.actorEmail}</p>}
              </td>
              <td className="px-4 py-2.5 text-[12px] text-slate-600">
                {e.resourceType ? <span>{e.resourceType}</span> : <span className="text-slate-300">—</span>}
                {e.resourceId && <span className="font-mono text-[11px] text-slate-400"> · {String(e.resourceId).slice(0, 8)}</span>}
              </td>
              <td className="px-4 py-2.5 text-[12px] text-slate-600 truncate max-w-[160px]">{e.workspaceName ?? <span className="text-slate-300">—</span>}</td>
              <td className="px-4 py-2.5 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">{e.ip ?? "—"}</td>
            </tr>
          ))}
        </AdminTable>
      )}

      <p className="mt-3 text-[11px] text-slate-400">
        Showing {filtered.length.toLocaleString("en-GB")} of {events.length.toLocaleString("en-GB")} loaded events. Audit records are immutable — they can be exported but never edited or deleted from this console.
      </p>
    </AdminSectionCard>
  )
}
