import React from "react"
import Link from "next/link"
import {
  FileText, FolderArchive, ShieldCheck, FlaskConical, Layers, HardDrive,
  Lock, FileLock2,
} from "lucide-react"
import { getDocumentsData, fmtBytes } from "@/lib/admin/pages/batch2"
import { listAudit } from "@/lib/admin/data"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminCard,
  AdminTable,
  AdminSearchInput,
  AdminFilterBar,
  AdminStatusChip,
  AdminEmptyState,
  AdminNotConfigured,
  AdminRightRail,
  AdminSectionCard,
  AdminAuditTrailPanel,
  AdminBanner,
  type AdminKpi,
  type AdminAuditEntry,
} from "@/components/admin/ui"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
  } catch {
    return "—"
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—"
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function fileKind(mime: string | null): string {
  if (!mime) return "File"
  if (mime.includes("pdf")) return "PDF"
  if (mime.startsWith("image/")) return "Image"
  if (mime.includes("word") || mime.includes("document")) return "Doc"
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "Sheet"
  return mime.split("/")[1]?.toUpperCase() ?? "File"
}

export default async function AdminDocumentsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const category = sp.category ?? "all"
  const q = sp.q ?? ""

  const [data, audit] = await Promise.all([
    getDocumentsData({ category, q }),
    listAudit({ action: undefined, limit: 8 }),
  ])
  const { available, kpis, rows, categoryMix } = data

  const kpiCards: AdminKpi[] = [
    { label: "Total documents", value: kpis.total.toLocaleString("en-GB"), icon: FileText, tone: "blue" },
    { label: "With stored file", value: kpis.withRetention.toLocaleString("en-GB"), icon: FolderArchive, tone: "emerald", sub: "retention applies" },
    { label: "Categories", value: kpis.categories.toLocaleString("en-GB"), icon: Layers, tone: "violet" },
    { label: "Demo / sample", value: kpis.demo.toLocaleString("en-GB"), icon: FlaskConical, tone: "amber" },
    { label: "Storage used", value: fmtBytes(kpis.totalBytes), icon: HardDrive, tone: "sky" },
  ]

  const catChips = ["all", ...categoryMix.map((c) => c.label)]
  const docAudit = audit.filter((a) => a.resourceType === "document" || a.action.includes("document"))
  const auditEntries: AdminAuditEntry[] = (docAudit.length ? docAudit : audit).map((a) => ({
    actor: a.actorName ?? "System",
    action: `${a.action.replace(/[._]/g, " ")}${a.workspaceName ? ` · ${a.workspaceName}` : ""}`,
    when: timeAgo(a.createdAt),
    tone: a.action.includes("delete") ? ("red" as const) : undefined,
  }))

  function chipHref(c: string): string {
    const params = new URLSearchParams()
    if (c !== "all") params.set("category", c)
    if (q) params.set("q", q)
    const qs = params.toString()
    return qs ? `/admin/documents?${qs}` : "/admin/documents"
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={FileText}
        title="Documents"
        subtitle="Platform-wide document governance — metadata, access, retention and audit only. Document contents are never exposed in this console."
      />

      <AdminKpiStrip kpis={kpiCards} cols={5} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 space-y-4">
          <AdminFilterBar>
            <AdminSearchInput placeholder="Search document name, category…" className="max-w-sm flex-1" />
            <div className="flex gap-1 flex-wrap">
              {catChips.slice(0, 6).map((c) => (
                <Link
                  key={c}
                  href={chipHref(c)}
                  className={
                    "inline-flex items-center h-9 px-3 rounded-xl text-[12.5px] font-semibold capitalize transition-colors " +
                    (category === c ? "bg-[#0D1B2A] text-white" : "bg-white border border-[#E2EAF6] text-slate-500 hover:bg-slate-50")
                  }
                >
                  {c === "all" ? "All" : c.replace(/_/g, " ")}
                </Link>
              ))}
            </div>
          </AdminFilterBar>

          <AdminCard padded={false}>
            {!available ? (
              <div className="p-5">
                <AdminNotConfigured
                  title="Documents not provisioned"
                  description="The documents table has not been created yet. Once workspaces upload documents, metadata oversight appears here."
                />
              </div>
            ) : rows.length === 0 ? (
              <AdminEmptyState
                icon={FileText}
                title="No documents match"
                description="No document metadata matches the current category and search. Records appear as workspaces upload files."
              />
            ) : (
              <AdminTable
                minWidth={820}
                head={[
                  { label: "Document" },
                  { label: "Category" },
                  { label: "Type" },
                  { label: "Size" },
                  { label: "Workspace" },
                  { label: "Security" },
                  { label: "Uploaded", align: "right" },
                ]}
              >
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#0B1B3F] truncate max-w-[240px]">{r.name}</p>
                      {r.isDemo && <p className="text-[11px] text-amber-500">Demo / sample</p>}
                    </td>
                    <td className="px-4 py-3">
                      {r.category ? <AdminStatusChip tone="slate" className="capitalize">{r.category.replace(/_/g, " ")}</AdminStatusChip> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">{fileKind(r.mimeType)}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">{fmtBytes(r.sizeBytes)}</td>
                    <td className="px-4 py-3">
                      {r.workspaceId ? (
                        <Link href={`/admin/workspaces/${r.workspaceId}`} className="text-[12.5px] text-slate-500 hover:text-[#2563EB]">
                          {r.workspaceName ?? "Workspace"}
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusChip tone={r.hasFile ? "emerald" : "slate"} dot>{r.hasFile ? "Stored" : "Metadata"}</AdminStatusChip>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-400 text-right whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </AdminTable>
            )}
          </AdminCard>
        </div>

        <AdminRightRail>
          <AdminBanner tone="red" icon={Lock} title="Content never exposed.">
            This console shows document metadata only. File paths, URLs and contents are intentionally excluded to protect tenant and owner data.
          </AdminBanner>

          <AdminSectionCard title="Security status" icon={FileLock2}>
            <ul className="space-y-3 text-[13px]">
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Stored with retention</span>
                <AdminStatusChip tone="emerald">{kpis.withRetention}</AdminStatusChip>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Metadata-only records</span>
                <AdminStatusChip tone="slate">{kpis.total - kpis.withRetention}</AdminStatusChip>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Demo / sample</span>
                <AdminStatusChip tone="amber">{kpis.demo}</AdminStatusChip>
              </li>
            </ul>
          </AdminSectionCard>

          <AdminAuditTrailPanel title="Retention & deletion audit" entries={auditEntries} viewAllHref="/admin/audit" />
        </AdminRightRail>
      </div>
    </div>
  )
}
