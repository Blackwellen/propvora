import { PortalNotice } from "../_components/PortalNotice"

export const dynamic = "force-dynamic"

// /portal/revoked — shown when access was explicitly revoked. Generic copy,
// no data, no detail about what was revoked or by whom.
export default function PortalRevokedPage() {
  return (
    <PortalNotice
      icon="ban"
      tone="danger"
      title="Access has been turned off"
      message="Access to this portal is no longer available. If you think this is a mistake, please contact your property manager."
    />
  )
}
