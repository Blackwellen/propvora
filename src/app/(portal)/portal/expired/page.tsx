import { PortalNotice } from "../_components/PortalNotice"

export const dynamic = "force-dynamic"

// /portal/expired — generic terminal state for invalid / expired / rate-limited
// links. Intentionally indistinguishable from one another (no enumeration).
export default function PortalExpiredPage() {
  return (
    <PortalNotice
      icon="alert"
      tone="warning"
      title="This link is no longer valid"
      message="Your secure link may have expired or already been used. Please ask your property manager to send you a fresh link to access your portal."
    />
  )
}
