import { redirect } from "next/navigation"

export default async function TenancyDetailIndexPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/property-manager/portfolio/tenancies/${id}/overview`)
}
