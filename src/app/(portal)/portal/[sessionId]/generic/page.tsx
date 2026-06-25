import Link from "next/link"
import { FolderOpen, MessageSquare, FileText, ArrowRight, ChevronRight, ShieldCheck } from "lucide-react"
import { requirePortalSession } from "../_guard"
import { getLinkedPropertyDocuments } from "@/lib/portal/data"
import { getPortalThreads } from "@/lib/portal/messaging-server"
import { formatDate } from "@/lib/portal/format"
import {
  PortalSectionCard, PortalKpiStrip, PortalEmptyState, PortalButtonLink, type PortalKpi,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function GenericPortalHome({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "generic")
  const base = `/portal/${session.id}/generic`
  const [docs, threads] = await Promise.all([
    getLinkedPropertyDocuments(session),
    getPortalThreads(session).catch(() => []),
  ])

  const kpis: PortalKpi[] = [
    { label: "Shared documents", value: String(docs.length), icon: FolderOpen, tone: "blue", href: `${base}/documents` },
    { label: "Conversations", value: String(threads.length), icon: MessageSquare, tone: threads.length ? "emerald" : "slate", href: `${base}/messages` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#071B4D]">Welcome</h1>
        <p className="text-sm text-slate-500 mt-0.5">A secure space to exchange documents and messages with {session.workspaceName}.</p>
      </div>

      <PortalKpiStrip kpis={kpis} cols={4} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Shared documents" icon={FolderOpen} viewAllHref={`${base}/documents`}>
            {docs.length === 0 ? (
              <PortalEmptyState icon={FolderOpen} title="No documents shared yet" description="Files your contact shares with you will appear here." />
            ) : (
              <ul className="divide-y divide-[#EEF3FB] -my-1.5">
                {docs.slice(0, 6).map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#071B4D] truncate">{d.name ?? "Document"}</p>
                      <p className="text-xs text-slate-400">{formatDate(d.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PortalSectionCard>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Your secure access" icon={ShieldCheck}>
            <p className="text-sm text-slate-500">This is a read-only document exchange. Only items {session.workspaceName} shares with you are visible — nothing else in their workspace.</p>
          </PortalSectionCard>
          <PortalSectionCard title="Quick actions" icon={ArrowRight}>
            <div className="grid grid-cols-1 gap-2">
              {[["Documents", `${base}/documents`, FolderOpen], ["Messages", `${base}/messages`, MessageSquare]].map(([l, h, I]) => {
                const Icon = I as typeof FolderOpen
                return <Link key={l as string} href={h as string} className="flex items-center gap-2 rounded-xl border border-[#EEF3FB] hover:bg-[#F8FBFF] px-3 py-2.5 text-sm font-semibold text-[#071B4D]"><Icon className="w-4 h-4 text-[#2563EB]" />{l as string}<ChevronRight className="w-4 h-4 text-slate-300 ml-auto" /></Link>
              })}
            </div>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
