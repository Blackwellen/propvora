import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

// The Services marketplace now lives as a tab on the unified suppliers hub.
export default function ServicesHubRedirect() {
  redirect("/app/marketplace/suppliers-hub?tab=services")
}
