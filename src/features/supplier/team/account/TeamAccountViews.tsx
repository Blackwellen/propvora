"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Team account views — Team / Roles / Billing (29) and Enterprise Security /
   Marketplace / Admin (30). Rendered inside the Account tab hub. Enterprise-
   only controls (SSO, API/webhooks, audit export, governance) are gated on
   isEnterprise. Invite/role/billing/security actions are typed stubs.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import {
  UserPlus, Shield, CreditCard, Download, Trash2, Lock, KeyRound, Webhook, FileText,
  Eye, CheckCircle2, Circle, AlertTriangle, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierStatusBadge } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"

function Mini({ label, value, tone = "slate" }: { label: string; value: string; tone?: "blue" | "emerald" | "amber" | "slate" }) {
  const c = tone === "blue" ? "text-[#2563EB]" : tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"
  return <SupplierCard className="p-3.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><p className={cn("text-lg font-bold mt-1", c)}>{value}</p></SupplierCard>
}

interface Member { id: string; name: string; initials: string; email: string; role: string; status: "active" | "invited"; lastActive: string }
const MEMBERS: Member[] = [
  { id: "m1", name: "Alex Morgan", initials: "AM", email: "alex@morganheating.co.uk", role: "Owner", status: "active", lastActive: new Date().toISOString() },
  { id: "m2", name: "Mike Thompson", initials: "MT", email: "mike@morganheating.co.uk", role: "Dispatcher", status: "active", lastActive: new Date(Date.now() - 3600000).toISOString() },
  { id: "m3", name: "Emma Collins", initials: "EC", email: "emma@morganheating.co.uk", role: "Estimator", status: "active", lastActive: new Date(Date.now() - 7200000).toISOString() },
  { id: "m4", name: "Sarah Ahmed", initials: "SA", email: "sarah@morganheating.co.uk", role: "Worker", status: "active", lastActive: new Date(Date.now() - 86400000).toISOString() },
  { id: "m5", name: "Priya Shah", initials: "PS", email: "priya@morganheating.co.uk", role: "Finance", status: "invited", lastActive: "" },
]
const ROLE_CAPS = [
  { role: "Owner", finance: true, dispatch: true, account: true, jobs: true },
  { role: "Team Admin", finance: true, dispatch: true, account: true, jobs: true },
  { role: "Dispatcher", finance: false, dispatch: true, account: false, jobs: true },
  { role: "Estimator", finance: false, dispatch: false, account: false, jobs: true },
  { role: "Finance", finance: true, dispatch: false, account: false, jobs: false },
  { role: "Worker", finance: false, dispatch: false, account: false, jobs: true },
]

