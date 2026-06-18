import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
export default function SupplierAccountingAccountsPage() {
  redirect("/supplier/accounting/accounts/overview")
}
