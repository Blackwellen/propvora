import Link from "next/link"
import {
  Gavel, FileSignature, MessageSquare, Building2, FileText, ChevronRight, ArrowRight, ShieldCheck,
} from "lucide-react"
import { requirePortalSession } from "../_guard"
import { getLandlordProperties, getLinkedPropertyDocuments } from "@/lib/portal/data"
import { getPortalThreads } from "@/lib/portal/messaging-server"
import { formatDate, propertyStatusMeta } from "@/lib/portal/format"
import {
  PortalSectionCard, PortalKpiStrip, StatusChip, PortalEmptyState, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function propLabel(p: { nickname: string | null; address_line1: string | null; city: string | null }) {
  return p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || "Property"
}

export default async function SolicitorPortalHome({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "solicitor")
  const base = `/portal/${session.id}/solicitor`
  const [properties, docs, threads] = await Promise.all([
    getLandlordProperties(session),
    getLinkedPropertyDocuments(session),
    getPortalThreads(session).catch(() => []),
  ])

  const kpis: PortalKpi[] = [
    { label: "Active matters", value: String(properties.length), icon: Gavel, tone: "blue", href: `${base}/matters` },
    { label: "Legal documents", value: String(docs.length), icon: FileSignature, tone: "violet", href: `${base}/documents` },
    { label: "Conversations", value: String(threads.length), icon: MessageSquare, tone: threads.length ? "emerald" : "slate", href: `${base}/messages` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#071B4D]">Legal matters</h1>
        <p className="text-sm text-slate-500 mt-0.5">Subject properties and document exchange for matters instructed by {session.workspaceName}.</p>
      </div>

      <PortalKpiStrip kpis={kpis} cols={4} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Matters" icon={Gavel} viewAllHref={`${base}/matters`}>
            {properties.length === 0 ? (
              <PortalEmptyState icon={Gavel} title="No matters instructed yet" description="When a matter is assigned to you, the subject property appears here." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -m-1 p-1">
                {properties.slice(0, 6).map((p) => {
                  const meta = propertyStatusMeta(p.status)
                  const tone: PortalTone = meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "slate"
                  return (
                    <Link key={p.id} href={`${base}/matters`} className="block rounded-xl border border-[#EEF3FB] hover:border-[#CFE0FB] hover:bg-[#F8FBFF] p-3.5 transition-colors">
                      <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-[#071B4D] truncate">{propLabel(p)}</p><StatusChip tone={tone} dot>{meta.label}</StatusChip></div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{[p.address_line1, p.city, p.postcode].filter(Boolean).join(", ")}</p>
                    </Link>
                  )
                })}
              </div>
            )}
          </PortalSectionCard>
          <PortalSectionCard title="Recent legal documents" icon={FileSignature} viewAllHref={`${base}/documents`}>
            {docs.length === 0 ? <PortalEmptyState icon={FileSignature} title="No documents yet" /> : (
              <ul className="divide-y divide-[#EEF3FB] -my-1.5">
                {docs.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></span>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#071B4D] truncate">{d.name ?? "Document"}</p><p className="text-xs text-slate-400">{formatDate(d.created_at)}</p></div>
                  </li>
                ))}
              </ul>
            )}
          </PortalSectionCard>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Confidentiality" icon={ShieldCheck}>
            <p className="text-sm text-slate-500">Access is limited to the matters and documents {session.workspaceName} has shared with you. Communications here are recorded for the file.</p>
          </PortalSectionCard>
          <PortalSectionCard title="Quick actions" icon={ArrowRight}>
            <div className="grid grid-cols-1 gap-2">
              {[["Matters", `${base}/matters`, Gavel], ["Documents", `${base}/documents`, FileSignature], ["Messages", `${base}/messages`, MessageSquare]].map(([l, h, I]) => {
                const Icon = I as typeof Gavel
                return <Link key={l as string} href={h as string} className="flex items-center gap-2 rounded-xl border border-[#EEF3FB] hover:bg-[#F8FBFF] px-3 py-2.5 text-sm font-semibold text-[#071B4D]"><Icon className="w-4 h-4 text-[#2563EB]" />{l as string}<ChevronRight className="w-4 h-4 text-slate-300 ml-auto" /></Link>
              })}
            </div>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