export function TeamRolesBilling() {
  const [toast, setToast] = useState<string | null>(null)
  const [view, setView] = useState<"team" | "roles" | "billing">("team")

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Team members" value={String(MEMBERS.length)} tone="blue" />
        <Mini label="Plan" value="Professional" tone="emerald" />
        <Mini label="Seats used" value="5 / 8" tone="slate" />
        <Mini label="Monthly" value="£2,985" tone="slate" />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5">{([["team", "Team"], ["roles", "Roles"], ["billing", "Billing"]] as const).map(([k, l]) => <button key={k} onClick={() => setView(k)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", view === k ? "bg-[#2563EB] text-white" : "bg-white border border-slate-200 text-slate-600")}>{l}</button>)}</div>
        {view === "team" && <SupplierButton onClick={() => setToast("Invite sent.")}><UserPlus className="w-4 h-4" /> Invite member</SupplierButton>}
        {view === "billing" && <SupplierButton variant="outline" onClick={() => setToast("Opening billing portal…")}><CreditCard className="w-4 h-4" /> Manage billing</SupplierButton>}
      </div>

      {view === "team" && (
        <SupplierCard className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><th className="px-4 py-3 font-semibold">Member</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Last active</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {MEMBERS.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 flex items-center justify-center">{m.initials}</span><span><p className="font-semibold text-slate-800">{m.name}</p><p className="text-[11px] text-slate-400">{m.email}</p></span></span></td>
                  <td className="px-4 py-3"><SupplierStatusBadge tone="slate">{m.role}</SupplierStatusBadge></td>
                  <td className="px-4 py-3">{m.status === "active" ? <span className="text-[11px] font-semibold text-emerald-600">Active</span> : <span className="text-[11px] font-semibold text-amber-600">Invited</span>}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{m.lastActive ? shortDate(m.lastActive) : "—"}</td>
                  <td className="px-4 py-3 text-right"><span className="inline-flex gap-1"><button onClick={() => setToast(`Editing ${m.name}'s role…`)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Edit role"><Shield className="w-4 h-4" /></button>{m.role !== "Owner" && <button onClick={() => setToast(`${m.name} removed.`)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SupplierCard>
      )}

      {view === "roles" && (
        <SupplierCard className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold text-center">Finance</th><th className="px-4 py-3 font-semibold text-center">Dispatch</th><th className="px-4 py-3 font-semibold text-center">Account</th><th className="px-4 py-3 font-semibold text-center">Jobs</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {ROLE_CAPS.map((r) => (
                <tr key={r.role}><td className="px-4 py-3 font-semibold text-slate-800">{r.role}</td><td className="px-4 py-3 text-center"><Cap ok={r.finance} /></td><td className="px-4 py-3 text-center"><Cap ok={r.dispatch} /></td><td className="px-4 py-3 text-center"><Cap ok={r.account} /></td><td className="px-4 py-3 text-center"><Cap ok={r.jobs} /></td></tr>
              ))}
            </tbody>
          </table>
        </SupplierCard>
      )}

      {view === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Subscription</h2>
            <p className="text-2xl font-bold text-slate-900">Professional</p>
            <p className="text-sm text-slate-500">£2,985 / month · 8 seats · renews {shortDate(new Date(Date.now() + 20 * 86400000).toISOString())}</p>
            <div className="mt-3 flex gap-2"><SupplierButton variant="outline" onClick={() => setToast("Plan change started.")}>Upgrade plan</SupplierButton><SupplierButton variant="ghost" onClick={() => setToast("Invoice downloaded.")}><Download className="w-4 h-4" /> Invoices</SupplierButton></div>
          </SupplierCard>
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Recent invoices</h2>
            <ul className="divide-y divide-slate-50 text-sm">
              {["May 2025", "Apr 2025", "Mar 2025"].map((p) => (
                <li key={p} className="flex items-center justify-between py-2"><span className="text-slate-600">{p}</span><span className="flex items-center gap-3"><span className="font-semibold text-slate-800">£2,985.00</span><button onClick={() => setToast("Invoice downloaded.")} className="text-slate-400 hover:text-slate-600"><Download className="w-4 h-4" /></button></span></li>
              ))}
            </ul>
          </SupplierCard>
        </div>
      )}
    </div>
  )
}

