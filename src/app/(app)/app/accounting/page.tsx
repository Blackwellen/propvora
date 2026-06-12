import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
export default function AccountingPage() {
  redirect("/app/accounting/accounts/overview")
}
