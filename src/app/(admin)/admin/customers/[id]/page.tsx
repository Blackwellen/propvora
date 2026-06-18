import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  UserCheck, Building2, CreditCard, Activity, ShieldCheck, MessageSquare,
  ChevronRight, Plus, Users, FileText, Gauge, LifeBuoy, Mail, Clock,
} from "lucide-react"
import {
  AdminPageHeader, AdminKpiStrip, AdminCard, AdminSectionCard, AdminStatusChip,
  AdminBanner, AdminButtonLink, AdminAuditTrailPanel, type AdminKpi, type AdminTone,
  type AdminAuditEntry,
} from "@/components/admin/ui"
import { getUserDetail, getWorkspaceDetail } from "@/lib/admin/data"
import { listWorkspacesByOwner } from "@/lib/admin/pages/batch1"
import CustomerActions from "./CustomerActions"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }> }

function planTone(plan: string): AdminTone {
  if (plan === "enterprise") return "violet"
  if (plan === "business" || plan === "pro") return "blue"
  if (plan === "trial") return "amber"
  return "slate"
}
function statusTone(status: string): AdminTone {
  if (status === "active") return "emerald"
  if (status === "trial" || status === "trialing") return "amber"
  if (status === "past_due") return "red"
  return "slate"
}
function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"
}
function shortDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const owner = await getUserDetail(id)
  if (!owner) notFound()

  const workspaces = await listWorkspacesByOwner(id)
  const primaryId = workspaces[0]?.id ?? null
  const primary = primaryId ? await getWorkspaceDetail(primaryId) : null

  const displayName = owner.name ?? owner.email ?? "Customer"
  const suspended = owner.security.banned

  const kpis: AdminKpi[] = [
    { label: "Primary plan", value: primary?.plan ?? workspaces[0]?.plan ?? "—", icon: CreditCard, tone: planTone(primary?.plan ?? workspaces[0]?.plan ?? "") },
    { label: "Workspaces", value: workspaces.length, icon: Building2, tone: "blue" },
    { label: "Billing status", value: <span className="capitalize">{(primary?.planStatus ?? workspaces[0]?.planStatus ?? "—").replace("_", " ")}</span>, icon: Gauge, tone: statusTone(primary?.planStatus ?? "") },
    { label: "Account status", value: suspended ? "Suspended" : "Active", icon: ShieldCheck, tone: suspended ? "red" : "emerald" },
    { label: "Last active", value: shortDate(owner.security.lastSignInAt), icon: Clock, tone: "slate" },
  ]

  const auditEntries: AdminAuditEntry[] = owner.recentAudit.map((e) => ({
    actor: e.actorName ?? e.actorEmail ?? "system",
    action: `${e.action}${e.workspaceName ? ` · ${e.workspaceName}` : ""}`,
    when: e.createdAt ? new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
  }))

  return (
    <div className="space-y-5">
      <AdminPageHeader
        breadcrumb={[{ label: "Customers", href: "/admin/customers" }, { label: displayName }]}
        icon={UserCheck}
        title={`Customer account — ${displayName}`}
        subtitle={`${owner.email ?? "No email on file"} · joined ${fmtDate(owner.createdAt)} · ${owner.id.slice(0, 8)}`}
        actions={
          <>
            {owner.email && <AdminButtonLink href={`mailto:${owner.email}`} icon={MessageSquare}>Message</AdminButtonLink>}
            <CustomerActions ownerId={owner.id} name={displayName} suspended={suspended} />
            <AdminButtonLink href="/admin/workspaces" variant="primary" icon={Plus}>Create workspace</AdminButtonLink>
          </>
        }
      />

      {suspended && (
        <AdminBanner tone="red" title="This customer is suspended.">
          The owner cannot sign in to any of their workspaces. Reactivate from the header to restore access.
        </AdminBanner>
      )}

      <AdminKpiStrip kpis={kpis} cols={5} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4 min-w-0">
          {/* Linked workspaces */}
          <AdminSectionCard title="Linked workspaces" icon={Building2}>
            {workspaces.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-2">This customer owns no workspaces.</p>
            ) : (
              <ul className="divide-y divide-[#F1F5FB] -my-1">
                {workspaces.map((w) => (
                  <li key={w.id}>
                    <Link href={`/admin/workspaces/${w.id}`} className="flex items-center gap-3 py-2.5 group">
                      <span className="w-8 h-8 rounded-lg bg-[#0D1B2A] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-white" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{w.name}</p>
                        <p className="text-[11px] text-slate-400">{w.memberCount} member{w.memberCount === 1 ? "" : "s"} · created {shortDate(w.createdAt)}</p>
                      </div>
                      <AdminStatusChip tone={planTone(w.plan)}>{w.plan}</AdminStatusChip>
                      <AdminStatusChip tone={statusTone(w.planStatus)} dot>{w.planStatus}</AdminStatusChip>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>

          {/* Team / members (of primary workspace) */}
          <AdminSectionCard title="Team & access" icon={Users} viewAllHref={primaryId ? `/admin/workspaces/${primaryId}` : undefined}>
            {!primary || primary.members.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-2">No additional team members on the primary workspace.</p>
            ) : (
              <ul className="space-y-2.5">
                {primary.members.map((m) => (
                  <li key={m.userId} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#EFF4FF] text-[#2563EB] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {(m.name ?? m.email ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#0B1B3F] truncate">{m.name ?? m.email ?? "—"}</p>
                      <p className="text-[11px] text-slate-400 truncate">{m.email ?? ""}</p>
                    </div>
                    <AdminStatusChip tone="slate">{m.role}</AdminStatusChip>
                    <Link href={`/admin/users/${m.userId}`} className="text-[12px] font-semibold text-[#2563EB] hover:underline shrink-0">View</Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>

          {/* Usage summary */}
          {primary && (
            <AdminSectionCard title="Usage (primary workspace)" icon={Activity}>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(primary.dataSummary).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-[#EEF3FB] bg-[#FAFCFF] px-3 py-2.5">
                    <dd className="text-[20px] font-bold text-[#0B1B3F] leading-none">{v ?? "—"}</dd>
                    <dt className="mt-1 text-[11px] capitalize text-slate-500">{k}</dt>
                  </div>
                ))}
              </dl>
            </AdminSectionCard>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <AdminSectionCard title="Account health" icon={Gauge}>
            <ul className="space-y-2.5 text-[13px]">
              <Health label="Email confirmed" ok={owner.security.emailConfirmed} />
              <Health label="MFA enrolled" ok={owner.security.mfaEnrolled} />
              <Health label="Account active" ok={!suspended} />
              <Health label="Has workspace" ok={workspaces.length > 0} />
            </ul>
          </AdminSectionCard>

          <AdminSectionCard title="Billing readiness" icon={CreditCard}>
            <ul className="space-y-2.5 text-[13px]">
              <Health label="Stripe customer linked" ok={!!primary?.stripeCustomerId} />
              <Health label="On a paid plan" ok={(primary?.plan ?? "") !== "trial" && (primary?.plan ?? "") !== "starter" && !!primary?.plan} />
            </ul>
            {primary?.stripeCustomerId && (
              <p className="mt-3 font-mono text-[11px] text-slate-400 truncate">{primary.stripeCustomerId}</p>
            )}
            <Link href="/admin/subscriptions" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
              Subscriptions <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </AdminSectionCard>

          <AdminSectionCard title="Contact" icon={Mail}>
            <dl className="space-y-2 text-[13px]">
              <Row label="Email" value={owner.email ?? "—"} />
              <Row label="Phone" value={owner.phone ?? "—"} />
              <Row label="Country" value={owner.country ?? "—"} />
            </dl>
          </AdminSectionCard>
        </div>
      </div>

      {/* Bottom row: portals/docs, support, audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AdminSectionCard title="Portals & documents" icon={FileText}>
          <p className="text-[13px] text-slate-500">Documents: <span className="font-semibold text-[#0B1B3F]">{primary?.dataSummary.documents ?? "—"}</span></p>
          <p className="mt-1 text-[12px] text-slate-400">Portal share-links and document access grants are managed per workspace.</p>
          {primaryId && (
            <Link href={`/admin/documents?workspace=${primaryId}`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
              Workspace documents <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </AdminSectionCard>

        <AdminSectionCard title="Support & risk" icon={LifeBuoy}>
          <p className="text-[13px] text-slate-500">No open support tickets or risk flags recorded for this customer.</p>
          <Link href={`/admin/risk?owner=${owner.id}`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
            Risk overview <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </AdminSectionCard>

        <AdminAuditTrailPanel entries={auditEntries} viewAllHref="/admin/audit-log" />
      </div>
    </div>
  )
}

function Health({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <AdminStatusChip tone={ok ? "emerald" : "slate"} dot>{ok ? "Yes" : "No"}</AdminStatusChip>
    </li>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-[#0B1B3F] truncate">{value}</dd>
    </div>
  )
}
