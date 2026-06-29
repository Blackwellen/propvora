import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"
import { assertLegalSurface } from "@/lib/legal/gate"
import { LegalSection, LegalCallout } from "@/components/legal-marketplace/LegalPrimitives"
import { PolicyIntro, PolicyEntityFooter } from "@/components/legal-marketplace/PolicyMeta"
import { getPolicy } from "@/lib/legal/policies"

const policy = getPolicy("buyer-terms")!

export const metadata: Metadata = {
  title: "Buyer Terms | Propvora",
  description:
    "Terms for guests and buyers on the Propvora marketplace: who your contract is with, payment, your consumer rights, and how to raise an issue.",
}

export default async function BuyerTermsPage() {
  await assertLegalSurface("bookingManagement")
  return (
    <LegalLayout title="Buyer Terms" lastUpdated={policy.effectiveFrom}>
      <PolicyIntro slug="buyer-terms" />

      <LegalSection num="1" title="Who these terms are for">
        <p>
          These Buyer Terms apply when you use the Propvora marketplace as a{" "}
          <strong>guest or buyer</strong> — booking a stay or ordering a service.
          They apply in addition to the{" "}
          <a href="/legal/marketplace-terms">Marketplace Terms</a> and the
          Propvora <a href="/legal/privacy">Privacy Policy</a>.
        </p>
      </LegalSection>

      <LegalSection num="2" title="Who your contract is with">
        <p>
          When you book a stay or order a service, your contract is with the{" "}
          <strong>operator or supplier</strong> providing it, not with Propvora.
          Propvora facilitates discovery, communication and payment, but is not
          the host, supplier, travel agent or insurer and does not provide the
          stay or service itself.
        </p>
        <LegalCallout type="info">
          The operator or supplier sets the description, price, house rules,
          availability and their own cancellation terms. Read the listing and
          its cancellation terms before you book.
        </LegalCallout>
      </LegalSection>

      <LegalSection num="3" title="Payment">
        <p>
          Payments are processed securely by <strong>Stripe</strong>. Propvora
          does not store your full card details. The total payable — including
          any platform or service fee and applicable taxes — is shown before you
          confirm. For some bookings, payment may be authorised at booking and
          captured later, or held until the stay or service is completed.
        </p>
      </LegalSection>

      <LegalSection num="4" title="Your consumer rights">
        <p>
          If you are a consumer in the UK, your statutory rights under the
          Consumer Rights Act 2015 and the Consumer Contracts Regulations apply
          to your contract with the operator or supplier and are not removed by
          these terms. This includes rights relating to services being performed
          with reasonable care and skill, and, where applicable, cancellation
          rights. Where you are outside the UK, your local consumer laws may
          apply.
        </p>
      </LegalSection>

      <LegalSection num="5" title="Cancellations and refunds">
        <p>
          Cancellations and refunds are governed by the listing&rsquo;s
          cancellation terms together with the marketplace{" "}
          <a href="/legal/cancellation-policy">Cancellation Policy</a> and{" "}
          <a href="/legal/refund-policy">Refund Policy</a>, and any statutory
          rights you have. Where a refund is due, it is normally returned to your
          original payment method via Stripe.
        </p>
      </LegalSection>

      <LegalSection num="6" title="Issues and disputes">
        <p>
          If something goes wrong, first contact the operator or supplier through
          the marketplace. If it is not resolved, you can raise an issue through
          Propvora&rsquo;s tools. Where Propvora operates a payment hold, we may
          pause a payout while an issue is reviewed. Propvora helps facilitate
          resolution but does not decide the parties&rsquo; legal rights and is
          not an arbitrator.
        </p>
      </LegalSection>

      <LegalSection num="7" title="Your responsibilities">
        <p>
          You must provide accurate information, comply with the operator&rsquo;s
          reasonable house rules, treat suppliers and hosts respectfully, and use
          the marketplace in line with the{" "}
          <a href="/legal/acceptable-use-marketplace">
            Marketplace Acceptable Use Policy
          </a>
          . You must not arrange to pay off-platform to avoid fees or buyer
          protections.
        </p>
      </LegalSection>

      <LegalSection num="8" title="Liability and governing law">
        <p>
          Propvora is not liable for the acts or omissions of operators or
          suppliers, or for losses arising from a contract to which we are not a
          party. Nothing in these terms limits liability that cannot be limited
          under English law, including for death or personal injury caused by
          negligence, or for fraud, and your statutory rights are unaffected.
          These terms are governed by the laws of England and Wales, without
          affecting mandatory consumer protections available to you locally.
        </p>
      </LegalSection>

      <PolicyEntityFooter />
    </LegalLayout>
  )
}
