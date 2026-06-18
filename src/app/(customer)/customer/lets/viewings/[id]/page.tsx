import ViewingDetail from "@/features/customer/lets/ViewingDetail"
import { findViewing, viewings } from "@/features/customer/data/lets"

export const metadata = { title: "Viewing · Propvora" }

export default async function CustomerViewingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const viewing = findViewing(id) ?? viewings[0]
  return <ViewingDetail v={viewing} />
}
