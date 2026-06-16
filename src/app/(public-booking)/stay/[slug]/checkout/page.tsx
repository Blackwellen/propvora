import { redirect } from "next/navigation"

export default async function StayCheckoutAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/booking/checkout/${encodeURIComponent(slug)}`)
}
