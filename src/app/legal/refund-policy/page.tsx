import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"
import { assertLegalSurface } from "@/lib/legal/gate"
import { LegalSection, LegalCallout } from "@/components/legal-marketplace/LegalPrimitives"
import { PolicyIntro, PolicyEntityFooter } from "@/components/legal-marketplace/PolicyMeta"
import { getPolicy } from "@/lib/legal/policies"

const policy = getPolicy("refund-policy")!

export const metadata: Metadata = {
  title: "Refund Policy | Propvora",
  description:
    "How and when refunds are issued for Propvora marketplace transactions, the role of the operator/supplier versus Propvora, and how refunds are processed.",
}

export default async function RefundPolicyPage() {
  await assertLegalSurface("bookingManagement")
  return (
    <LegalLayout title="Refund Policy" lastUpdated={policy.effectiveFrom}>
      <PolicyIntro slug="refund-policy" />

      <LegalSection num="1" title="Scope">
        <p>
          This Refund Policy explains how refunds work for transactions made
          through the Propvora marketplace. It applies alongside the{" "}
          <a href="/legal/marketplace-terms">Marketplace Terms</a>, the{" "}
          <a href="/legal/cancellation-policy">Cancellation Policy</a>, the
          listing&rsquo;s own terms, and your statutory rights.
        </p>
      </LegalSection>

      <LegalSection num="2" title="Who decides a refund">
        <p>
          Because the contract for a stay or service is between you and the
          operator or supplier, the refund obligation generally sits with{" "}
          <strong>them</strong>, in line with the listing&rsquo;s terms and the
          law. Propvora facilitates the refund mechanically (through Stripe) and,
          where we operate a payment hold, can give effect to an agreed or
          required refund.
        </p>
        <LegalCallout type="info">
          Propvora does not keep your payment as profit when a refund is due — we
          facilitate its return. Platform and payment-provider fees may be
          handled as described below depending on the reason for the refund.
        </LegalCallout>
      </LegalSection>

      <LegalSection num="3" title="When a refund is typically due">
        <ul>
          <li>
            a cancellation falls within a refundable window under the
            listing&rsquo;s cancellation terms or the{" "}
            <a href="/legal/cancellation-policy">Cancellation Policy</a>;
          </li>
          <li>
            a stay or service was not provided, was materially not as described,
            or was not performed with reasonable care and skill;
          </li>
          <li>
            you exercise a statutory cancellation right that applies to your
            contract; or
          </li>
          <li>
            an operator, supplier or Propvora agrees a refund following an issue
            or dispute.
          </li>
        </ul>
      </LegalSection>

      <LegalSection num="4" title="How refunds are processed">
        <p>
          Approved refunds are returned to your original payment method via
          Stripe. The time to appear depends on your bank or card issuer, but is
          commonly a few business days. You will be able to see the status of a
          refund in the marketplace.
        </p>
      </LegalSection>

      <LegalSection num="5" title="Fees on refunds">
        <p>
          Where a full refund is due because of cancellation within a refundable
          window or because the stay or service was not provided or was
          materially not as described, the platform fee on that transaction is
          normally refunded too. Where a partial refund is agreed, fees may be
          adjusted proportionately. Payment-provider (Stripe) processing fees may
          be non-refundable in some cases; this is disclosed where relevant.
        </p>
      </LegalSection>

      <LegalSection num="6" title="Disputes and chargebacks">
        <p>
          If you cannot resolve a refund directly with the operator or supplier,
          raise an issue through Propvora. Initiating a card chargeback before
          using the marketplace&rsquo;s issue tools can delay resolution. Propvora
          facilitates resolution and may pause a payout where a payment hold
          applies, but does not adjudicate the parties&rsquo; legal rights.
        </p>
      </LegalSection>

      <LegalSection num="7" title="Your statutory rights">
        <p>
          Nothing in this policy removes or reduces your statutory rights as a
          consumer. Where those rights entitle you to a refund, they take
          precedence over a listing&rsquo;s stated terms.
        </p>
      </LegalSection>

      <PolicyEntityFooter />
    </LegalLayout>
  )
}
