"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/quotes/[quoteId] — quote detail (manifest image 43).
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Send, ArrowRightCircle, LayoutGrid, List, MessagesSquare, History, GitBranch } from "lucide-react"
import { SupplierDetailShell, type SupplierDetailTab } from "@/components/supplier-workspace/SupplierDetailShell"
import {
  SupplierStatusBadge, SupplierButton,
  SupplierActionBar, SupplierBanner, SupplierLoadingState,
} from "@/components/supplier-workspace/ui"
import { useSupplierRequests } from "@/features/supplier/requests/data/hooks"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"

// Extracted tab components
import { QuoteOverviewTab } from "@/features/supplier/quotes/components/detail-tabs/QuoteOverviewTab"
import { QuoteLineItemsTab } from "@/features/supplier/quotes/components/detail-tabs/QuoteLineItemsTab"
import { QuoteMessagesTab } from "@/features/supplier/quotes/components/detail-tabs/QuoteMessagesTab"
import { QuoteVersionsTab } from "@/features/supplier/quotes/components/detail-tabs/QuoteVersionsTab"
import { QuoteActivityTab } from "@/features/supplier/quotes/components/detail-tabs/QuoteActivityTab"
import { QuoteApprovalWorkflow } from "@/features/supplier/quotes/components/QuoteApprovalWorkflow"

export default function SupplierQuoteDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const { data: requests, loading } = useSupplierRequests()
  const { isTeam } = useSupplierPlan()
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const row = useMemo(
    () => requests.find((r) => r.quoteId === quoteId || r.id === quoteId) ?? null,
    [requests, quoteId]
  )

  if (loading && !row) {
    return <div className="py-6"><SupplierLoadingState rows={5} /></div>
  }

  const r = row
  const reviseHref = r ? `/supplier/quotes/new?requestId=${encodeURIComponent(r.id)}` : "/supplier/quotes/new"
  const accepted = r?.quoteStatus === "accepted"

  const tabs: SupplierDetailTab[] = [
    {
      key: "overview", label: "Overview", icon: LayoutGrid,
      render: () => (
        <div className="space-y-4">
          <QuoteOverviewTab request={r} />
          {isTeam && <QuoteApprovalWorkflow />}
        </div>
      ),
    },
    {
      key: "lineitems", label: "Line Items", icon: List, count: r?.lineItems.length || undefined,
      render: () => <QuoteLineItemsTab request={r} reviseHref={reviseHref} />,
    },
    {
      key: "messages", label: "Messages", icon: MessagesSquare, count: r?.messages.length || undefined,
      render: () => <QuoteMessagesTab request={r} />,
    },
    {
      key: "versions", label: "Versions", icon: GitBranch, count: r?.versions.length || undefined,
      render: () => <QuoteVersionsTab request={r} />,
    },
    {
      key: "activity", label: "Activity", icon: History,
      render: () => <QuoteActivityTab request={r} />,
    },
  ]

  return (
    <>
      {banner && (
        <div className="mb-3">
          <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>
        </div>
      )}
      <SupplierDetailShell
        backHref="/supplier/requests?tab=quoted"
        backLabel="Back to quotes"
        title={r ? `Quote · ${r.serviceTitle}` : `Quote ${String(quoteId).slice(0, 8)}`}
        subtitle={r ? `${r.ref} · ${r.requesterCompany}` : "Quote you've submitted"}
        status={
          r?.quoteStatus ? (
            <SupplierStatusBadge status={r.quoteStatus} />
          ) : (
            <SupplierStatusBadge tone="slate">Draft</SupplierStatusBadge>
          )
        }
        tabs={tabs}
        actionBar={
          <SupplierActionBar>
            <Link href={reviseHref}>
              <SupplierButton variant="outline"><Send className="w-4 h-4" /> Revise quote</SupplierButton>
            </Link>
            {accepted ? (
              <Link href="/supplier/jobs">
                <SupplierButton><ArrowRightCircle className="w-4 h-4" /> View job</SupplierButton>
              </Link>
            ) : (
              <span title="A job is created automatically once the client accepts this quote.">
                <SupplierButton disabled>
                  <ArrowRightCircle className="w-4 h-4" /> Awaiting client acceptance
                </SupplierButton>
              </span>
            )}
          </SupplierActionBar>
        }
      />
    </>
  )
}
