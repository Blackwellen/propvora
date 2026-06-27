import {
  FileText, Download, Share2, MessageSquare, Briefcase, CalendarClock, History,
  ShieldCheck, Archive, RefreshCw, Maximize2, Hash,
} from "lucide-react"
import { requirePortalSession } from "../../../_guard"
import { getSupplierDocuments } from "@/lib/portal/data"
import { formatDate } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, StatusChip, PortalEmptyState,
  PortalButtonLink, PortalFact,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function fmtBytes(b: number | null): string { if (!b) return "—"; if (b < 1024) return `${b} B`; if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`; return `${(b / 1048576).toFixed(1)} MB` }

export default async function SupplierDocumentDetail({ params }: { params: Promise<{ sessionId: string; documentId: string }> }) {
  const { sessionId, documentId } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`
  const docs = await getSupplierDocuments(session).catch(() => [])
  const d = (docs as Array<{ id: string; name: string; type: string | null; file_path: string | null; file_size: number | null; created_at: string | null }>).find((x) => x.id === documentId) ?? null

  if (!d) {
    return (
      <div className="space-y-5">
        <PortalPageHeader title="Document" backHref={`${base}/documents`} backLabel="Back to documents" />
        <PortalCard><PortalEmptyState icon={FileText} title="Document not found" description="This document isn't shared with your account." /></PortalCard>
      </div>
    )
  }
  const cat = d.type ? d.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Document"

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title={d.name} subtitle={cat} backHref={`${base}/documents`} backLabel="Back to documents"
        actions={<>
          {d.file_path && <PortalButtonLink href={d.file_path} icon={Download}>Download file</PortalButtonLink>}
          <PortalButtonLink href={`${base}/messages`} icon={Share2}>Share or forward</PortalButtonLink>
          <PortalButtonLink href={`${base}/messages`} variant="primary" icon={MessageSquare}>Message manager</PortalButtonLink>
        </>}
      />
      <div className="flex items-center gap-2"><StatusChip tone="emerald" dot>Active</StatusChip><span className="text-xs text-slate-400 flex items-center gap-1"><Hash className="w-3 h-3" />{d.id.slice(0, 8).toUpperCase()}</span></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Viewer */}
        <div className="lg:col-span-2">
          <PortalCard className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#EEF3FB] bg-[#FAFCFF]">
              <span className="text-xs font-semibold text-slate-500">Preview · Page 1</span>
              <div className="flex items-center gap-1">
                {d.file_path && <a href={d.file_path} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--brand)] hover:bg-[var(--brand-soft)]" title="Open fullscreen"><Maximize2 className="w-4 h-4" /></a>}
                {d.file_path && <a href={d.file_path} download className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--brand)] hover:bg-[var(--brand-soft)]" title="Download"><Download className="w-4 h-4" /></a>}
              </div>
            </div>
            <div className="aspect-[3/4] max-h-[560px] bg-slate-50 flex flex-col items-center justify-center text-slate-300 m-4 rounded-xl border border-[#EEF3FB]">
              <FileText className="w-14 h-14" />
              <p className="text-sm text-slate-400 mt-3">{d.name}</p>
              {d.file_path && <a href={d.file_path} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold"><Download className="w-4 h-4" /> Open document</a>}
            </div>
          </PortalCard>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <PortalSectionCard title="Document details" icon={FileText}>
            <dl className="space-y-2.5 text-sm">
              <PortalFact icon={Briefcase} label="Category" value={cat} />
              <PortalFact icon={CalendarClock} label="Uploaded" value={formatDate(d.created_at)} />
              <PortalFact icon={Hash} label="File size" value={fmtBytes(d.file_size)} />
              <PortalFact icon={ShieldCheck} label="Access" value="Shared with you" />
            </dl>
          </PortalSectionCard>
          <PortalSectionCard title="Linked job" icon={Briefcase} viewAllHref={`${base}/jobs`} viewAllLabel="Jobs">
            <p className="text-sm text-slate-600">Associated with your assigned work.</p>
          </PortalSectionCard>
          <PortalSectionCard title="Activity / versions" icon={History}>
            <ol className="space-y-2.5"><li className="flex gap-3"><span className="w-2 h-2 rounded-full bg-[var(--brand)] mt-1.5 shrink-0" /><div><p className="text-sm text-slate-700">Document shared</p><p className="text-[11px] text-slate-400">{formatDate(d.created_at)}</p></div></li></ol>
          </PortalSectionCard>
          <PortalSectionCard title="Quick actions" icon={RefreshCw}>
            <div className="space-y-1.5">
              <PortalButtonLink href={`${base}/messages`} icon={Share2} className="w-full justify-center">Share with team</PortalButtonLink>
              <PortalButtonLink href={`${base}/messages`} icon={RefreshCw} className="w-full justify-center">Request updated version</PortalButtonLink>
              <PortalButtonLink href={`${base}/documents`} icon={Archive} variant="ghost" className="w-full justify-center">Archive</PortalButtonLink>
            </div>
          </PortalSectionCard>
          <PortalCard className="p-4"><div className="flex items-start gap-2.5"><span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4" /></span><div><p className="text-sm font-semibold text-[#071B4D]">Secure access</p><p className="text-xs text-slate-400 mt-0.5">Downloaded via a secure signed link, scoped to your account.</p></div></div></PortalCard>
        </div>
      </div>
    </div>
  )
}
