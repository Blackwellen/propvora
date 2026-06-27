"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ShieldCheck, KeyRound, Clock, Upload, MessageSquare,
  XCircle, Mail, Building2, Hash, AlertTriangle, ExternalLink,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  usePortalGrant, usePortalToken, usePortalDiagnostics,
  useRevokeGrant, useExtendGrant,
} from "@/hooks/usePortals"
import {
  GRANT_STATUS_META, TOKEN_STATUS_META, profileLabel, purposeLabel,
} from "@/lib/portals/config"
import { cn } from "@/lib/utils"

function fmtDateTime(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default function PortalGrantDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const grantId = params?.id
  const { workspace } = useWorkspace()

  const { data: grant, isLoading } = usePortalGrant(workspace?.id, grantId)
  const { data: token } = usePortalToken(workspace?.id, grantId)
  const { data: diag } = usePortalDiagnostics(workspace?.id, grantId)
  const revoke = useRevokeGrant()
  const extend = useExtendGrant()

  if (isLoading) {
    return (
      <DashboardContainer>
        <div className="px-6 py-16 text-center text-sm text-slate-400">Loading grant…</div>
      </DashboardContainer>
    )
  }

  if (!grant) {
    return (
      <DashboardContainer>
        <div className="px-6 pt-6 pb-10">
          <Link href="/property-manager/portals/access" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to grants
          </Link>
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <AlertTriangle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Grant not found</p>
            <p className="text-xs text-slate-400 mt-1">It may have been deleted or you may not have access.</p>
          </div>
        </div>
      </DashboardContainer>
    )
  }

  const statusMeta = GRANT_STATUS_META[grant.status] ?? GRANT_STATUS_META.created
  const tokenMeta = TOKEN_STATUS_META[token?.status ?? "none"]
  const isRevoked = grant.status === "revoked"

  return (
    <DashboardContainer>
      <div className="px-6 pt-6 pb-10 space-y-6">
        <Link href="/property-manager/portals/access" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to grants
        </Link>

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[#0EA5E9] flex items-center justify-center text-white text-lg font-bold shrink-0">
                {(grant.contact?.full_name ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {grant.contact?.full_name || "Unknown contact"}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  {grant.contact?.email && (
                    <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {grant.contact.email}</span>
                  )}
                  {grant.contact?.company && (
                    <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {grant.contact.company}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ConfirmDialog
                title="Extend portal access?"
                description="This will extend the grant and its token expiry by 30 days and reactivate the link."
                confirmLabel="Extend 30 days"
                confirmVariant="primary"
                onConfirm={async () => {
                  if (workspace?.id) await extend.mutateAsync({ id: grant.id, workspaceId: workspace.id, days: 30 })
                }}
              >
                {(open) => (
                  <button
                    onClick={open}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium px-3.5 py-2 hover:bg-slate-50 transition-colors"
                  >
                    <Clock className="w-4 h-4" /> Extend
                  </button>
                )}
              </ConfirmDialog>
              <ConfirmDialog
                title="Revoke portal access?"
                description="The contact's portal link will stop working immediately. This can be re-granted later."
                confirmLabel="Revoke access"
                confirmVariant="danger"
                onConfirm={async () => {
                  if (workspace?.id) await revoke.mutateAsync({ id: grant.id, workspaceId: workspace.id })
                }}
              >
                {(open) => (
                  <button
                    onClick={open}
                    disabled={isRevoked}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-2 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> {isRevoked ? "Revoked" : "Revoke"}
                  </button>
                )}
              </ConfirmDialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: scope + token */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scope */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Access scope</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "Profile", value: profileLabel(grant.access_type) },
                  { label: "Purpose", value: purposeLabel(grant.purpose) },
                  { label: "Status", value: <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold", statusMeta.cls)}>{statusMeta.label}</span> },
                  { label: "Created", value: fmtDateTime(grant.created_at) },
                  { label: "Expires", value: fmtDateTime(grant.expires_at) },
                  { label: "Last accessed", value: grant.last_opened_at ? fmtDateTime(grant.last_opened_at) : "Never" },
                  { label: "Email sent", value: grant.email_sent_at ? fmtDateTime(grant.email_sent_at) : "Not sent" },
                  { label: "Revoked", value: grant.revoked_at ? fmtDateTime(grant.revoked_at) : "—" },
                ].map((row) => (
                  <div key={row.label}>
                    <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{row.label}</dt>
                    <dd className="text-sm text-slate-700 mt-1">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Token status (never raw) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[var(--brand)]" />
                  <h3 className="text-sm font-bold text-slate-900">Magic-link token</h3>
                </div>
                <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold", tokenMeta.cls)}>
                  {tokenMeta.label}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3">
                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-sm font-mono text-slate-400 tracking-widest">
                  •••••••• •••••••• •••••••• ••••••••
                </span>
                <span className="ml-auto text-[10px] font-medium text-slate-400">hashed — never shown</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Token expires</dt>
                  <dd className="text-sm text-slate-700 mt-1">{fmtDateTime(token?.expires_at ?? null)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Last used</dt>
                  <dd className="text-sm text-slate-700 mt-1">{token?.last_used_at ? fmtDateTime(token.last_used_at) : "Never"}</dd>
                </div>
              </dl>
            </div>

            {/* Diagnostics */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Portal activity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4 text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                      {diag?.uploads === null || diag?.uploads === undefined ? "—" : diag.uploads}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {diag?.uploads === null ? "Uploads (not provisioned)" : "Uploads"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                      {diag?.messages === null || diag?.messages === undefined ? "—" : diag.messages}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {diag?.messages === null ? "Messages (not provisioned)" : "Messages"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-4">
            {/* Portal status */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800 mb-1">Recipient portal active</p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    The secure recipient portal is live at
                    <span className="font-mono text-[10px] ml-1">/portal?token=…</span>.
                    Recipients can view documents, invoices and jobs based on their grant scope.
                    Revoke instantly from the Actions panel.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-[var(--brand)]" />
                <h3 className="text-sm font-bold text-slate-900">Security</h3>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-500 leading-relaxed">
                <li>Token minted server-side, stored as SHA-256 hash.</li>
                <li>Raw token is never exposed to this workspace UI.</li>
                <li>Revocation takes effect immediately.</li>
              </ul>
            </div>

            <Link
              href={`/property-manager/contacts/${grant.contact_id}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> View contact
            </Link>
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}
