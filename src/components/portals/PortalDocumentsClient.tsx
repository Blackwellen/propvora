"use client"

import { useMemo, useState } from "react"
import {
  Search, FileText, Download, Eye, MoreHorizontal, ShieldCheck, Clock, CheckCircle2,
  AlertTriangle, Inbox, FolderOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PortalCard, PortalSectionCard, PortalKpiStrip, StatusChip, PortalEmptyState,
  PortalButtonLink, type PortalKpi,
} from "@/components/portals/portal-ui"

export interface PortalDoc {
  id: string
  name: string
  type: string | null        // category
  file_path: string | null   // signed/file url
  file_size: number | null
  created_at: string | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}
function fmtBytes(b: number | null): string {
  if (!b) return "—"; if (b < 1024) return `${b} B`; if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`; return `${(b / 1048576).toFixed(1)} MB`
}
function catLabel(t: string | null): string {
  if (!t) return "Document"
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/* Reusable documents surface for the portals (tenant/landlord/supplier). */
export default function PortalDocumentsClient({
  docs, base, requestHref, filters = ["All", "Tenancy", "Compliance", "Property", "Inspections", "Payments", "Notices"],
}: {
  docs: PortalDoc[]; base: string; requestHref?: string; filters?: string[]
}) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [sort, setSort] = useState<"newest" | "name">("newest")

  const recent = useMemo(() => [...docs].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 4), [docs])

  const filtered = useMemo(() => {
    let r = docs
    if (search) { const q = search.toLowerCase(); r = r.filter((d) => d.name.toLowerCase().includes(q) || (d.type ?? "").toLowerCase().includes(q)) }
    if (filter !== "All") { const f = filter.toLowerCase(); r = r.filter((d) => (d.type ?? "").toLowerCase().includes(f)) }
    return [...r].sort((a, b) => sort === "newest" ? (b.created_at ?? "").localeCompare(a.created_at ?? "") : a.name.localeCompare(b.name))
  }, [docs, search, filter, sort])

  const sevenDaysAgo = Date.now() - 7 * 86_400_000
  const kpis: PortalKpi[] = [
    { label: "Total documents", value: String(docs.length), icon: FileText, tone: "blue" },
    { label: "Action required", value: "0", sub: "Nothing to sign", icon: AlertTriangle, tone: "amber" },
    { label: "Recently added", value: String(docs.filter((d) => d.created_at && new Date(d.created_at).getTime() > sevenDaysAgo).length), sub: "Last 7 days", icon: Clock, tone: "emerald" },
    { label: "Signed documents", value: String(docs.length), sub: "On file", icon: CheckCircle2, tone: "violet" },
  ]

  return (
    <div className="space-y-5">
      <PortalKpiStrip kpis={kpis} cols={4} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Main */}
        <div className="space-y-3 min-w-0">
          {/* Search + sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…" className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#E2EAF6] text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--color-brand-100)]" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 rounded-xl border border-[#E2EAF6] text-sm px-3 outline-none">
              <option value="newest">Newest first</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
          {/* Filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("h-8 px-3 rounded-lg text-xs font-semibold transition-colors", filter === f ? "bg-[var(--brand)] text-white" : "bg-white border border-[#E2EAF6] text-slate-600 hover:bg-slate-50")}>{f}</button>
            ))}
          </div>

          {/* Table */}
          <PortalCard className="overflow-hidden">
            {filtered.length === 0 ? (
              <PortalEmptyState icon={FolderOpen} title={docs.length === 0 ? "No documents yet" : "No documents match"} description={docs.length === 0 ? "Documents shared by your manager will appear here." : "Try a different search or filter."} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]">
                    <th className="px-4 py-3">Document</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Uploaded</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#F1F5FB]">
                    {filtered.map((d) => (
                      <tr key={d.id} className="hover:bg-[#FAFCFF]">
                        <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></span><span className="font-semibold text-[#071B4D] truncate max-w-[220px]">{d.name}</span></div></td>
                        <td className="px-4 py-3"><StatusChip tone="slate">{catLabel(d.type)}</StatusChip></td>
                        <td className="px-4 py-3 text-slate-500">{fmtDate(d.created_at)}</td>
                        <td className="px-4 py-3 text-slate-500">{fmtBytes(d.file_size)}</td>
                        <td className="px-4 py-3"><StatusChip tone="emerald" dot>Active</StatusChip></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {d.file_path && <a href={d.file_path} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--brand)] hover:bg-[var(--brand-soft)]" title="View"><Eye className="w-4 h-4" /></a>}
                            {d.file_path && <a href={d.file_path} download className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--brand)] hover:bg-[var(--brand-soft)]" title="Download"><Download className="w-4 h-4" /></a>}
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100" title="More"><MoreHorizontal className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PortalCard>
          <p className="text-xs text-slate-400">Showing {filtered.length} of {docs.length} documents.</p>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <PortalSectionCard title="Recently shared" icon={Inbox}>
            {recent.length === 0 ? <p className="text-xs text-slate-400">Nothing shared yet.</p> : (
              <ul className="space-y-2.5">{recent.map((d) => (
                <li key={d.id} className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></span><div className="min-w-0"><p className="text-[13px] font-semibold text-[#071B4D] truncate">{d.name}</p><p className="text-[11px] text-slate-400">{fmtDate(d.created_at)}</p></div></li>
              ))}</ul>
            )}
          </PortalSectionCard>
          <PortalSectionCard title="Need something else?" icon={FileText}>
            <p className="text-xs text-slate-500 mb-3">Can&apos;t find a document? Request it from your manager.</p>
            <PortalButtonLink href={requestHref ?? `${base}/messages`} variant="primary" className="w-full justify-center">Request a document</PortalButtonLink>
          </PortalSectionCard>
          <PortalCard className="p-4">
            <div className="flex items-start gap-2.5"><span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Your data is secure</p><p className="text-xs text-slate-400 mt-0.5">Documents are stored securely and only shared with you.</p></div></div>
          </PortalCard>
        </div>
      </div>
    </div>
  )
}