function Cap({ ok }: { ok: boolean }) { return ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" /> : <Circle className="w-4 h-4 text-slate-200 inline" /> }

/* ── 30. Enterprise security / marketplace / admin ──────────────────────────── */

const AUDIT = [
  { id: "a1", actor: "Alex Morgan", action: "Updated role: Emma → Estimator", at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "a2", actor: "System", action: "Insurance certificate approved", at: new Date(Date.now() - 26 * 3600000).toISOString() },
  { id: "a3", actor: "Mike Thompson", action: "Exported finance report", at: new Date(Date.now() - 50 * 3600000).toISOString() },
]

export function EnterpriseSettings() {
  const [toast, setToast] = useState<string | null>(null)
  const [visible, setVisible] = useState(true)
  const { isEnterprise } = useSupplierPlan()

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Marketplace visibility */}
        <SupplierCard className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><Eye className="w-4 h-4 text-slate-400" /> Marketplace visibility</h2><p className="text-xs text-slate-400 mt-0.5">{visible ? "Your listing is live to customers" : "Hidden from the marketplace"}</p></div>
            <button onClick={() => { setVisible((v) => !v); setToast(visible ? "Listing hidden." : "Listing live.") }} role="switch" aria-checked={visible} className={cn("relative w-12 h-7 rounded-full transition-colors shrink-0", visible ? "bg-emerald-500" : "bg-slate-300")}><span className={cn("absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform", visible && "translate-x-5")} /></button>
          </div>
          <a href="/marketplace/suppliers/morgan-heating-plumbing" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">Preview public listing <ChevronRight className="w-3.5 h-3.5" /></a>
        </SupplierCard>

        {/* Security overview */}
        <SupplierCard className="p-5">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-3"><Shield className="w-4 h-4 text-emerald-500" /> Security overview <SupplierStatusBadge tone="emerald">92%</SupplierStatusBadge></h2>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center gap-2 text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500" />2FA enforced for admins</li>
            <li className="flex items-center gap-2 text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Role-based access control</li>
            <li className="flex items-center gap-2 text-slate-400"><Circle className="w-4 h-4 text-slate-300" />SSO not configured</li>
          </ul>
        </SupplierCard>
      </div>

      {/* Enterprise admin controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <AdminCard icon={KeyRound} title="Single sign-on (SSO)" desc="SAML / OIDC for your team." enterprise={isEnterprise} onClick={() => setToast("Configuring SSO…")} />
        <AdminCard icon={Webhook} title="API & webhooks" desc="Programmatic access & events." enterprise={isEnterprise} onClick={() => setToast("Managing API keys…")} />
        <AdminCard icon={FileText} title="Data export" desc="Export workspace data (GDPR)." enterprise={isEnterprise} onClick={() => setToast("Export queued.")} />
      </div>

      {/* Audit log */}
      <SupplierCard className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-900">Audit log</h2><SupplierButton size="sm" variant="ghost" onClick={() => setToast("Audit log exported.")}><Download className="w-3.5 h-3.5" /> Export</SupplierButton></div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-50">
            {AUDIT.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/60"><td className="px-4 py-2.5 font-medium text-slate-700">{a.actor}</td><td className="px-4 py-2.5 text-slate-600">{a.action}</td><td className="px-4 py-2.5 text-slate-400 text-xs text-right">{shortDate(a.at)}</td></tr>
            ))}
          </tbody>
        </table>
      </SupplierCard>

      {/* Danger zone */}
      <SupplierCard className="p-5 border-red-100">
        <h2 className="text-sm font-semibold text-red-700 flex items-center gap-1.5 mb-2"><AlertTriangle className="w-4 h-4" /> Danger zone</h2>
        <div className="flex items-center justify-between gap-3"><p className="text-sm text-slate-600">Transfer ownership or close this workspace.</p><SupplierButton variant="outline" onClick={() => setToast("This requires owner confirmation.")}><Lock className="w-4 h-4" /> Manage</SupplierButton></div>
      </SupplierCard>
    </div>
  )
}

function AdminCard({ icon: Icon, title, desc, enterprise, onClick }: { icon: typeof KeyRound; title: string; desc: string; enterprise: boolean; onClick: () => void }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-start justify-between"><span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"><Icon className="w-4 h-4" /></span>{!enterprise && <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 rounded-full px-1.5 py-0.5 inline-flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />Enterprise</span>}</div>
      <p className="text-sm font-semibold text-slate-900 mt-2">{title}</p>
      <p className="text-xs text-slate-400">{desc}</p>
      <SupplierButton size="sm" variant="outline" className="mt-3 w-full justify-center" disabled={!enterprise} onClick={onClick}>{enterprise ? "Configure" : "Upgrade to enable"}</SupplierButton>
    </SupplierCard>
  )
}
