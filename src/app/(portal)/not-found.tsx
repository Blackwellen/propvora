import { PortalNotice } from "./portal/_components/PortalNotice"

// Branded, data-free 404 for the external portal surface. Generic copy only.
export default function PortalNotFound() {
  return (
    <PortalNotice
      icon="alert"
      tone="neutral"
      title="Page not found"
      message="We couldn't find that page. If you reached here from a link, please open the secure link your property manager sent you."
    />
  )
}
