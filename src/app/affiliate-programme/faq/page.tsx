import type { Metadata } from "next"
import Link from "next/link"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"

export const metadata: Metadata = {
  title: "Affiliate FAQ — Propvora",
  description:
    "Common questions about the Propvora Affiliate Programme: commission, payouts, cooling-off, attribution and how to apply.",
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "How much can I earn?",
    a: "10% of eligible subscription revenue, recurring for up to 6 months per referred paying customer. Higher partner levels (based on active paying referrals) earn up to 15%.",
  },
  {
    q: "When do I get paid?",
    a: "Commission is held as pending for at least 30 days (a cooling-off period to cover refunds and chargebacks). Once cleared and your balance reaches £50, it becomes payable.",
  },
  {
    q: "What happens if a customer cancels or refunds?",
    a: "Commission reverses on refund, chargeback, cancellation or failed payment. You earn only on valid, approved, paying customers.",
  },
  {
    q: "How are referrals tracked?",
    a: "Through your unique referral link and code, using a 60-day last-click cookie window. The referral must result in a new sign-up, workspace and paying subscription.",
  },
  {
    q: "I'm already a Propvora customer — can I refer people?",
    a: "Yes. You can enrol in one click from your workspace settings — no separate application needed. You earn the same commission as external partners.",
  },
  {
    q: "Can I refer myself or an existing customer?",
    a: "No. Self-referrals are not permitted, and referrals of existing customers are flagged and not eligible for commission unless we expressly approve them.",
  },
  {
    q: "Is the programme available everywhere?",
    a: "Applications are reviewed individually. Payout execution may be operated manually during early release, and some features are rolled out in stages.",
  },
]

export default function AffiliateFaqPage() {
  return (
    <div className="min-h-screen bg-[#F6FAFF] flex flex-col">
      <PublicNav />
      <main className="flex-1 px-6 pt-28 pb-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0D1B2A]">Affiliate FAQ</h1>
          <p className="mt-2 text-sm text-slate-600">
            Everything you need to know before you apply.
          </p>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl bg-white border border-slate-200 p-5">
                <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold text-slate-900">
                  {f.q}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/affiliate-programme/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Apply to become a partner
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
