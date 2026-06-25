import { redirect } from "next/navigation"

export default async function UnitDetailIndexPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/property-manager/portfolio/units/${id}/overview`)
}
