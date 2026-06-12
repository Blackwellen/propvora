import { PortalNotice } from "../_components/PortalNotice"

export const dynamic = "force-dynamic"

// /portal/login — shown when a visitor arrives without a (valid) link.
// V1 has no self-service OTP; access is via the operator-issued magic link.
export default function PortalLoginPage() {
  return (
    <PortalNotice
      icon="key"
      tone="neutral"
      title="Secure portal access"
      message="Open the secure link your property manager sent you to view your portal. The link signs you in automatically — no password needed. If your link has stopped working, ask them to resend it."
    />
  )
}
