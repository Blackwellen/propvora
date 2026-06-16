import Link from "next/link"
import { ArrowLeft, FileText, Download, File } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { requirePortalSession } from "../../_guard"
import { getSupplierDocuments } from "@/lib/portal/data"
import { formatDate } from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function docTypeLabel(type: string | null): string {
  if (!type) return "Document"
  const labels: Record<string, string> = {
    scope_of_works: "Scope of Works",
    floor_plan: "Floor Plan",
    specification: "Specification",
    safety_certificate: "Safety Certificate",
    inspection_report: "Inspection Report",
    contract: "Contract",
    other: "Document",
  }
  return labels[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function SupplierDocumentsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`
  const documents = await getSupplierDocuments(session)

  return (
    <div className="space-y-5">
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500">
          {documents.length} document{documents.length === 1 ? "" : "s"} shared for your jobs
        </p>
      </div>

      {documents.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No documents yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Scope of works, specifications, and other job documents shared by the operator will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 rounded-2xl border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <File className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wide shrink-0">
                      {docTypeLabel(doc.type)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Added {formatDate(doc.created_at)} · {formatBytes(doc.file_size)}
                  </p>
                </div>
                {doc.file_path && (
                  <a
                    href={doc.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
