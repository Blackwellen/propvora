import { QuoteRequestCheckout } from "@/features/checkout/screens/QuoteRequestCheckout"

export const dynamic = "force-dynamic"

export default async function PublicQuoteRequestCheckoutPage({
  params,
}: {
  params: Promise<{ quoteRequestId: string }>
}) {
  const { quoteRequestId } = await params
  return <QuoteRequestCheckout quoteRequestId={quoteRequestId} />
}
