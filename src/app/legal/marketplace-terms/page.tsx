import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"
import { LegalSection, LegalCallout } from "@/components/legal-marketplace/LegalPrimitives"
import { PolicyIntro, PolicyEntityFooter } from "@/components/legal-marketplace/PolicyMeta"
import { getPolicy } from "@/lib/legal/policies"

const policy = getPolicy("marketplace-terms")!

export const metadata: Metadata = {
  title: "Marketplace Terms | Propvora",
  description:
    "The terms governing use of the Propvora marketplace: Propvora's role as facilitator, accounts, payments via Stripe, trust and verification, and dispute handling.",
}

export default function MarketplaceTermsPage() {
  return (
    <LegalLayout title="Marketplace Terms" lastUpdated={policy.effectiveFrom}>
      <PolicyIntro slug="marketplace-terms" />

      <LegalSection num="1" title="What these terms cover">
        <p>
          These Marketplace Terms govern your access to and use of the Propvora
          marketplace — the part of the Propvora platform where operators and
          suppliers list property stays and services, and where guests, buyers
          and property managers discover, book, order, pay for and review them.
          They apply in addition to the Propvora{" "}
          <a href="/legal/terms">Terms of Service</a> and{" "}
          <a href="/legal/privacy">Privacy Policy</a>. Where there is a conflict
          specific to a marketplace transaction, these Marketplace Terms prevail.
        </p>
        <p>
          By creating a marketplace listing, making or accepting a booking,
          placing or accepting an order, or otherwise using the marketplace, you
          agree to these terms.
        </p>
      </LegalSection>

      <LegalSection num="2" title="Propvora's role — facilitator, not principal">
        <p>
          Propvora provides a marketplace and the software tools around it. We
          help users find each other, communicate, transact and resolve issues.
          We are an <strong>intermediary and facilitator</strong>. We are not a
          party to the contract for any stay or service and we do not own,
          operate, control, inspect or guarantee any listing.
        </p>
        <ul>
          <li>
            For a <strong>stay</strong>, the contract is between the guest/buyer
            and the operator or host listing the property.
          </li>
          <li>
            For a <strong>service</strong>, the contract is between the buyer
            (e.g. a property manager) and the supplier providing the service.
          </li>
        </ul>
        <p>
          Operators and suppliers are independent businesses or individuals and
          are solely responsible for their listings, the lawfulness of what they
          offer, and the performance of their stays and services.
        </p>
        <LegalCallout type="warning">
          Propvora does not provide property, travel, insurance, legal, tax or
          investment services and is not authorised by the Financial Conduct
          Authority. We do not give advice on whether a transaction is right for
          you. You remain responsible for your own due diligence and for
          complying with the laws that apply to you.
        </LegalCallout>
      </LegalSection>

      <LegalSection num="3" title="Accounts and eligibility">
        <p>
          To transact on the marketplace you must hold a Propvora account, be at
          least 18, and have the legal capacity to enter into binding contracts.
          You are responsible for activity under your account and for keeping
          your credentials secure. We may require identity, business, insurance
          or licence verification before you can list or transact in certain
          categories.
        </p>
      </LegalSection>

      <LegalSection num="4" title="Listings, trust and verification">
        <p>
          Verification badges (for example identity, business, insurance or
          licence verified) mean that evidence has been submitted and checked to
          the stated level at a point in time. They are{" "}
          <strong>not a guarantee</strong> of future performance, safety,
          quality or continued validity. You should still exercise your own
          judgement.
        </p>
        <p>
          Operators and suppliers are responsible for the accuracy of their
          listings and for holding any licences, registrations, insurance and
          permissions their stay or service legally requires.
        </p>
      </LegalSection>

      <LegalSection num="5" title="Payments, fees and payouts">
        <p>
          Where the marketplace processes payment, payments are handled by{" "}
          <strong>Stripe</strong> (including Stripe Connect for seller payouts).
          Propvora facilitates the payment as an intermediary; it does not hold
          your money as a bank and does not provide regulated payment or
          deposit-taking services. Propvora may charge a platform fee on
          marketplace transactions, which is disclosed before you confirm.
          Payment-provider fees may also apply.
        </p>
        <p>
          Where a payment is authorised and captured later, or held pending
          completion of a stay or service, this is a contractual hold operated
          through Stripe&rsquo;s capabilities — it is described as a payment hold
          or delayed capture, not third-party escrow, unless we expressly say a
          regulated escrow provider is used. Payouts to operators and suppliers
          are subject to the <a href="/legal/seller-agreement">Seller Agreement</a>.
        </p>
      </LegalSection>

      <LegalSection num="6" title="Off-platform conduct and acceptable use">
        <p>
          You must use the marketplace in accordance with the{" "}
          <a href="/legal/acceptable-use-marketplace">
            Marketplace Acceptable Use Policy
          </a>
          . Soliciting or completing transactions off-platform to avoid fees,
          verification or buyer/seller protections is prohibited and may result
          in suspension.
        </p>
      </LegalSection>

      <LegalSection num="7" title="Cancellations, refunds and disputes">
        <p>
          Cancellations and refunds are governed by the{" "}
          <a href="/legal/cancellation-policy">Cancellation Policy</a> and the{" "}
          <a href="/legal/refund-policy">Refund Policy</a>, together with the
          terms each operator or supplier sets for their listing. Where a dispute
          arises, Propvora may provide tools to help the parties resolve it and,
          where we operate a payment hold, may pause a payout pending resolution.
          Propvora is not a court or arbitrator and does not determine the
          parties&rsquo; legal rights.
        </p>
      </LegalSection>

      <LegalSection num="8" title="Restricted countries and persons">
        <p>
          Country support varies and may change. The marketplace may not be used
          by persons or entities subject to applicable sanctions, or in
          countries we do not support. We may decline, suspend or reverse
          transactions to comply with sanctions, anti-money-laundering and other
          legal obligations.
        </p>
      </LegalSection>

      <LegalSection num="9" title="Liability">
        <p>
          To the maximum extent permitted by law, Propvora is not liable for the
          acts, omissions, listings, stays or services of operators, suppliers,
          guests or buyers, nor for losses arising from a transaction to which we
          are not a party. Nothing in these terms limits liability that cannot be
          limited under English law, including for death or personal injury
          caused by negligence, or for fraud. Your statutory rights as a consumer
          are not affected.
        </p>
      </LegalSection>

      <LegalSection num="10" title="Changes and governing law">
        <p>
          We may update these terms; material changes are notified and the
          version and effective date above are updated. These terms are governed
          by the laws of England and Wales and subject to the jurisdiction of its
          courts, without affecting any mandatory consumer protections available
          to you locally.
        </p>
      </LegalSection>

      <PolicyEntityFooter />
    </LegalLayout>
  )
}
