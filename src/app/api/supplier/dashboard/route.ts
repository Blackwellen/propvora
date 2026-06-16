import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import { listSupplierJobs } from "@/lib/supplier/jobs"
import { listLeads, countOpenLeads } from "@/lib/supplier/leads"
import { listPayouts, summarisePayouts } from "@/lib/supplier/payouts"
import { listInvoices, summariseInvoices } from "@/lib/supplier/invoices"
import { getSupplierProfile } from "@/lib/supplier/profile"
import { getStatusSummary } from "@/lib/supplier-verification"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ACTIVE_JOB = new Set(["assigned", "accepted", "in_progress"])

/**
 * GET /api/supplier/dashboard?workspaceId=...
 * One aggregate call powering the supplier dashboard KPIs — every number is
 * derived from a real query (no invented figures). Each underlying source is
 * 42P01-tolerant, so a not-yet-provisioned table contributes 0 rather than 500.
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const [jobs, leads, payouts, invoices, profile, verification] = await Promise.all([
      listSupplierJobs(supabase, workspaceId, "supplier"),
      listLeads(supabase, workspaceId),
      listPayouts(supabase, workspaceId),
      listInvoices(supabase, workspaceId),
      getSupplierProfile(supabase, workspaceId),
      getStatusSummary(workspaceId).catch(() => null),
    ])

    const payoutSummary = summarisePayouts(payouts)
    const invoiceSummary = summariseInvoices(invoices)
    const activeJobs = jobs.filter((j) => ACTIVE_JOB.has(j.status))
    const unscheduledJobs = activeJobs.filter((j) => !j.scheduled_for)

    return NextResponse.json({
      kpis: {
        openLeads: countOpenLeads(leads),
        activeJobs: activeJobs.length,
        unscheduledJobs: unscheduledJobs.length,
        completedJobs: jobs.filter((j) => j.status === "completed").length,
        payoutsPendingPence: payoutSummary.pendingPence,
        payoutsPaidPence: payoutSummary.paidPence,
        invoicesOutstandingPence: invoiceSummary.outstandingPence,
        invoicesCurrency: invoiceSummary.currency,
        verificationLevel: verification?.level ?? 0,
        verificationLabel: verification?.levelLabel ?? "Unverified",
        hasValidInsurance: verification?.hasValidInsurance ?? false,
        insuranceExpiringSoon: verification?.insuranceExpiringSoon ?? false,
        licenceExpiringSoon: verification?.licenceExpiringSoon ?? false,
        status: profile?.status ?? "draft",
        currency: payoutSummary.currency,
      },
      activeJobs: activeJobs.slice(0, 6),
      verification,
    })
  } catch (err) {
    captureException(err, { source: "api/supplier/dashboard GET", requestId })
    return NextResponse.json({ error: "Failed to load dashboard", requestId }, { status: 500 })
  }
}
