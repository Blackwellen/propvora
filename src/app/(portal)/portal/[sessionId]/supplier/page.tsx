import Link from "next/link"
import {
  Briefcase, Wrench, AlertCircle, FileText, PoundSterling, Wallet, Building2,
  CalendarClock, MessageSquare, FolderOpen, ShieldCheck, Upload, ArrowRight, CheckCircle2, AlertTriangle,
} from "lucide-react"
import { requirePortalSession } from "../_guard"
import { getSupplierJobs, getSupplierInvoices } from "@/lib/portal/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatMoney, formatDate, jobStatusMeta, isOpenJob } from "@/lib/portal/format"
import {
  PortalSectionCard, PortalKpiStrip, StatusChip, PortalEmptyState,
  PortalButtonLink, type PortalKpi, type PortalTone,
} from "@/components/portals/portal-ui"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening" }

export default async function SupplierPortalHome({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`
  const [jobs, invoices] = await Promise.all([getSupplierJobs(session), getSupplierInvoices(session)])

  const inProgress = jobs.filter((j) => j.status === "in_progress").length
  const awaitingQuote = jobs.filter((j) => ["supplier_requested", "scoped"].includes(j.status)).length
  const unpaid = invoices.filter((i) => ["submitted", "reviewing", "approved"].includes(i.status))
  const earnings = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount ?? 0), 0)
  const nextPayout = invoices.filter((i) => i.status === "approved").reduce((s, i) => s + (i.amount ?? 0), 0)
  const activeJobs = jobs.filter((j) => isOpenJob(j.status)).slice(0, 4)
  const upcoming = jobs.filter((j) => j.scheduled_date).slice(0, 3)

  // Fetch real certifications from supplier_compliance
  type CertRow = { id: string; compliance_type: string; expiry_date: string | null; verified: boolean }
  let certifications: CertRow[] = []
  if (session.contactId) {
    try {
      const admin = createAdminClient()
      const { data } = await admin.from("supplier_compliance")
        .select("id, compliance_type, expiry_date, verified")
        .eq("workspace_id", session.workspaceId)
        .eq("supplier_id", session.contactId)
        .order("expiry_date", { ascending: true })
        .limit(5)
      certifications = (data ?? []) as CertRow[]
    } catch { /* tolerate missing table */ }
  }

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const kpis: PortalKpi[] = [
    { label: "Assigned jobs", value: String(jobs.length), icon: Briefcase, tone: "blue", href: `${base}/jobs` },
    { label: "In progress", value: String(inProgress), icon: Wrench, tone: "blue", href: `${base}/jobs` },
    { label: "Awaiting quote", value: String(awaitingQuote), icon: AlertCircle, tone: "amber", href: `${base}/jobs` },
    { label: "Unpaid invoices", value: String(unpaid.length), icon: FileText, tone: unpaid.length ? "red" : "emerald", href: `${base}/invoices` },
    { label: "Earnings paid", value: formatMoney(earnings), icon: PoundSterling, tone: "emerald", href: `${base}/payments` },
    { label: "Next payout due", value: formatMoney(nextPayout), icon: Wallet, tone: "violet", href: `${base}/payments` },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[#071B4D]">{greeting()}</h1><p className="text-sm text-slate-500 mt-0.5">{today}</p></div>
      <PortalKpiStrip kpis={kpis} cols={6} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PortalSectionCard title="Active jobs" icon={Briefcase} viewAllHref={`${base}/jobs`}>
            {activeJobs.length === 0 ? <PortalEmptyState icon={Briefcase} title="No active jobs" description="Jobs assigned to you appear here." /> : (
              <div className="space-y-3">
                {activeJobs.map((job) => {
                  const meta = jobStatusMeta(job.status)
                  const tone: PortalTone = meta.variant === "success" ? "emerald" : meta.variant === "warning" ? "amber" : "blue"
                  const amount = job.approved_amount ?? job.quoted_amount
                  const pct = job.status === "complete" || job.status === "invoiced" ? 100 : job.status === "in_progress" ? 60 : job.status === "scheduled" ? 35 : 15
                  return (
                    <Link key={job.id} href={`${base}/jobs/${job.id}`} className="block rounded-xl border border-[#EEF3FB] hover:border-[#CFE0FB] hover:bg-[#F8FBFF] p-3.5 transition-colors">
                      <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-[#071B4D] truncate">{job.title}</p><StatusChip tone={tone} dot>{meta.label}</StatusChip></div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap"><span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.propertyLabel || "—"}</span>{job.scheduled_date && <span className="flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" />{formatDate(job.scheduled_date)}</span>}{amount != null && <span className="flex items-center gap-1"><PoundSterling className="w-3.5 h-3.5" />{formatMoney(amount)}</span>}</div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2.5"><div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${pct}%` }} /></div>
                    </Link>
                  )
                })}
              </div>
            )}
          </PortalSectionCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PortalSectionCard title="Invoice summary" icon={FileText} viewAllHref={`${base}/invoices`}>
              <dl className="space-y-2 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Awaiting payment</dt><dd className="font-semibold text-amber-600">{formatMoney(unpaid.reduce((s, i) => s + (i.amount ?? 0), 0))}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Paid out</dt><dd className="font-semibold text-emerald-600">{formatMoney(earnings)}</dd></div></dl>
            </PortalSectionCard>
            <PortalSectionCard title="Quote requests" icon={AlertCircle} viewAllHref={`${base}/jobs`}>
              <p className="text-sm text-slate-600">{awaitingQuote} job{awaitingQuote === 1 ? "" : "s"} awaiting your quote.</p>
            </PortalSectionCard>
          </div>
        </div>
        <div className="space-y-4">
          <PortalSectionCard title="Upcoming visits" icon={CalendarClock}>
            {upcoming.length === 0 ? <p className="text-xs text-slate-400">No scheduled visits.</p> : <ul className="space-y-2">{upcoming.map((j) => <li key={j.id} className="text-sm"><p className="font-semibold text-[#071B4D] truncate">{j.title}</p><p className="text-[11px] text-slate-400">{formatDate(j.scheduled_date)}</p></li>)}</ul>}
          </PortalSectionCard>
          <PortalSectionCard title="Recently shared documents" icon={FolderOpen} viewAllHref={`${base}/documents`}>
            <PortalButtonLink href={`${base}/documents`} variant="ghost" className="w-full justify-center">View documents</PortalButtonLink>
          </PortalSectionCard>
          <PortalSectionCard title="Certification & compliance" icon={ShieldCheck}>
            {certifications.length === 0 ? (
              <PortalEmptyState icon={ShieldCheck} title="No certifications on record" description="Your manager will add your certifications here." />
            ) : (
              <ul className="space-y-2 text-sm">{certifications.map((c) => {
                const expired = c.expiry_date ? new Date(c.expiry_date) < new Date() : false
                const label = c.compliance_type.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase())
                return (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 truncate">{label}</span>
                    <StatusChip tone={expired ? "red" : c.verified ? "emerald" : "amber"}>
                      {expired ? <><AlertTriangle className="w-3 h-3 inline" /> Expired</> : c.verified ? <><CheckCircle2 className="w-3 h-3 inline" /> Valid</> : "Pending"}
                    </StatusChip>
                  </li>
                )
              })}</ul>
            )}
            <PortalButtonLink href={`${base}/messages`} variant="ghost" className="mt-2 w-full justify-center">Contact manager about certs</PortalButtonLink>
          </PortalSectionCard>
        </div>
      </div>

      <PortalSectionCard title="Quick actions" icon={ArrowRight}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[["View jobs", `${base}/jobs`, Briefcase], ["Submit invoice", `${base}/invoices`, FileText], ["Upload document", `${base}/documents`, Upload], ["Message manager", `${base}/messages`, MessageSquare]].map(([l, h, I]) => {
            const Icon = I as typeof Briefcase
            return <Link key={l as string} href={h as string} className="flex flex-col items-center gap-2 rounded-xl border border-[#EEF3FB] hover:bg-[#F8FBFF] py-4 text-center"><span className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center"><Icon className="w-5 h-5" /></span><span className="text-[12px] font-semibold text-[#071B4D]">{l as string}</span></Link>
          })}
        </div>
      </PortalSectionCard>
    </div>
  )
}
