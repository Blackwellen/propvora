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

function tolerableCode(err: unknown): boolean {
  const c = (err as { code?: string } | null)?.code
  return c === "42P01" || c === "42703" || c === "PGRST205"
}

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

    // Fetch reviews safely (table may not exist yet).
    const avgReviewScore = await (async (): Promise<number | null> => {
      try {
        const { data, error } = await supabase
          .from("supplier_reviews")
          .select("rating")
          .eq("supplier_workspace_id", workspaceId)
        if (error) { if (tolerableCode(error)) return null; throw error }
        const rows = (data as Array<{ rating: number }> | null) ?? []
        if (rows.length === 0) return null
        const sum = rows.reduce((acc, r) => acc + (r.rating ?? 0), 0)
        return Math.round((sum / rows.length) * 10) / 10
      } catch (e) { if (tolerableCode(e)) return null; throw e }
    })()

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

    // Monthly earnings: paid invoices where paid_at is in the current calendar month.
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthlyEarningsPence = invoices
      .filter((inv) => inv.status === "paid" && inv.paid_at && inv.paid_at >= monthStart && inv.amount_pence != null)
      .reduce((acc, inv) => acc + (inv.amount_pence ?? 0), 0)

    // Response rate: % of quote-request leads responded to in last 30 days.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const recentLeadRequests = leads.filter((l) => l.source === "quote_request" && l.createdAt >= thirtyDaysAgo)
    const responded = recentLeadRequests.filter((l) => {
      const s = (l.status ?? "").toLowerCase()
      return s !== "requested" && s !== "new" && s !== "open"
    })
    const responseRatePct = recentLeadRequests.length > 0
      ? Math.round((responded.length / recentLeadRequests.length) * 100)
      : 100 // 100% if no requests (nothing to miss)

    // Calendar strip: jobs scheduled in the next 7 days.
    const todayStr = now.toISOString().slice(0, 10)
    const sevenDaysLater = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
    const calendarEntries = jobs
      .filter((j) => j.scheduled_for && j.scheduled_for >= todayStr && j.scheduled_for <= sevenDaysLater + "T23:59:59Z")
      .map((j) => ({
        date: (j.scheduled_for as string).slice(0, 10),
        label: `Job ${j.id.slice(0, 8)}`,
        href: `/supplier/jobs/${j.id}`,
        status: j.status,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Recent leads: latest 5, newest first.
    const recentLeads = leads.slice(0, 5).map((l) => ({
      id: l.id,
      title: l.title,
      source: l.source,
      status: l.status,
      amountPence: l.amountPence,
      currency: l.currency,
      createdAt: l.createdAt,
      quoteId: l.quoteId,
    }))

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
        monthlyEarningsPence,
        responseRatePct,
        avgReviewScore,
      },
      activeJobs: activeJobs.slice(0, 6),
      calendarEntries,
      recentLeads,
      verification,
    })
  } catch (err) {
    captureException(err, { source: "api/supplier/dashboard GET", requestId })
    return NextResponse.json({ error: "Failed to load dashboard", requestId }, { status: 500 })
  }
}
