import React from "react"
import Link from "next/link"
import { Shield, ShieldCheck, Info, Activity } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { listAudit } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

// Security-relevant admin actions we surface here.
const SECURITY_ACTIONS = new Set([
  "workspace.suspended",
  "workspace.restored",
  "workspace.archived",
  "user.suspended",
  "user.reactivated",
  "feature_flag.toggled",
  "platform_settings.updated",
])

export default async function AdminSecurityPage() {
  const recent = await listAudit({ limit: 200 })
  const securityEvents = recent.filter((e) => SECURITY_ACTIONS.has(e.action))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Security Overview</h1>
        <p className="text-xs text-slate-500">Platform security posture and administrative security events</p>
      </div>

      {/* Live admin security events */}
      <Card noPadding>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> Administrative Security Events
          </h3>
          <Link href="/admin/audit" className="text-xs text-[#2563EB] hover:underline">Full audit log</Link>
        </div>
        <CardContent className="pt-3">
          {securityEvents.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No security-relevant admin events recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Suspensions, archives and flag changes will be listed here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {securityEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
                    <Activity className="w-3 h-3 text-[#EF4444]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-medium text-slate-700">{e.action}</p>
                    <p className="text-[11px] text-slate-400">
                      {e.actorName ?? e.actorEmail ?? "system"}{e.ip ? ` · ${e.ip}` : ""}{e.workspaceName ? ` · ${e.workspaceName}` : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform security controls — factual */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#2563EB]" /> Platform Security Controls</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: "Admin console fails closed (server-verified platform admin)", state: "enforced" },
              { label: "Row-Level Security on workspace-scoped tables", state: "enforced" },
              { label: "Service-role key server-side only (never sent to client)", state: "enforced" },
              { label: "All admin actions written to audit log", state: "enforced" },
              { label: "Destructive actions require confirmation", state: "enforced" },
              { label: "Impersonation / login-as", state: "disabled" },
            ].map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-2 py-1.5">
                <span className="text-xs text-slate-700">{c.label}</span>
                {c.state === "enforced"
                  ? <Badge variant="success" size="sm">Enforced</Badge>
                  : <Badge variant="default" size="sm">Disabled</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Honest "not monitored" note */}
      <Card className="p-4 border-blue-100 bg-[#EFF6FF]">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Failed-login, rate-limit and IP-block monitoring is not yet wired</p>
            <p className="text-xs text-slate-600 mt-0.5">
              These require a dedicated security-events pipeline (e.g. auth hooks + a WAF/rate-limit log sink). Rather than
              show a fabricated security score or fake blocked IPs, this section reports only what is genuinely tracked today:
              administrative events from the audit log and the platform controls above.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
