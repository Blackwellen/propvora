import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"
import { assertLegalSurface } from "@/lib/legal/gate"
import { LegalSection, LegalCallout } from "@/components/legal-marketplace/LegalPrimitives"
import { PolicyIntro, PolicyEntityFooter } from "@/components/legal-marketplace/PolicyMeta"
import { getPolicy } from "@/lib/legal/policies"

const policy = getPolicy("cancellation-policy")!

export const metadata: Metadata = {
  title: "Cancellation Policy | Propvora",
  description:
    "How cancellations work for stays and services on the Propvora marketplace, the cancellation tiers an operator may set, and your statutory cancellation rights.",
}

export default async function CancellationPolicyPage() {
  await assertLegalSurface("bookingManagement")
  return (
    <LegalLayout title="Cancellation Policy" lastUpdated={policy.effectiveFrom}>
      <PolicyIntro slug="cancellation-policy" />

      <LegalSection num="1" title="Scope">
        <p>
          This Cancellation Policy explains how cancellations are handled on the
          Propvora marketplace. It works together with the listing&rsquo;s own
          cancellation terms, the <a href="/legal/refund-policy">Refund Policy</a>
          , the <a href="/legal/marketplace-terms">Marketplace Terms</a>, and your
          statutory rights.
        </p>
      </LegalSection>

      <LegalSection num="2" title="Operators set the cancellation tier">
        <p>
          Because the operator or supplier is the contracting party, they choose
          a cancellation tier for each listing. Common tiers are:
        </p>
        <ul>
          <li>
            <strong>Flexible</strong> — full refund up to a short window before
            the stay or service (for example 24 hours before).
          </li>
          <li>
            <strong>Moderate</strong> — full refund up to a longer window (for
            example 5 days before), partial after.
          </li>
          <li>
            <strong>Strict</strong> — limited or no refund close to the date.
          </li>
          <li>
            <strong>Non-refundable</strong> — no refund on cancellation, usually
            offered at a lower price.
          </li>
        </ul>
        <LegalCallout type="info">
          The exact tier and its windows are shown on each listing before you
          book. Always check the listing&rsquo;s stated tier — it governs your
          refund on cancellation, subject to your statutory rights.
        </LegalCallout>
      </LegalSection>

      <LegalSection num="3" title="Cancelling a booking or order">
        <p>
          You can request a cancellation through the marketplace. The refund (if
          any) follows the listing&rsquo;s tier and the{" "}
          <a href="/legal/refund-policy">Refund Policy</a>. Cancellation timing is
          taken from when you submit the request in the marketplace.
        </p>
      </LegalSection>

      <LegalSection num="4" title="Cancellations by the operator or supplier">
        <p>
          If an operator or supplier cancels a confirmed booking or order, you
          are normally entitled to a full refund of amounts paid for the
          cancelled stay or service. Repeated or unjustified cancellations by a
          seller may lead to action under the{" "}
          <a href="/legal/seller-agreement">Seller Agreement</a>.
        </p>
      </LegalSection>

      <LegalSection num="5" title="Your statutory cancellation rights">
        <p>
          Where you are a consumer, you may have statutory cancellation rights
          (for example a cooling-off period for certain off-premises or distance
          contracts under the Consumer Contracts Regulations 2013). These rights,
          where they apply, take precedence over a listing&rsquo;s stated tier.
          Some services you ask to start immediately, and certain accommodation
          for specific dates, may be excluded from statutory cancellation rights
          — the listing and checkout will indicate where this applies.
        </p>
      </LegalSection>

      <LegalSection num="6" title="Exceptional circumstances">
        <p>
          In limited situations — such as a serious safety issue or an event
          outside the parties&rsquo; reasonable control — Propvora may help
          facilitate a fair outcome alongside the parties. Propvora does not
          guarantee a particular result and does not determine legal rights.
        </p>
      </LegalSection>

      <PolicyEntityFooter />
    </LegalLayout>
  )
}
