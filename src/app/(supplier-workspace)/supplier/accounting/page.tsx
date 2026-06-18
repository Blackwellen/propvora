import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
export default function SupplierAccountingPage() {
  redirect("/supplier/accounting/accounts/overview")
}
