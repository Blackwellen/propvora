import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Building2, Activity, ChevronRight, Shield } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { getUserDetail } from "@/lib/admin/data"
import UserAdminActions from "./UserAdminActions"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }> }

function roleBadge(role: string) {
  if (role === "platform_admin") return <Badge variant="ai">Platform admin</Badge>
  if (role === "support")        return <Badge variant="primary">Support</Badge>
  return <Badge variant="default">User</Badge>
}

function initials(name: string | null, email: string | null) {
  const base = name || email || "?"
  return base.split(/[\s@.]+/).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2)
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getUserDetail(id)
  if (!user) notFound()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/users" className="hover:text-[#2563EB] flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Users</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{user.name ?? user.email ?? "User"}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Header */}
          <Card className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white text-sm font-bold flex items-center justify-center shrink-0">
                {initials(user.name, user.email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-slate-900">{user.name ?? "—"}</h1>
                  {roleBadge(user.role)}
                </div>
                <p className="text-sm text-slate-500">{user.email ?? ""}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                  <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}</span>
                  {user.phone ? <><span>•</span><span>{user.phone}</span></> : null}
                  <span>•</span>
                  <span>{user.memberships.length} workspace{user.memberships.length === 1 ? "" : "s"}</span>
                  <span>•</span>
                  <span className="font-mono">{user.id}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Memberships (live) */}
          <Card noPadding>
            <div className="px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-slate-900">Workspace Memberships</h3>
            </div>
            {user.memberships.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">Not a member of any workspace</div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {user.memberships.map((m) => (
                  <div key={m.workspaceId} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{m.workspaceName}</p>
                        <div className="flex gap-2 mt-0.5">
                          <Badge variant="outline" size="sm">{m.role}</Badge>
                          <span className="text-[10px] text-slate-400">Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("en-GB") : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/admin/workspaces/${m.workspaceId}`}>
                      <Button variant="ghost" size="xs" rightIcon={<ChevronRight className="w-3 h-3" />}>View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Activity / audit (live) */}
          <Card>
            <CardHeader><CardTitle>Recent Activity (Audit)</CardTitle></CardHeader>
            <CardContent>
              {user.recentAudit.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No audit events recorded for this user.</p>
              ) : (
                <div className="space-y-2.5">
                  {user.recentAudit.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                        <Activity className="w-3 h-3 text-[#2563EB]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-medium text-slate-700">{e.action}</p>
                        <p className="text-[11px] text-slate-400">{e.workspaceName ?? ""}</p>
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
        </div>

        {/* Right rail */}
        <div className="w-full lg:w-56 shrink-0 space-y-4">
          <Card className="p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Admin Actions</h3>
            <UserAdminActions userId={user.id} userName={user.name ?? user.email ?? "this user"} />
            <p className="text-[10px] text-slate-400 mt-3">Suspension is enforced at the auth layer and written to the audit log.</p>
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" /> Login-as
            </h3>
            <p className="text-xs text-slate-400">
              Impersonation / login-as is intentionally not available. It is a security-sensitive capability held back from V1.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
