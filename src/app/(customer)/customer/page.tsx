import { CalendarCheck, CreditCard, MessageSquare } from "lucide-react"

export const metadata = {
  title: "Customer Workspace · Propvora",
}

/**
 * Customer workspace landing (v2 scaffold / placeholder).
 *
 * Only reachable when the `customerWorkspace` flag is ON (the (customer) layout
 * redirects to /app otherwise). This is a deliberate placeholder for the future
 * customer home (current booking, payments due, messages — audit §7.3 / §15).
 */
export default function CustomerHomePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Welcome</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your bookings, messages and payments will appear here.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "My Bookings", icon: CalendarCheck, hint: "Stays and service requests" },
          { label: "Messages", icon: MessageSquare, hint: "Talk to your property manager" },
          { label: "Payments", icon: CreditCard, hint: "Balances due and history" },
        ].map(({ label, icon: Icon, hint }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">{label}</h2>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        This workspace is in preview. More features are on the way.
      </p>
    </div>
  )
}
