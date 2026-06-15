import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
export default function LedgerIndexPage() {
  redirect("/app/accounting/ledger/chart")
}
