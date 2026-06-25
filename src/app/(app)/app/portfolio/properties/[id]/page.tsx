import { redirect } from "next/navigation"

export default async function PropertyDetailIndexPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/property-manager/portfolio/properties/${id}/overview`)
}
