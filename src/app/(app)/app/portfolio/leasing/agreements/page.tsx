"use client"
import React, { useState } from "react"
import {
  Plus,
  CheckCircle2,
  Clock,
  Download,
  X,
  Bell,
  AlertTriangle,
  FileSignature,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

/* ─── Types ───────────────────────────────────────────────────── */
type AgreementStatus = "Draft" | "Sent" | "Partially Signed" | "Fully Signed" | "Expired"

interface Signatory {
  name: string
  email: string
  role: "Tenant" | "Landlord" | "Agent"
  signed: boolean
  signedAt?: string
}

interface Agreement {
  id: string
  title: string
  tenancy: string
  signatories: Signatory[]
  created: string
  deadline: string | null
  status: AgreementStatus
}

/* ─── Mock data ───────────────────────────────────────────────── */
const AGREEMENTS: Agreement[] = []

type StatusFilter = "All" | AgreementStatus

const STATUS_TABS: StatusFilter[] = ["All", "Draft", "Sent", "Partially Signed", "Fully Signed", "Expired"]

const statusStyle: Record<AgreementStatus, string> = {
  "Draft":            "bg-slate-50 text-slate-700 border-slate-200",
  "Sent":             "bg-blue-50 text-blue-700 border-blue-200",
  "Partially Signed": "bg-amber-50 text-amber-700 border-amber-200",
  "Fully Signed":     "bg-green-50 text-green-700 border-green-200",
  "Expired":          "bg-red-50 text-red-700 border-red-200",
}

const avatarBg = ["bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700"]

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function AgreementsPage() {
  const [activeTab, setActiveTab] = useState<StatusFilter>("All")
  const [drawerAgreement, setDrawerAgreement] = useState<Agreement | null>(null)

  const filtered = activeTab === "All" ? AGREEMENTS : AGREEMENTS.filter((a) => a.status === activeTab)

  /* Row → card mapping for the mobile list (mirrors the desktop table columns). */
  const agreementCardMapping: MobileCardMapping<Agreement> = {
    getKey: (a) => a.id,
    title: (a) => a.title,
    subtitle: (a) => a.tenancy,
    badge: (a) => (
      <span className={cn("border px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap", statusStyle[a.status])}>
        {a.status}
      </span>
    ),
    fields: [
      {
        label: "Signatories",
        render: (a) => {
          const signed = a.signatories.filter((s) => s.signed).length
          return `${signed}/${a.signatories.length} signed`
        },
      },
      { label: "Created", render: (a) => a.created },
      { label: "Deadline", render: (a) => a.deadline ?? "—" },
    ],
    onRowClick: (a) => setDrawerAgreement(a),
  }

  return (
    <>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Tenancy Agreements"
        subtitle={`${AGREEMENTS.length} agreements`}
        showBack
        backHref="/property-manager/portfolio/leasing"
        primaryAction={{ label: "Create agreement", icon: Plus, onClick: () => {} }}
      />

      {/* Page header — hidden on phones */}
      <div className="hidden md:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Tenancy Agreements</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{AGREEMENTS.length} agreements · {AGREEMENTS.filter((a) => a.status === "Partially Signed" || a.status === "Sent").length} awaiting signature</p>
        </div>
        <button className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Create Agreement
        </button>
      </div>

      {/* Status tabs — horizontal scroll on phones */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6">
        <div className="flex items-center gap-0 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-all duration-150 whitespace-nowrap",
                activeTab === tab
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="py-6 px-4 md:px-0">
        <ResponsiveTable rows={filtered} mobile={agreementCardMapping}>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Agreement Title</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tenancy</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Signatories</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Deadline</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-slate-400">
                    No agreements yet. Agreements will appear here once you start the leasing process.
                  </td>
                </tr>
              )}
              {filtered.map((agreement, rowIdx) => {
                const signedCount = agreement.signatories.filter((s) => s.signed).length
                const totalCount  = agreement.signatories.length

                return (
                  <tr key={agreement.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-[13px] font-semibold text-slate-800">{agreement.title}</span>
                      </div>
                    </td>

                    {/* Tenancy */}
                    <td className="px-4 py-3 text-[12px] text-slate-600">{agreement.tenancy}</td>

                    {/* Signatories mini-avatars */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {agreement.signatories.map((sig, si) => (
                            <div
                              key={sig.email}
                              className={cn("w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold", avatarBg[si % avatarBg.length])}
                              title={`${sig.name} — ${sig.signed ? "Signed" : "Awaiting"}`}
                            >
                              {getInitials(sig.name)}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          {totalCount > 0 ? (
                            <>
                              {signedCount === totalCount ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span className="text-[11px] text-slate-500">{signedCount}/{totalCount} signed</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500">0/0</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-[12px] text-slate-600">{agreement.created}</td>

                    {/* Deadline */}
                    <td className="px-4 py-3 text-[12px] text-slate-600">
                      {agreement.deadline ?? <span className="text-slate-400">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={cn("border px-2 py-0.5 rounded-full text-[10px] font-medium", statusStyle[agreement.status])}>
                        {agreement.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDrawerAgreement(agreement)}
                          className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        {(agreement.status === "Partially Signed") && (
                          <button className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors">
                            <Bell className="w-3 h-3" />
                            Remind
                          </button>
                        )}
                        {agreement.status === "Expired" && (
                          <button className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors">
                            Resend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
        </ResponsiveTable>
      </div>

      {/* Signature status drawer */}
      {drawerAgreement && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerAgreement(null)} />

          {/* Drawer panel */}
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-900 leading-tight">{drawerAgreement.title}</h2>
                <span className={cn("inline-block border px-2 py-0.5 rounded-full text-[10px] font-medium mt-1", statusStyle[drawerAgreement.status])}>
                  {drawerAgreement.status}
                </span>
              </div>
              <button onClick={() => setDrawerAgreement(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Signing timeline */}
            <div className="px-6 py-5 flex-1">
              <h3 className="text-[12px] font-semibold text-slate-700 uppercase tracking-wide mb-4">Signing Timeline</h3>

              {/* Agreement sent */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">Agreement sent</p>
                  <p className="text-[11px] text-slate-500">{drawerAgreement.created}</p>
                </div>
              </div>

              {/* Signatories */}
              {drawerAgreement.signatories.map((sig, si) => (
                <div key={sig.email} className="flex items-start gap-3 mb-5">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    sig.signed ? "bg-green-100" : "bg-amber-100"
                  )}>
                    {sig.signed
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <Clock className="w-4 h-4 text-amber-600" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold", avatarBg[si % avatarBg.length])}>
                        {getInitials(sig.name)}
                      </div>
                      <p className="text-[12px] font-semibold text-slate-800">{sig.name}</p>
                      <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">{sig.role}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{sig.email}</p>
                    {sig.signed && sig.signedAt ? (
                      <p className="text-[11px] text-green-600 mt-0.5 font-medium">Signed at {sig.signedAt}</p>
                    ) : (
                      <p className="text-[11px] text-amber-600 mt-0.5">Awaiting signature</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 space-y-2 shrink-0">
              {drawerAgreement.status === "Fully Signed" && (
                <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Download Signed PDF
                </button>
              )}
              {(drawerAgreement.status === "Sent" || drawerAgreement.status === "Partially Signed") && (
                <button className="w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                  <Bell className="w-4 h-4" />
                  Send Reminder
                </button>
              )}
              <button className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                <AlertTriangle className="w-4 h-4" />
                Void Agreement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

