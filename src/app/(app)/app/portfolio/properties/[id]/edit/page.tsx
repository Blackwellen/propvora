import { redirect } from "next/navigation"

export default async function PropertyEditRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/property-manager/portfolio/properties/${id}`)
}
