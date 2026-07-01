import type { Metadata } from "next"
import Link from "next/link"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"

export const metadata: Metadata = {
  title: "Affiliate Terms — Propvora",
  description:
    "The terms governing the Propvora Affiliate / Partner Programme: eligibility, commission, payouts, cooling-off, reversals, fraud and prohibited conduct.",
}

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "1. Programme overview",
    body: [
      "The Propvora Affiliate / Partner Programme (the “Programme”) is operated by Blackwellen Ltd, trading as Propvora (“we”, “us”). It lets approved partners earn commission for referring new paying customers to Propvora. Participation is governed by these terms.",
    ],
  },
  {
    h: "2. Eligibility, application and approval",
    body: [
      "Anyone may apply, but participation requires our approval. We may approve, reject, waitlist or request more information at our discretion. Existing Propvora customers may also enrol directly from their workspace settings.",
      "You must provide accurate information and keep it up to date. We may suspend or terminate affiliates who provide false information.",
    ],
  },
  {
    h: "3. Referral tracking and attribution",
    body: [
      "Referrals are tracked via your unique referral link, code and a 60-day cookie window using last-click attribution. Referrals must connect to a valid new sign-up, workspace and paying subscription. We may correct attribution manually where abuse or error is detected.",
    ],
  },
  {
    h: "4. Commission",
    body: [
      "The default commission is 10% of eligible subscription revenue, recurring for up to 6 months per referred customer. Higher partner levels may earn up to 15% based on the number of active valid paying referrals.",
      "Commission is calculated from eligible subscription revenue only and excludes taxes, refunded amounts, chargebacks, credits and excluded fees. Commission is earned only on valid, approved, paying customers.",
    ],
  },
  {
    h: "5. Cooling-off, payouts and reversals",
    body: [
      "New commission is held as pending for at least 30 days. No funds are released during this window. It becomes payable only after the customer's payment has cleared, the refund/chargeback window has passed, and the referred subscription is retained (not refunded, charged back or cancelled). The minimum payout threshold is £50.",
      "Payouts are made automatically via Stripe Connect to the Stripe account you connect in your dashboard — you must connect a payouts-enabled Stripe account before commission can be paid. Once your cleared balance reaches £50 it is paid out automatically.",
      "Commission reverses on refund (including within the customer's 30-day money-back window), chargeback, dispute, cancellation, failed payment, fraud, duplicate referral or invalid attribution. Pending commission cannot be withdrawn.",
    ],
  },
  {
    h: "6. Prohibited conduct",
    body: [
      "The following are not allowed: self-referrals; fake accounts; spam; misleading or guaranteed-earnings claims; brand bidding on Propvora terms unless explicitly approved; coupon abuse; impersonating Propvora or Blackwellen; and any unlawful or deceptive promotion.",
      "Referrals of existing customers are flagged and are not eligible for commission unless we expressly approve them.",
    ],
  },
  {
    h: "7. Suspension and termination",
    body: [
      "We may suspend or terminate any affiliate for breach of these terms or suspected abuse, and may withhold or reverse affected commission. Either party may leave the Programme at any time.",
    ],
  },
  {
    h: "8. Taxes, data and changes",
    body: [
      "You are responsible for your own taxes. We process personal data in line with our Privacy Policy. We may change the Programme or these terms; material changes will be communicated. Payouts are executed automatically via Stripe Connect once commission has cleared the hold window.",
    ],
  },
]

export default function AffiliateTermsPage() {
  return (
    <div className="min-h-screen bg-[#F6FAFF] flex flex-col">
      <PublicNav />
      <main className="flex-1 px-6 pt-28 pb-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0D1B2A]">Affiliate Terms</h1>
          <p className="mt-2 text-sm text-slate-500">
            Last updated 1 July 2026 · Operated by Blackwellen Ltd (trading as Propvora).
          </p>
          <div className="mt-8 space-y-7">
            {SECTIONS.map((s) => (
              <section key={s.h}>
                <h2 className="text-base font-bold text-slate-900">{s.h}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <div className="mt-10 rounded-2xl bg-white border border-slate-200 p-5 text-sm text-slate-600">
            Questions? Email{" "}
            <a href="mailto:partners@propvora.com" className="text-[#2563EB] hover:underline">
              partners@propvora.com
            </a>
            . Ready to join?{" "}
            <Link href="/affiliate-programme/apply" className="text-[#2563EB] hover:underline font-semibold">
              Apply now
            </Link>
            .
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
