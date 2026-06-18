import React from "react"
import {
  ShieldCheck,
  Shield,
  KeyRound,
  Activity,
  AlertTriangle,
  Lock,
  Server,
  ScrollText,
  Info,
  Users,
} from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminCard,
  AdminSectionCard,
  AdminStatusChip,
  AdminEmptyState,
  AdminRightRail,
  AdminBanner,
  AdminButtonLink,
  AdminTabs,
  type AdminKpi,
} from "@/components/admin/ui"
import { listAudit } from "@/lib/admin/data"
import { getSecurityPosture } from "@/lib/admin/pages/batch5"

export const dynamic = "force-dynamic"

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "access", label: "Access" },
  { key: "sessions", label: "Sessions" },
  { key: "policies", label: "Policies" },
  { key: "incidents", label: "Incidents" },
  { key: "integrations", label: "Integrations" },
]

const SECURITY_ACTIONS = new Set([
  "workspace.suspended",
  "workspace.restored",
  "workspace.archived",
  "user.suspended",
  "user.reactivated",
  "feature_flag.toggled",
  "platform_settings.updated",
])

function postureTone(score: number) {
  if (score >= 85) return { tone: "emerald" as const, label: "Strong" }
  if (score >= 65) return { tone: "amber" as const, label: "Fair" }
  return { tone: "red" as const, label: "At risk" }
}

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"
}

