import React from "react"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  Globe,
  Calendar,
  ShieldAlert,
  FileText,
  ListChecks,
  Gavel,
} from "lucide-react"
import { Card } from "@/components/ui/Card"
import { getAdminIdentity } from "@/lib/admin/guard"
import {
  getVerificationDetail,
  signDocumentUrl,
  shortId,
} from "@/components/admin-verification/data"
import { StatusBadge, RiskBadge } from "@/components/admin-verification/badges"
import DocumentList from "@/components/admin-verification/DocumentList"
import ChecksList from "@/components/admin-verification/ChecksList"
import SanctionsPanel from "@/components/admin-verification/SanctionsPanel"
import ReviewActions from "@/components/admin-verification/ReviewActions"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

function fmtDate(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—"
}

function SectionHeader({ icon: Icon, title, hint }: { icon: typeof FileText; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-slate-500" />
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
  )
}

export default async function AdminVerificationDetailPage({ params }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const { id } = await params
  const { available, detail } = await getVerificationDetail(id)

  if (!available) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/verification"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#2563EB]"
        >
          <ArrowLeft className="w-4 h-4" /> Verification queue
        </Link>
        <Card className="py-12 text-center">
          <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Verification subsystem not provisioned</p>
          <p className="text-xs text-slate-400 mt-1">The identity tables are not present in this database.</p>
        </Card>
      </div>
    )
  }

  if (!detail) notFound()

  // Mint short-lived signed URLs for each document server-side (authed view).
  const keys = Array.from(
    new Set(detail.documents.map((d) => d.fileKey).filter((k): k is string => !!k))
  )
  const signedPairs = await Promise.all(
    keys.map(async (k) => [k, await signDocumentUrl(k)] as const)
  )
  const signedUrls: Record<string, string | null> = Object.fromEntries(signedPairs)

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/verification" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Verification queue
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate">
          {detail.fullName ?? "Subject"}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Subject header */}
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-slate-900">
                    {detail.fullName ?? "Unnamed subject"}
                  </h1>
                  <StatusBadge status={detail.status} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                  {detail.userId && <span className="font-mono">{shortId(detail.userId)}</span>}
                  {detail.workspaceId && (
                    <Link
                      href={`/admin/workspaces/${detail.workspaceId}`}
                      className="inline-flex items-center gap-1 hover:text-[#2563EB]"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      {detail.workspaceName ?? shortId(detail.workspaceId)}
                    </Link>
                  )}
                  {detail.country && (
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {detail.country}
                    </span>
                  )}
                  {detail.dateOfBirth && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {fmtDate(detail.dateOfBirth)}
                    </span>
                  )}
                </div>
              </div>
              <RiskBadge level={detail.riskLevel} />
            </div>
            {detail.reviewNote && (
              <div className="mt-3 rounded-lg bg-slate-50 border border-[#E2E8F0] px-3 py-2">
                <p className="text-[11px] font-medium text-slate-500 mb-0.5">Latest reviewer note</p>
                <p className="text-[12.5px] text-slate-700">{detail.reviewNote}</p>
              </div>
            )}
            <p className="mt-3 text-[11px] text-slate-400">
              Submitted {fmtDate(detail.submittedAt)} · last updated {fmtDate(detail.updatedAt)}
            </p>
          </Card>

          {/* Documents */}
          <Card className="p-4">
            <SectionHeader
              icon={FileText}
              title="Submitted documents"
              hint={`${detail.documents.length} file${detail.documents.length === 1 ? "" : "s"}`}
            />
            <DocumentList documents={detail.documents} signedUrls={signedUrls} />
          </Card>

          {/* Checks */}
          <Card className="p-4">
            <SectionHeader
              icon={ListChecks}
              title="Verification checks"
              hint={`${detail.checks.length}`}
            />
            <ChecksList checks={detail.checks} />
          </Card>

          {/* Sanctions / PEP signals */}
          <Card className="p-4">
            <SectionHeader
              icon={ShieldAlert}
              title="Sanctions / PEP screening signals"
              hint="for human review"
            />
            <SanctionsPanel signals={detail.sanctions} />
          </Card>
        </div>

        {/* Action rail */}
        <aside className="lg:w-[340px] lg:shrink-0">
          <div className="lg:sticky lg:top-4">
            <Card className="p-4">
              <SectionHeader icon={Gavel} title="Decision" />
              <p className="text-[11.5px] leading-relaxed text-slate-500 mb-3">
                Your decision is an explicit, recorded action with an audit-trail entry. The system
                never auto-decides. Approving writes a verified status; rejecting or requesting info
                records the reason.
              </p>
              <ReviewActions verificationId={detail.id} status={detail.status} />
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}
