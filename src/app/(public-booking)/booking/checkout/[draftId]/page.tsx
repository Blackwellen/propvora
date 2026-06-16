import Link from "next/link"
import { CheckCircle2, CreditCard, FileText, ShieldCheck, Users } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Booking Checkout - Propvora" }

const CHECKOUT_SECTIONS = [
  { title: "Trip summary", icon: FileText, items: ["Dates and nights", "Guests and pets", "Total price before payment"] },
  { title: "Guest details", icon: Users, items: ["Full name, email and phone", "Additional guests", "Arrival time and special requests"] },
  { title: "Legal acceptance", icon: ShieldCheck, items: ["House rules", "Cancellation policy", "Damage and deposit policy"] },
  { title: "Payment", icon: CreditCard, items: ["Payment method", "Deposit or hold", "Tax invoice details"] },
]

export default async function BookingCheckoutDraftPage({
  params,
}: {
  params: Promise<{ draftId: string }>
}) {
  const { draftId } = await params

  return (
    <main className="min-h-screen bg-[#F6FAFF]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Draft checkout</p>
          <h1 className="mt-2 text-2xl font-bold text-[#0B1B3F]">Complete your booking</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            This checkout foundation captures the required guest, legal, pricing and payment checkpoints before a reservation is confirmed. Draft ID: <span className="font-mono">{draftId}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHECKOUT_SECTIONS.map((section) => {
            const Icon = section.icon
            return (
              <section key={section.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
                </div>
                <div className="mt-4 space-y-2">
                  {section.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Final confirmation must create the reservation, payment intent, calendar blocks, cleaning task, customer portal access and audit events server-side.
          </p>
          <Link href="/stay/search" className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            Back to stays
          </Link>
        </div>
      </div>
    </main>
  )
}
