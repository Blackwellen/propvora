import { ManagedEscrowDetailView } from "@/features/escrow/components/ManagedEscrowDetailView"

type View = "overview" | "evidence" | "release" | "dispute"
const VALID: View[] = ["overview", "evidence", "release", "dispute"]

export default async function MoneyEscrowSubViewPage({ params }: { params: Promise<{ escrowId: string; view: string }> }) {
  const { escrowId, view } = await params
  const initialView = (VALID.includes(view as View) ? view : "overview") as View
  return <ManagedEscrowDetailView escrowId={decodeURIComponent(escrowId)} initialView={initialView} />
}
