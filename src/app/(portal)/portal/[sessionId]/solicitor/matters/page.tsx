import Link from "next/link"
import { Gavel, FileSignature, MapPin } from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getLandlordProperties, getLinkedPropertyDocuments } from "@/lib/portal/data"
import { propertyStatusMeta } from "@/lib/portal/format"
import {
  PortalCard, PortalPageHeader, StatusChip, PortalEmptyState, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function propLabel(p: { nickname: string | null; address_line1: string | null; city: string | null }) {
  return p.nickname || [p.address_line1, p.city].filter(Boolean).join(", ") || "Property"
}

export default async function SolicitorMattersPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "solicitor")
  const base = `/portal/${session.id}/solicitor`
  const [properties, docs] = await Promise.all([
    getLandlordProperties(session),
    getLinkedPropertyDocuments(session),
  ])

  const docCount = new Map<string, number>()
  for (const d of docs) {
    if (d.property_id) docCount.set(d.property_id, (docCount.get(d.property_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Matters"
        subtitle="Properties that are the subject of a matter instructed to you."
        backHref={base}
      />
      {properties.length === 0 ? (
        <PortalCard className="p-0"><PortalEmptyState icon={Gavel} title="No matters instructed" description="When a matter is assigned to you, the subject property appears here with its document bundle." /></PortalCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((p) => {
            const meta = propertyStatusMeta(p.status)
            const tone: PortalTone = meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "slate"
            const count = docCount.get(p.id) ?? 0
            return (
              <PortalCard key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#071B4D] truncate">{propLabel(p)}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{[p.address_line1, p.city, p.postcode].filter(Boolean).join(", ") || "—"}</p>
                  </div>
                  <StatusChip tone={tone} dot>{meta.label}</StatusChip>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#EEF3FB]">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5"><FileSignature className="w-4 h-4 text-violet-500" />{count} document{count === 1 ? "" : "s"}</span>
                  <Link href={`${base}/documents`} className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)]">View documents →</Link>
                </div>
              </PortalCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
