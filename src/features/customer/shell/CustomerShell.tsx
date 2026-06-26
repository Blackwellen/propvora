import CustomerTopNav from "./CustomerTopNav"
import CustomerMobileNav from "./CustomerMobileNav"
import { CustomerToastProvider } from "../components/toast"

/**
 * CustomerShell — the single chrome for the entire customer workspace.
 *
 * TOP NAVIGATION ONLY: there is no sidebar anywhere in the customer workspace.
 * Desktop/tablet get the full top nav; mobile additionally gets a bottom nav.
 * This is the ONLY shell for `/customer/*` — pages render their own content
 * inside <main> and never wrap themselves in another shell.
 */
export default function CustomerShell({
  customerName,
  customerEmail,
  avatarUrl,
  unreadNotifications = 0,
  unreadMessages = 0,
  brandLogoUrl,
  children,
}: {
  customerName?: string
  customerEmail?: string | null
  avatarUrl?: string | null
  unreadNotifications?: number
  unreadMessages?: number
  brandLogoUrl?: string | null
  children: React.ReactNode
}) {
  return (
    <CustomerToastProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <CustomerTopNav
          customerName={customerName}
          customerEmail={customerEmail}
          avatarUrl={avatarUrl}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          brandLogoUrl={brandLogoUrl}
        />
        <main className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">{children}</main>
        <CustomerMobileNav unreadMessages={unreadMessages} />
      </div>
    </CustomerToastProvider>
  )
}
