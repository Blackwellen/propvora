import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, CreditCard } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }> }

async function getSubscription(id: string) {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("subscriptions")
      .select("id, workspace_id, plan, status, stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, created_at")
      .eq("id", id)
      .maybeSingle()
    if (!data) return null
    let workspaceName: string | null = null
    try {
      const { data: ws } = await admin.from("workspaces").select("name").eq("id", data.workspace_id as string).maybeSingle()
      workspaceName = (ws?.name as string) ?? null
    } catch { /* ignore */ }
    return { ...data, workspaceName }
  } catch {
    return null
  }
}

export default async function AdminSubscriptionDetailPage({ params }: PageProps) {
  const { id } = await params
  const sub = await getSubscription(id)
  if (!sub) notFound()

  const ws = { name: sub.workspaceName }
  const fields: Array<[string, string]> = [
    ["Plan", (sub.plan as string) ?? "—"],
    ["Status", (sub.status as string) ?? "—"],
    ["Period start", sub.current_period_start ? new Date(sub.current_period_start as string).toLocaleDateString("en-GB") : "—"],
    ["Period end", sub.current_period_end ? new Date(sub.current_period_end as string).toLocaleDateString("en-GB") : "—"],
    ["Stripe subscription", (sub.stripe_subscription_id as string) ?? "—"],
    ["Stripe customer", (sub.stripe_customer_id as string) ?? "—"],
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/subscriptions" className="hover:text-[#2563EB] flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Subscriptions</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{ws?.name ?? "Subscription"}</span>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-bold text-slate-900">{ws?.name ?? "Subscription"}</h1>
          <Badge variant="primary" className="capitalize">{(sub.plan as string) ?? "—"}</Badge>
          <Badge variant="default" className="capitalize">{(sub.status as string) ?? "—"}</Badge>
        </div>
        <Link href={`/admin/workspaces/${sub.workspace_id}`} className="text-xs text-[#2563EB] hover:underline">View workspace</Link>
      </Card>

      <Card>
        <CardHeader><CardTitle>Subscription Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fields.map(([l, v]) => (
            <div key={l}>
              <p className="text-xs text-slate-400">{l}</p>
              <p className="text-xs font-medium font-mono text-slate-700 mt-0.5 break-all">{v}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="p-4 border-amber-200 bg-[#FFFBEB]">
        <div className="flex items-start gap-3">
          <CreditCard className="w-4 h-4 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-700">
            Billing event history and amounts come from Stripe. Connect the Stripe billing integration to display invoices and payments here.
          </p>
        </div>
      </Card>

      {sub.stripe_customer_id ? (
        <a href={`https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline">
          <ExternalLink className="w-3.5 h-3.5" /> View customer in Stripe
        </a>
      ) : null}
    </div>
  )
}
