import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

// The Emergency marketplace now lives as a tab on the unified suppliers hub.
export default function EmergencyHubRedirect() {
  redirect("/app/marketplace/suppliers-hub?tab=emergency")
}
