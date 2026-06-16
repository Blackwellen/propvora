import { redirect } from "next/navigation"

/* /marketplace/book/[listingId] — a stable, shareable "book this" entry point
   that resolves into the real checkout draft flow. Keeping it as its own route
   means booking links survive even if the checkout internals change. */

export const dynamic = "force-dynamic"

export default async function BookPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params
  redirect(`/marketplace/checkout/${listingId}`)
}
