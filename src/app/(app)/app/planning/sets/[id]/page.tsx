import { redirect } from "next/navigation"

export default async function PlanningSetIndexPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/app/planning/sets/${id}/overview`)
}
