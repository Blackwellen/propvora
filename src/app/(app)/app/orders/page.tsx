import { redirect } from "next/navigation"

// Legacy /property-manager/orders → canonical Work > Orders.
export default function OrdersRedirect() {
  redirect("/property-manager/work/orders?tab=active")
}
