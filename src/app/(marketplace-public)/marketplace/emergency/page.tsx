import { redirect } from 'next/navigation'

/**
 * /marketplace/emergency — redirects to /marketplace/suppliers with the
 * Emergency intent tab active (FIX-141). Emergency services are now surfaced
 * within the unified suppliers page via the "⚡ Emergency" trade filter chip,
 * rather than as a standalone page. The intent tab system keeps the Emergency
 * tab in the nav for direct access.
 */
export default function EmergencyRedirectPage() {
  redirect('/marketplace/suppliers')
}
