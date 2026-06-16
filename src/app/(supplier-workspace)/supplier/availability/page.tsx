"use client"

import { useEffect, useState } from "react"
import { CalendarClock, Plus, Save } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierButton,
  SupplierBanner, SupplierStatusBadge, SupplierField, supplierInputClass,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate } from "@/components/supplier-workspace/format"

interface AvailRow {
  id: string
  weekday: number | null
  starts_at: string | null
  ends_at: string | null
  date_override: string | null
  is_available: boolean
  note: string | null
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

interface DayState { enabled: boolean; start: string; end: string }

export default function SupplierAvailabilityPage() {
  const { workspaceId } = useSupplierWorkspace()
  const avail = useSupplierApi<AvailRow[]>(useSupplierApiUrl("/api/supplier/availability"), {
    select: (j) => (j as { items?: AvailRow[] }).items ?? [],
  })
  const [week, setWeek] = useState<DayState[]>(DAYS.map(() => ({ enabled: false, start: "09:00", end: "17:00" })))
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)
  const [override, setOverride] = useState({ date: "", available: false, note: "" })

  useEffect(() => {
    const rows = avail.data
    if (!rows) return
    const next = DAYS.map((_, wd) => {
      const r = rows.find((x) => x.date_override === null && x.weekday === wd)
      return r
        ? { enabled: r.is_available, start: (r.starts_at ?? "09:00").slice(0, 5), end: (r.ends_at ?? "17:00").slice(0, 5) }
        : { enabled: false, start: "09:00", end: "17:00" }
    })
    setWeek(next)
  }, [avail.data])

  const overrides = (avail.data ?? []).filter((r) => r.date_override !== null)

  async function saveWeek() {
    if (!workspaceId) return
    setBusy(true); setBanner(null)
    const slots = week
      .map((d, wd) => ({ weekday: wd, starts_at: d.start, ends_at: d.end, is_available: d.enabled }))
      .filter((d) => d.is_available)
    try {
      const res = await fetch("/api/supplier/availability", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, slots }),
      })
      if (!res.ok) { setBanner({ tone: "red", msg: "Couldn't save your hours." }); return }
      avail.refresh(); setBanner({ tone: "emerald", msg: "Weekly hours saved." })
    } catch { setBanner({ tone: "red", msg: "Network error." }) }
    finally { setBusy(false) }
  }

  async function addOverride() {
    if (!workspaceId || !override.date) { setBanner({ tone: "red", msg: "Pick a date." }); return }
    setBusy(true)
    try {
      const res = await fetch("/api/supplier/availability", {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, override: { date: override.date, is_available: override.available, note: override.note || undefined } }),
      })
      if (!res.ok) { setBanner({ tone: "red", msg: "Couldn't add the override." }); return }
      setOverride({ date: "", available: false, note: "" }); avail.refresh()
      setBanner({ tone: "emerald", msg: "Date override added." })
    } catch { setBanner({ tone: "red", msg: "Network error." }) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Availability" subtitle="Working hours" />
      <SupplierPageHeader
        title="Availability"
        subtitle="Set your standard working week and add one-off date overrides (holidays, blackout days)."
        actions={<SupplierButton onClick={saveWeek} loading={busy}><Save className="w-4 h-4" /> Save hours</SupplierButton>}
      />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      {avail.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <SupplierCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Weekly hours</h2>
            </div>
            <div className="space-y-2">
              {DAYS.map((day, wd) => {
                const d = week[wd]
                return (
                  <div key={day} className="flex items-center gap-3 py-1.5">
                    <label className="flex items-center gap-2 w-32 shrink-0 cursor-pointer">
                      <input
                        type="checkbox" checked={d.enabled}
                        onChange={(e) => setWeek(week.map((x, i) => (i === wd ? { ...x, enabled: e.target.checked } : x)))}
                        className="w-4 h-4 rounded accent-[#2563EB]"
                      />
                      <span className="text-sm font-medium text-slate-700">{day}</span>
                    </label>
                    {d.enabled ? (
                      <div className="flex items-center gap-2">
                        <input type="time" value={d.start} onChange={(e) => setWeek(week.map((x, i) => (i === wd ? { ...x, start: e.target.value } : x)))} className="h-9 rounded-lg border border-slate-200 px-2 text-sm" />
                        <span className="text-slate-400 text-sm">–</span>
                        <input type="time" value={d.end} onChange={(e) => setWeek(week.map((x, i) => (i === wd ? { ...x, end: e.target.value } : x)))} className="h-9 rounded-lg border border-slate-200 px-2 text-sm" />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Closed</span>
                    )}
                  </div>
                )
              })}
            </div>
          </SupplierCard>

          <SupplierCard className="p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Date overrides</h2>
            <div className="space-y-3">
              <SupplierField label="Date">
                <input type="date" className={supplierInputClass} value={override.date} onChange={(e) => setOverride({ ...override, date: e.target.value })} />
              </SupplierField>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={override.available} onChange={(e) => setOverride({ ...override, available: e.target.checked })} className="w-4 h-4 rounded accent-[#2563EB]" />
                <span className="text-sm text-slate-700">Available on this date</span>
              </label>
              <SupplierField label="Note">
                <input className={supplierInputClass} value={override.note} onChange={(e) => setOverride({ ...override, note: e.target.value })} placeholder="e.g. Bank holiday" />
              </SupplierField>
              <SupplierButton size="sm" variant="secondary" onClick={addOverride} loading={busy}><Plus className="w-3.5 h-3.5" /> Add override</SupplierButton>
            </div>

            {overrides.length > 0 && (
              <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                {overrides.map((o) => (
                  <li key={o.id} className="py-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{shortDate(o.date_override)}</p>
                      {o.note && <p className="text-xs text-slate-400">{o.note}</p>}
                    </div>
                    <SupplierStatusBadge tone={o.is_available ? "emerald" : "slate"}>{o.is_available ? "Open" : "Closed"}</SupplierStatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </SupplierCard>
        </div>
      )}
    </div>
  )
}
