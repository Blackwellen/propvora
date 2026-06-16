import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Booking Terms | Propvora",
  description:
    "Propvora Booking Terms for guests booking a stay through a host's Propvora booking page. Propvora provides the booking software; your contract for the stay is with the host.",
  openGraph: {
    title: "Booking Terms | Propvora",
    description:
      "Propvora Booking Terms for guests booking a stay through a host's Propvora booking page.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Booking Terms | Propvora",
    description:
      "Propvora Booking Terms for guests booking a stay through a host's Propvora booking page.",
  },
}

export default function BookingTermsPage() {
  return (
    <LegalLayout title="Booking Terms" lastUpdated="16 June 2026">
      <Section num="1" title="About These Terms">
        <p>
          These Booking Terms (&ldquo;Terms&rdquo;) apply when you (the &ldquo;Guest&rdquo;) book a
          stay through a host&rsquo;s Propvora booking page. Propvora is operated by Blackwellen Ltd,
          trading as Propvora (&ldquo;Propvora&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or
          &ldquo;us&rdquo;), a company registered in England and Wales under company number 16482166.
        </p>
        <Callout>
          <strong>Important:</strong> Propvora provides the booking software. Your contract for the
          stay itself is between you and the host (the property operator). Propvora is not the host,
          is not a party to the accommodation contract, and is not the provider of the
          accommodation.
        </Callout>
      </Section>

      <Section num="2" title="Making a Booking">
        <p>
          When you submit a booking, you are making an offer to stay on the host&rsquo;s terms,
          including the price, dates, occupancy limit and any house rules shown at the time of
          booking. A booking is confirmed when the host (or the host&rsquo;s booking page on their
          behalf) accepts it and any required payment or deposit has been taken.
        </p>
        <p>
          You must be at least 18 years old to make a booking and must provide accurate guest
          details.
        </p>
      </Section>

      <Section num="3" title="Payment">
        <p>
          Payments are processed securely by our payment provider, Stripe. The amount payable, the
          payment schedule, and any security or damage deposit will be shown before you confirm.
          Propvora does not set prices and does not hold the funds for the stay beyond facilitating
          the payment to the host.
        </p>
      </Section>

      <Section num="4" title="Check-in and Check-out">
        <p>You agree to:</p>
        <ul>
          <li>Arrive and depart within the check-in and check-out times set by the host</li>
          <li>Follow the host&rsquo;s arrival and key-collection instructions</li>
          <li>Provide any identification or guest information reasonably required by the host or by law</li>
          <li>Not exceed the maximum occupancy stated for the property</li>
        </ul>
        <p>
          Late check-out, early arrival or additional guests may incur charges or be refused at the
          host&rsquo;s discretion.
        </p>
      </Section>

      <Section num="5" title="House Rules and Conduct">
        <p>
          You must comply with the host&rsquo;s house rules and use the property responsibly and
          lawfully. You must not cause a nuisance to neighbours, exceed occupancy, sublet, or use the
          property for any illegal or commercial purpose not agreed with the host. The host may end a
          stay where house rules are seriously breached.
        </p>
      </Section>

      <Section num="6" title="Cancellation">
        <p>
          The host&rsquo;s cancellation policy shown at the time of booking applies to your stay. It
          sets out whether and to what extent your booking is refundable and any deadlines that
          apply. Please review it carefully before booking, as cancellation outcomes are determined
          by that policy and by the host, not by Propvora.
        </p>
      </Section>

      <Section num="7" title="Property Damage and Liability">
        <p>
          You are responsible for any damage to the property or its contents caused by you or your
          party during the stay, beyond fair wear and tear. The host may apply a security or damage
          deposit, and may seek to recover reasonable costs for damage, excessive cleaning, or
          missing items in accordance with the booking terms and applicable law.
        </p>
      </Section>

      <Section num="8" title="Propvora's Role and Liability">
        <p>
          Propvora provides the booking and payment technology. We are not responsible for the
          condition, safety, legality or accuracy of any property listing, for the host&rsquo;s
          performance, or for any dispute between you and the host about the stay. Any issue with the
          accommodation should be raised with the host in the first instance.
        </p>
        <p>
          To the maximum extent permitted by law, Propvora&rsquo;s liability to you in connection
          with the booking software is limited, and nothing in these Terms excludes liability that
          cannot be excluded under English law, including for death or personal injury caused by our
          negligence.
        </p>
      </Section>

      <Section num="9" title="Governing Law and Contact">
        <p>
          These Terms are governed by the laws of England and Wales. For questions about a booking,
          contact your host. For questions about these Terms or the platform, contact{" "}
          <a href="mailto:legal@propvora.com">legal@propvora.com</a>.
        </p>
      </Section>
    </LegalLayout>
  )
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-baseline gap-2">
        <span className="text-blue-600 text-base font-bold">{num}.</span>
        {title}
      </h2>
      <div className="space-y-4 text-slate-700 leading-relaxed text-sm [&_a]:text-blue-600 [&_a:hover]:text-blue-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:font-semibold [&_strong]:text-slate-900">
        {children}
      </div>
    </div>
  )
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl border-l-4 bg-amber-50 border-amber-300 text-amber-900 text-sm leading-relaxed my-4">
      {children}
    </div>
  )
}
