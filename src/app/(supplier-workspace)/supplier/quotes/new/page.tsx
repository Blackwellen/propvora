"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/quotes/new — route-backed Quote Builder (manifest images 41 & 42).

   Wraps the existing <QuoteBuilderWizard/> (the fullscreen pricing → scope →
   review flow) as a standalone route so a supplier can start a quote from
   anywhere, not just the Requests pipeline drawer. Two entry shapes:

     • /supplier/quotes/new?requestId=<id>   — seed from a live/seed request
     • /supplier/quotes/new                   — blank standalone quote

   `?step=` (scope | pricing-send) is accepted for deep-linking the wizard step,
   matching the manifest routes; the wizard owns its own step state thereafter.
   On close/submit we return to the Requests pipeline.
─────────────────────────────────────────────────────────────────────────── */

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { QuoteBuilderWizard } from "@/features/supplier/requests/components/QuoteBuilderWizard"
import { RequestsToastProvider } from "@/features/supplier/requests/components/primitives"
import { useSupplierRequests } from "@/features/supplier/requests/data/hooks"
import { SupplierLoadingState } from "@/components/supplier-workspace/ui"
import { makeBlankPipelineRequest } from "@/features/supplier/requests/data/blank"

// useSearchParams requires a Suspense boundary so the route opts out of static
// prerender (it's a client wizard with no static form).
export default function SupplierNewQuotePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-10"><SupplierLoadingState rows={4} /></div>}>
      <NewQuoteInner />
    </Suspense>
  )
}

function NewQuoteInner() {
  const router = useRouter()
  const params = useSearchParams()
  const requestId = params.get("requestId")

  // Load the pipeline so we can seed the wizard from an existing request when a
  // requestId is supplied. Standalone quotes use a blank scaffold.
  const { data: requests, loading } = useSupplierRequests()

  if (requestId && loading) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <SupplierLoadingState rows={4} />
      </div>
    )
  }

  const seeded = requestId ? requests.find((r) => r.id === requestId || r.ref === requestId) : null
  const request = seeded ?? makeBlankPipelineRequest()

  const back = () => router.push("/supplier/requests")

  return (
    <RequestsToastProvider>
      <QuoteBuilderWizard request={request} mode="new" onClose={back} onSubmitted={back} />
    </RequestsToastProvider>
  )
}
