import React from "react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  FileText,
  ShieldCheck,
  ScrollText,
  History,
  AlertTriangle,
  CreditCard,
  ImageIcon,
} from "lucide-react"
import { Card } from "@/components/ui/Card"
import { getAdminIdentity } from "@/lib/admin/guard"
import {
  getSupplierVerificationDetail,
  shortId,
} from "@/components/admin-supplier-verification/data"
import {
  SupplierStatusBadge,
  LevelBadge,
  CheckBadge,
  EvidenceBadge,
  SeverityBadge,
} from "@/components/admin-supplier-verification/badges"
import ReviewActions from "@/components/admin-supplier-verification/ReviewActions"
import EvidenceAccept from "@/components/admin-supplier-verification/EvidenceAccept"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

function fmtDate(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—"
}

function gbp(pence: number | null): string {
  if (pence == null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
    pence / 100
  )
}

function SectionHeader({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof FileText
  title: string
  hint?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-slate-400" />
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
  )
}

/**
 * Supplier verification detail — documents (R2 authed URLs), insurance, licences,
 * event trail, risk flags + the decision panel. Guard-enforced server-side
 * (fail-closed). Document/policy/licence numbers shown are MASKED at rest.
 */
export default async function AdminSupplierVerificationDetailPage({ params }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const { id } = await params
  const { available, detail } = await getSupplierVerificationDetail(id)
  if (!available) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white py-12 text-center">
        <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">Subsystem not provisioned</p>
      </div>
    )
  }
  if (!detail) notFound()

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/supplier-verification"
          className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to queue
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {detail.supplierName ?? "Supplier"}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              workspace {shortId(detail.supplierWorkspaceId)} · verification {shortId(detail.id)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LevelBadge level={detail.level} label={detail.levelLabel} />
          <SupplierStatusBadge status={detail.status} />
        </div>
      </div>

      {/* Check summary */}
      <Card>
        <SectionHeader icon={ShieldCheck} title="Verification checks" hint="evidence-reviewed only" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
          <div>
            <p className="text-[11px] text-slate-400 mb-1">Document check</p>
            <CheckBadge status={detail.documentCheckStatus} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-1">Selfie check</p>
            <CheckBadge status={detail.selfieCheckStatus} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-1">Manual review</p>
            <CheckBadge status={detail.manualReviewStatus} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-1">Payout (Stripe)</p>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              {detail.stripeAccountId ? "Linked" : "Not linked"}
            </span>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          Submitted {fmtDate(detail.submittedAt)} · last updated {fmtDate(detail.updatedAt)}
          {detail.expiresAt ? ` · expires ${fmtDate(detail.expiresAt)}` : ""}
        </p>
      </Card>

      {/* Risk flags */}
      {detail.riskFlags.length > 0 && (
        <Card>
          <SectionHeader icon={AlertTriangle} title="Risk flags" />
          <ul className="space-y-2">
            {detail.riskFlags.map((f) => (
              <li key={f.id} className="flex items-start justify-between gap-3 rounded-lg border border-[#E2E8F0] px-3 py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium text-slate-700 capitalize">
                      {f.flagType.replace(/_/g, " ")}
                    </span>
                    <SeverityBadge severity={f.severity} />
                    {f.resolved && <span className="text-[11px] text-slate-400">resolved</span>}
                  </div>
                  {f.detail && <p className="text-[11px] text-slate-400 mt-0.5 break-all">{f.detail}</p>}
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{fmtDate(f.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <SectionHeader icon={FileText} title="ID documents" hint="numbers masked · files served via authed URL" />
        {detail.documents.length === 0 ? (
          <p className="text-[12px] text-slate-400">No ID documents uploaded.</p>
        ) : (
          <ul className="space-y-3">
            {detail.documents.map((d) => (
              <li key={d.id} className="rounded-lg border border-[#E2E8F0] p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[13px] font-medium text-slate-800 capitalize">
                      {d.docType.replace(/_/g, " ")}
                      {d.documentCountry ? ` · ${d.documentCountry}` : ""}
                    </p>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      {d.nameOnDocument ?? "—"} · {d.documentNumberMasked ?? "no number"}
                      {d.expiryDate ? ` · expires ${fmtDate(d.expiryDate)}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">OCR: {d.ocrStatus.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <EvidenceBadge status={d.status} />
                    <EvidenceAccept table="supplier_identity_documents" id={d.id} status={d.status} />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11.5px]">
                  {d.frontUrl && (
                    <a href={d.frontUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2563EB] hover:underline">
                      <ImageIcon className="w-3.5 h-3.5" /> Front
                    </a>
                  )}
                  {d.backUrl && (
                    <a href={d.backUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2563EB] hover:underline">
                      <ImageIcon className="w-3.5 h-3.5" /> Back
                    </a>
                  )}
                  {d.selfieUrl && (
                    <a href={d.selfieUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2563EB] hover:underline">
                      <ImageIcon className="w-3.5 h-3.5" /> Selfie
                    </a>
                  )}
                  {!d.frontUrl && !d.backUrl && !d.selfieUrl && (
                    <span className="text-slate-400">No file attached</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Insurance */}
      <Card>
        <SectionHeader icon={ShieldCheck} title="Insurance" hint="policy numbers masked" />
        {detail.insurance.length === 0 ? (
          <p className="text-[12px] text-slate-400">No insurance evidence uploaded.</p>
        ) : (
          <ul className="space-y-3">
            {detail.insurance.map((p) => (
              <li key={p.id} className="rounded-lg border border-[#E2E8F0] p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[13px] font-medium text-slate-800 capitalize">
                      {p.insuranceType.replace(/_/g, " ")}
                      {p.provider ? ` · ${p.provider}` : ""}
                    </p>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      {p.policyNumberMasked ?? "no number"} · cover {gbp(p.coverageAmountPence)}
                      {p.minimumCoverMet ? " · meets minimum" : " · below minimum"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {fmtDate(p.validFrom)} – {fmtDate(p.validTo)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <EvidenceBadge status={p.status} expired={p.expired} />
                    {p.fileUrl && (
                      <a href={p.fileUrl} target="_blank" rel="noreferrer" className="text-[11.5px] text-[#2563EB] hover:underline inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> View
                      </a>
                    )}
                    <EvidenceAccept table="supplier_insurance_policies" id={p.id} status={p.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Licences */}
      <Card>
        <SectionHeader icon={ScrollText} title="Licences & certifications" hint="licence numbers masked" />
        {detail.licences.length === 0 ? (
          <p className="text-[12px] text-slate-400">No licence evidence uploaded.</p>
        ) : (
          <ul className="space-y-3">
            {detail.licences.map((l) => (
              <li key={l.id} className="rounded-lg border border-[#E2E8F0] p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[13px] font-medium text-slate-800 capitalize">
                      {l.licenceType.replace(/_/g, " ")}
                      {l.issuingBody ? ` · ${l.issuingBody}` : ""}
                    </p>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      {l.licenceNumberMasked ?? "no number"}
                      {l.country ? ` · ${l.country}` : ""}
                      {l.region ? ` / ${l.region}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {fmtDate(l.validFrom)} – {fmtDate(l.validTo)}
                      {l.requiredForCategories.length > 0
                        ? ` · for ${l.requiredForCategories.join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <EvidenceBadge status={l.status} expired={l.expired} />
                    {l.fileUrl && (
                      <a href={l.fileUrl} target="_blank" rel="noreferrer" className="text-[11.5px] text-[#2563EB] hover:underline inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> View
                      </a>
                    )}
                    <EvidenceAccept table="supplier_licence_verifications" id={l.id} status={l.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Decision panel */}
      <Card>
        <SectionHeader icon={ShieldCheck} title="Decision" hint="explicit & audited" />
        <ReviewActions verificationId={detail.id} status={detail.status} />
      </Card>

      {/* Event trail */}
      <Card>
        <SectionHeader icon={History} title="Event trail" />
        {detail.events.length === 0 ? (
          <p className="text-[12px] text-slate-400">No events recorded.</p>
        ) : (
          <ul className="space-y-2">
            {detail.events.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 text-[12px]">
                <div>
                  <span className="font-medium text-slate-700 capitalize">
                    {e.eventType.replace(/_/g, " ")}
                  </span>
                  {(e.fromStatus || e.toStatus) && (
                    <span className="text-slate-400">
                      {" "}
                      {e.fromStatus ?? "—"} → {e.toStatus ?? "—"}
                    </span>
                  )}
                  {e.actorRole && <span className="text-slate-400"> · {e.actorRole}</span>}
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{fmtDate(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
