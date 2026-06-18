import { QuoteComparisonView } from "@/features/orders/components/QuoteComparisonView"

export default async function QuoteComparisonPage({ params }: { params: Promise<{ quoteRequestId: string }> }) {
  const { quoteRequestId } = await params
  return <QuoteComparisonView quoteRequestId={decodeURIComponent(quoteRequestId)} />
}
