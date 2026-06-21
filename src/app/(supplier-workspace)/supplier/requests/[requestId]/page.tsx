"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/requests/[requestId] — request detail (manifest image 40).
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Send, ThumbsDown } from "lucide-react"
import { SupplierDetailShell, type SupplierDetailTab } from "@/components/supplier-workspace/SupplierDetailShell"
import {
  SupplierStatusBadge, SupplierButton,
  SupplierActionBar, SupplierBanner, SupplierLoadingState,
} from "@/components/supplier-workspace/ui"
import { useSupplierRequests } from "@/features/supplier/requests/data/hooks"
import { makeBlankPipelineRequest } from "@/features/supplier/requests/data/blank"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { UrgencyBadge } from "@/features/supplier/requests/components/primitives"

// Extracted tab components
import { RequestOverviewTab } from "@/features/supplier/requests/components/detail-tabs/RequestOverviewTab"
import { RequestScopeTab } from "@/features/supplier/requests/components/detail-tabs/RequestScopeTab"
import { RequestFilesTab } from "@/features/supplier/requests/components/detail-tabs/RequestFilesTab"
import { RequestMessagesTab } from "@/features/supplier/requests/components/detail-tabs/RequestMessagesTab"
import { RequestQuoteTab } from "@/features/supplier/requests/components/detail-tabs/RequestQuoteTab"
import { RequestTimelineTab } from "@/features/supplier/requests/components/detail-tabs/RequestTimelineTab"
import { RequestAiAssistant } from "@/features/supplier/requests/components/RequestAiAssistant"

import {
  LayoutGrid, CheckCircle2, Files, MessagesSquare, FileText, History,
} from "lucide-react"

export default function SupplierRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const { data: requests, loading } = useSupplierRequests()
  const { isTeam } = useSupplierPlan()
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)

  const req = useMemo(
    () => requests.find((r) => r.id === requestId || r.ref === requestId) ?? null,
    [requests, requestId]
  )

  if (loading && !req) {
    return <div className="py-6"><SupplierLoadingState rows={5} /></div>
  }

  const r = req ?? makeBlankPipelineRequest({ id: String(requestId), ref: String(requestId) })
  const newQuoteHref = `/supplier/quotes/new?requestId=${encodeURIComponent(r.id)}`

  const tabs: SupplierDetailTab[] = [
    {
      key: "overview", label: "Overview", icon: LayoutGrid,
      render: () => <RequestOverviewTab request={r} isTeam={isTeam} />,
    },
    {
      key: "scope", label: "Scope", icon: CheckCircle2,
      render: () => <RequestScopeTab request={r} />,
    },
    {
      key: "files", label: "Files", icon: Files, count: r.files.length || undefined,
      render: () => <RequestFilesTab request={r} />,
    },
    {
      key: "messages", label: "Messages", icon: MessagesSquare, count: r.messages.length || undefined,
      render: () => <RequestMessagesTab request={r} />,
    },
    {
      key: "quote", label: "Quote", icon: FileText,
      render: () => <RequestQuoteTab request={r} newQuoteHref={newQuoteHref} />,
    },
    {
      key: "timeline", label: "Timeline", icon: History,
      render: () => <RequestTimelineTab request={r} />,
    },
  ]

  return (
    <>
      {banner && (
        <div className="mb-3">
          <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
        <SupplierDetailShell
          backHref="/supplier/requests"
          backLabel="Back to requests"
          title={r.serviceTitle}
          subtitle={`${r.ref} · ${r.requesterCompany}`}
          status={
            <div className="flex items-center gap-2">
              {r.quoteStatus ? (
                <SupplierStatusBadge status={r.quoteStatus} />
              ) : (
                <SupplierStatusBadge tone="sky">New request</SupplierStatusBadge>
              )}
              <UrgencyBadge urgency={r.urgency} />
            </div>
          }
          tabs={tabs}
          actionBar={
            <SupplierActionBar>
              <SupplierButton variant="outline" onClick={() => setBanner({ tone: "emerald", msg: "Request declined." })}>
                <ThumbsDown className="w-4 h-4" /> Decline
              </SupplierButton>
              <Link href={newQuoteHref}>
                <SupplierButton>
                  <Send className="w-4 h-4" /> {r.quoteId ? "Revise quote" : "Build quote"}
                </SupplierButton>
              </Link>
            </SupplierActionBar>
          }
        />

        {/* Quote assistant rail — extracted */}
        <aside className="hidden xl:block sticky top-4 space-y-4">
          <RequestAiAssistant request={r} newQuoteHref={newQuoteHref} />
        </aside>
      </div>
    </>
  )
}
