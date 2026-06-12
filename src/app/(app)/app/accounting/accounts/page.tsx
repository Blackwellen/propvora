import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
export default function AccountsPage() {
  redirect("/app/accounting/accounts/overview")
}
