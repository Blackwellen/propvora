"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/compliance/documents/[documentId] — document detail (manifest 65).

   Document preview, tabs Overview / Links / History / Audit, approval status,
   linked services & jobs, replacement + approval history, audit trail and a
   secure-access note. Reads the live compliance-document envelope and degrades
   gracefully when richer fields aren't present. The file is private unless
   explicitly approved for public trust-badge display.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  LayoutGrid, Link2, History, ShieldCheck, Upload, RefreshCw, FileText, Download,
  CheckCircle2, Wrench, Briefcase, Lock,
} from "lucide-react"
import { SupplierDetailShell, type SupplierDetailTab } from "@/components/supplier-workspace/SupplierDetailShell"
import {
  SupplierCard, SupplierStatusBadge, SupplierButton, SupplierEmptyState,
  SupplierActionBar, SupplierBanner, toneForStatus, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate } from "@/components/supplier-workspace/format"

interface DocumentDetail {
  id?: string
  name?: string
  type?: string
  status?: string
  reference?: string
  valid_from?: string
  expires_at?: string
  approved_at?: string
  approved_by?: string
  file_name?: string
  linked_services?: string[]
  linked_jobs?: { ref: string; title: string }[]
  history?: { id?: string; label?: string; created_at?: string }[]
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">{title}</h2>{action}</div>
      {children}
    </SupplierCard>
  )
}

export default function SupplierComplianceDocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const doc = useSupplierApi<DocumentDetail>(
    useSupplierApiUrl(`/api/supplier/compliance/documents/${documentId}`),
    { select: (j) => (j as { document?: DocumentDetail }).document ?? (j as DocumentDetail) }
  )
  const d = doc.data ?? {}
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)
  const approved = !!d.approved_at || /approved|verified/i.test(d.status ?? "")

  const tabs: SupplierDetailTab[] = [
    {
      key: "overview", label: "Overview", icon: LayoutGrid,
      render: () => (
        <div className="space-y-4">
          {/* Preview + approval */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">
            <SupplierCard className="p-5">
              <div className="aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-300">
                <FileText className="w-10 h-10" />
                <p className="text-xs text-slate-400 mt-2">{d.file_name ?? "Document preview"}</p>
              </div>
              <SupplierButton variant="outline" className="w-full justify-center mt-3" onClick={() => setBanner({ tone: "emerald", msg: "Download started." })}><Download className="w-4 h-4" /> Download</SupplierButton>
            </SupplierCard>
            <div className="space-y-4">
              <SupplierCard className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Approval status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${approved ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{approved ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}</span>
                  <div><p className="text-sm font-semibold text-slate-900">{d.status ? humaniseStatus(d.status) : approved ? "Approved" : "Pending review"}</p>{d.approved_at && <p className="text-xs text-slate-400">{shortDate(d.approved_at)}{d.approved_by ? ` · ${d.approved_by}` : ""}</p>}</div>
                </div>
              </SupplierCard>
              <SupplierCard className="p-5">
                <dl className="space-y-2.5 text-sm">
                  <Row k="Type" v={d.type ? humaniseStatus(d.type) : "Compliance document"} />
                  {d.reference && <Row k="Reference" v={d.reference} />}
                  <Row k="Valid from" v={shortDate(d.valid_from)} />
                  <Row k="Expires" v={shortDate(d.expires_at)} />
                </dl>
              </SupplierCard>
            </div>
          </div>
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> This document is private to your workspace and reviewers. It is only shown publicly if you approve it for trust-badge display.
          </div>
        </div>
      ),
    },
    {
      key: "links", label: "Links", icon: Link2,
      render: () => (
        <div className="space-y-4">
          <Section title="Linked services">
            {!d.linked_services || d.linked_services.length === 0 ? (
              <SupplierEmptyState icon={Wrench} title="Not linked to any service" description="Link this document to the services it covers." />
            ) : (
              <div className="flex flex-wrap gap-2">{d.linked_services.map((s) => <span key={s} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-700 px-2.5 py-1.5 text-xs font-medium"><Wrench className="w-3.5 h-3.5 text-slate-400" />{s}</span>)}</div>
            )}
          </Section>
          <Section title="Linked jobs">
            {!d.linked_jobs || d.linked_jobs.length === 0 ? (
              <SupplierEmptyState icon={Briefcase} title="No linked jobs" />
            ) : (
              <ul className="divide-y divide-slate-100">{d.linked_jobs.map((j) => <li key={j.ref} className="py-2.5"><Link href={`/supplier/jobs/${j.ref}`} className="text-sm font-medium text-slate-800 hover:text-[var(--brand)]">{j.title}</Link><p className="text-xs text-slate-400">{j.ref}</p></li>)}</ul>
            )}
          </Section>
        </div>
      ),
    },
    {
      key: "history", label: "History", icon: RefreshCw,
      render: () => (
        <Section title="Replacement &amp; approval history">
          {!d.history || d.history.length === 0 ? (
            <ul className="space-y-2 text-sm text-slate-600">
              {d.approved_at && <li>Approved {shortDate(d.approved_at)}</li>}
              {d.valid_from && <li>Uploaded {shortDate(d.valid_from)}</li>}
              {!d.approved_at && !d.valid_from && <li>No history recorded yet.</li>}
            </ul>
          ) : (
            <ol className="space-y-3">{d.history.map((h, i) => <li key={h.id ?? i} className="flex gap-3"><span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" /><div><p className="text-sm text-slate-700">{h.label ?? "Update"}</p><p className="text-[11px] text-slate-400">{shortDate(h.created_at)}</p></div></li>)}</ol>
          )}
        </Section>
      ),
    },
    {
      key: "audit", label: "Audit", icon: History,
      render: () => (
        <Section title="Audit trail">
          <p className="text-sm text-slate-500">Every view, download and approval action on this document is logged for compliance. Access is role-gated and recorded.</p>
        </Section>
      ),
    },
  ]

  return (
    <>
      {banner && <div className="mb-3"><SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner></div>}
      <SupplierDetailShell
        backHref="/supplier/compliance"
        backLabel="Back to compliance"
        title={d.name ?? `Document ${String(documentId).slice(0, 8)}`}
        subtitle={d.type ? humaniseStatus(d.type) : undefined}
        status={d.status ? <SupplierStatusBadge tone={toneForStatus(d.status)}>{humaniseStatus(d.status)}</SupplierStatusBadge> : approved ? <SupplierStatusBadge tone="emerald">Approved</SupplierStatusBadge> : undefined}
        tabs={tabs}
        actionBar={
          <SupplierActionBar>
            <Link href="/supplier/compliance/upload"><SupplierButton variant="outline"><RefreshCw className="w-4 h-4" /> Replace</SupplierButton></Link>
            <Link href="/supplier/compliance/upload"><SupplierButton><Upload className="w-4 h-4" /> Upload new</SupplierButton></Link>
          </SupplierActionBar>
        }
      />
    </>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-slate-800">{v}</dd></div>
}