export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp = await searchParams
  const tab = sp.tab && TABS.some((t) => t.key === sp.tab) ? sp.tab : "overview"

  const [posture, recent] = await Promise.all([
    getSecurityPosture(),
    listAudit({ limit: 200 }),
  ])
  const securityEvents = recent.filter((e) => SECURITY_ACTIONS.has(e.action))
  const pt = postureTone(posture.score)

  const kpis: AdminKpi[] = [
    { label: "Posture score", value: `${posture.score}`, icon: ShieldCheck, tone: pt.tone, sub: pt.label },
    { label: "Controls enforced", value: `${posture.controlsEnforced}/${posture.controlsTotal}`, icon: Lock, tone: "blue" },
    { label: "Admins with MFA", value: posture.totalAdmins > 0 ? `${posture.mfaAdmins}/${posture.totalAdmins}` : "—", icon: KeyRound, tone: posture.totalAdmins > 0 && posture.mfaAdmins < posture.totalAdmins ? "amber" : "emerald", sub: posture.totalAdmins === 0 ? "no admin profiles" : undefined },
    { label: "Security events (recent)", value: securityEvents.length, icon: Activity, tone: securityEvents.length > 0 ? "amber" : "emerald" },
    { label: "Active sessions", value: posture.sessionsAvailable ? String(posture.activeSessions ?? 0) : "—", icon: Users, tone: "slate", sub: posture.sessionsAvailable ? undefined : "not tracked" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Security"
        subtitle="Platform security posture, administrative security events and the enforced controls protecting tenant data."
        icon={ShieldCheck}
        actions={<AdminButtonLink href="/admin/audit-log" icon={ScrollText} variant="secondary">Full audit log</AdminButtonLink>}
      />

      {/* Posture banner */}
      <AdminCard className={pt.tone === "emerald" ? "border-emerald-200 bg-[#ECFDF5]/60" : pt.tone === "amber" ? "border-amber-200 bg-[#FFFBEB]" : "border-red-200 bg-[#FEF2F2]"}>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2EAF6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={pt.tone === "emerald" ? "#10B981" : pt.tone === "amber" ? "#F59E0B" : "#EF4444"} strokeWidth="3" strokeDasharray={`${posture.score} 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[16px] font-bold text-[#0B1B3F]">{posture.score}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-[#0B1B3F]">Security posture: {pt.label}</p>
              <AdminStatusChip tone={pt.tone} dot>{posture.score}/100</AdminStatusChip>
            </div>
            <p className="text-[12.5px] text-slate-600 mt-0.5">
              {posture.controlsEnforced} of {posture.controlsTotal} architectural controls enforced
              {posture.totalAdmins > 0 ? ` · ${posture.mfaAdmins}/${posture.totalAdmins} admins have MFA enrolled` : ""}.
              Score is computed from provable facts only.
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminKpiStrip kpis={kpis} cols={5} />

      <AdminTabs tabs={TABS.map((t) => ({ ...t, href: `?tab=${t.key}` }))} activeKey={tab} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5 min-w-0">
          {/* Security alerts / incident queue */}
          {(tab === "overview" || tab === "incidents") && (
            <AdminSectionCard
              title="Security alerts & incident queue"
              icon={AlertTriangle}
              actions={<AdminStatusChip tone={securityEvents.length > 0 ? "amber" : "emerald"}>{securityEvents.length} event{securityEvents.length === 1 ? "" : "s"}</AdminStatusChip>}
            >
              {securityEvents.length === 0 ? (
                <AdminEmptyState
                  icon={Shield}
                  title="No security-relevant admin events"
                  description="Account suspensions, archives, role changes and settings updates are surfaced here as they happen, sourced from the immutable audit log."
                />
              ) : (
                <ul className="space-y-2.5">
                  {securityEvents.slice(0, 12).map((e) => (
                    <li key={e.id} className="flex items-start gap-3 py-1.5 border-b border-[#F1F5FB] last:border-0">
                      <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Activity className="w-3.5 h-3.5" /></span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[12px] font-medium text-[#0B1B3F]">{e.action}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {e.actorName ?? e.actorEmail ?? "system"}{e.ip ? ` · ${e.ip}` : ""}{e.workspaceName ? ` · ${e.workspaceName}` : ""}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{fmt(e.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSectionCard>
          )}

          {/* Policy grid (Overview / Policies / Access) */}
          {(tab === "overview" || tab === "policies" || tab === "access") && (
            <AdminSectionCard title="Security policies & controls" icon={Lock}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {posture.controls.map((c) => (
                  <div key={c.label} className={`rounded-xl border p-3 ${c.enforced ? "border-emerald-100 bg-[#ECFDF5]/40" : "border-amber-200 bg-[#FFFBEB]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12.5px] font-medium text-[#0B1B3F]">{c.label}</p>
                      {c.enforced ? <AdminStatusChip tone="emerald">Enforced</AdminStatusChip> : <AdminStatusChip tone="amber">Inactive</AdminStatusChip>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{c.detail}</p>
                  </div>
                ))}
              </div>
            </AdminSectionCard>
          )}

          {/* Sessions tab */}
          {tab === "sessions" && (
            <AdminSectionCard title="Active sessions" icon={Users}>
              <AdminEmptyState
                icon={Users}
                title="Session inventory not wired"
                description="A live session inventory requires a session-tracking sink (auth session table or edge log). Rather than fabricate session counts, this view stays empty until that feed exists. Per-user sessions remain visible on each user's detail page."
              />
            </AdminSectionCard>
          )}

          {/* Integrations tab */}
          {tab === "integrations" && (
            <AdminSectionCard title="Security integrations" icon={Server}>
              <div className="space-y-2.5">
                {[
                  { label: "Supabase Auth (MFA / sessions)", on: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
                  { label: "Stripe webhook signature verification", on: !!process.env.STRIPE_SECRET_KEY },
                  { label: "WAF / rate-limit log sink", on: false },
                  { label: "SIEM export", on: false },
                ].map((i) => (
                  <div key={i.label} className="flex items-center justify-between py-2 border-b border-[#F1F5FB] last:border-0">
                    <span className="text-[13px] text-slate-700">{i.label}</span>
                    {i.on ? <AdminStatusChip tone="emerald" dot>Connected</AdminStatusChip> : <AdminStatusChip tone="slate" dot>Not connected</AdminStatusChip>}
                  </div>
                ))}
              </div>
            </AdminSectionCard>
          )}
        </div>

        {/* Right rail */}
        <AdminRightRail>
          <AdminSectionCard title="MFA & access" icon={KeyRound}>
            <dl className="space-y-2.5 text-[12.5px]">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Admin accounts</dt>
                <dd className="font-medium text-[#0B1B3F]">{posture.totalAdmins || "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">MFA enrolled</dt>
                <dd className="font-medium text-[#0B1B3F]">{posture.totalAdmins > 0 ? `${posture.mfaAdmins}/${posture.totalAdmins}` : "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Step-up (AAL2)</dt>
                <dd><AdminStatusChip tone="emerald">Enforced</AdminStatusChip></dd>
              </div>
            </dl>
          </AdminSectionCard>

          <AdminSectionCard title="Monitoring coverage" icon={Activity}>
            <ul className="space-y-2 text-[12.5px]">
              <li className="flex items-center justify-between"><span className="text-slate-600">Admin action audit</span><AdminStatusChip tone="emerald" dot>Live</AdminStatusChip></li>
              <li className="flex items-center justify-between"><span className="text-slate-600">RLS tenant isolation</span><AdminStatusChip tone="emerald" dot>Live</AdminStatusChip></li>
              <li className="flex items-center justify-between"><span className="text-slate-600">Failed-login monitoring</span><AdminStatusChip tone="slate" dot>Not wired</AdminStatusChip></li>
              <li className="flex items-center justify-between"><span className="text-slate-600">IP / rate-limit blocks</span><AdminStatusChip tone="slate" dot>Not wired</AdminStatusChip></li>
            </ul>
          </AdminSectionCard>

          <AdminBanner tone="blue" icon={Info}>
            Failed-login, rate-limit and IP-block monitoring need a dedicated security-events pipeline. This page reports only what is genuinely tracked today — no fabricated threat numbers.
          </AdminBanner>
        </AdminRightRail>
      </div>
    </div>
  )
}
