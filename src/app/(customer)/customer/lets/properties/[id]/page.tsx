import LetDetail from "@/features/customer/lets/LetDetail"
import { findLet, recommendedLets } from "@/features/customer/data/lets"

export const metadata = { title: "Property · Propvora" }

export default async function CustomerLetDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = findLet(id) ?? recommendedLets[0]
  return <LetDetail p={property} />
}
