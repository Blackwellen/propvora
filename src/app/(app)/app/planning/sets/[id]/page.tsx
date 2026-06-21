import { redirect } from "next/navigation"

export default async function PlanningSetIndexPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/property-manager/planning/sets/${id}/overview`)
}
