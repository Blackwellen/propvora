import { redirect } from "next/navigation"

// Legacy /property-manager/orders → canonical Work > Orders.
export default function OrdersRedirect() {
  redirect("/app/work/orders?tab=active")
}
