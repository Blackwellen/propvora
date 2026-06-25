import { redirect } from "next/navigation"

export default async function UnitEditRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/property-manager/portfolio/units/${id}`)
}
