import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"
import { LegalSection, LegalCallout } from "@/components/legal-marketplace/LegalPrimitives"
import { PolicyIntro, PolicyEntityFooter } from "@/components/legal-marketplace/PolicyMeta"
import { getPolicy } from "@/lib/legal/policies"

const policy = getPolicy("seller-agreement")!

export const metadata: Metadata = {
  title: "Seller Agreement | Propvora",
  description:
    "Terms for operators and suppliers listing stays or services on the Propvora marketplace: responsibilities, fees, payouts, licensing and compliance.",
}

export default function SellerAgreementPage() {
  return (
    <LegalLayout title="Seller Agreement" lastUpdated={policy.effectiveFrom}>
      <PolicyIntro slug="seller-agreement" />

      <LegalSection num="1" title="Who this agreement is for">
        <p>
          This Seller Agreement applies if you list and sell on the Propvora
          marketplace — including operators and hosts listing property stays, and
          suppliers offering services (maintenance, cleaning, emergency callouts,
          compliance and similar). It applies in addition to the{" "}
          <a href="/legal/marketplace-terms">Marketplace Terms</a> and the
          Propvora <a href="/legal/terms">Terms of Service</a>.
        </p>
      </LegalSection>

      <LegalSection num="2" title="You are the contracting party">
        <p>
          When a guest books your stay or a buyer orders your service, the
          resulting contract is between <strong>you and that customer</strong>.
          Propvora is the facilitator and is not a party to it. You are
          responsible for delivering what you list, to the standard and within
          the timeframe you advertise, and for your own staff, subcontractors and
          team members.
        </p>
      </LegalSection>

      <LegalSection num="3" title="Your representations">
        <p>By listing, you represent and warrant on an ongoing basis that:</p>
        <ul>
          <li>
            you have the legal right to offer the stay or service (including
            ownership, a right to let, or a right to operate as applicable);
          </li>
          <li>
            you hold all licences, registrations, certifications and permissions
            your offering requires (for example local short-let registration, gas
            and electrical safety certification, HMO licensing, trade
            qualifications);
          </li>
          <li>
            you hold any insurance reasonably required for your activity and
            keep it current;
          </li>
          <li>
            your listings are accurate, not misleading, and comply with consumer
            and advertising law; and
          </li>
          <li>
            you will comply with all applicable property, safety, employment, tax
            and data-protection laws.
          </li>
        </ul>
        <LegalCallout type="warning">
          Verification badges shown on your profile evidence that you submitted
          documents checked to a stated level. They do not transfer your legal
          responsibilities to Propvora, and they are not a warranty by Propvora
          to your customers. You remain fully responsible for compliance.
        </LegalCallout>
      </LegalSection>

      <LegalSection num="4" title="Fees and platform commission">
        <p>
          Propvora charges a platform fee on marketplace transactions. The
          current default supplier and public-booking marketplace fee is{" "}
          <strong>2.5%</strong> of the gross transaction amount, plus
          payment-provider fees, unless a different rate is shown for your plan,
          category or country at the time of the transaction. The applicable fee
          is disclosed before a transaction completes. We may vary fees on
          reasonable notice; fees in force when a transaction is made apply to
          that transaction.
        </p>
      </LegalSection>

      <LegalSection num="5" title="Payments and payouts">
        <p>
          Marketplace payments are processed by <strong>Stripe</strong>, and
          payouts to you are made through <strong>Stripe Connect</strong>. You
          must connect and maintain a Stripe account and complete Stripe&rsquo;s
          identity and bank verification. Stripe&rsquo;s own terms apply to your
          Stripe account. Propvora facilitates payouts but does not hold your
          funds as a bank.
        </p>
        <p>Payouts may be held or delayed where:</p>
        <ul>
          <li>a stay or service is not yet completed and a payment hold applies;</li>
          <li>required evidence of completion is missing;</li>
          <li>a dispute, chargeback or refund is open;</li>
          <li>
            a licence or insurance required for the category has lapsed or is
            invalid; or
          </li>
          <li>a sanctions, fraud or risk review is in progress.</li>
        </ul>
      </LegalSection>

      <LegalSection num="6" title="Cancellations, refunds and disputes">
        <p>
          You must honour the cancellation tier and any refund terms you set for
          a listing, alongside the marketplace{" "}
          <a href="/legal/cancellation-policy">Cancellation Policy</a> and{" "}
          <a href="/legal/refund-policy">Refund Policy</a> and your
          customer&rsquo;s statutory rights. You agree to respond to disputes
          promptly and to provide reasonable evidence. Where Propvora operates a
          payment hold, we may withhold or reverse a payout to give effect to a
          refund or dispute outcome consistent with these policies and applicable
          law.
        </p>
      </LegalSection>

      <LegalSection num="7" title="Conduct, reviews and off-platform dealing">
        <p>
          You must comply with the{" "}
          <a href="/legal/acceptable-use-marketplace">
            Marketplace Acceptable Use Policy
          </a>
          . You must not solicit off-platform payment to avoid fees or
          protections, manipulate reviews, or pressure customers over reviews.
        </p>
      </LegalSection>

      <LegalSection num="8" title="Suspension and termination">
        <p>
          We may suspend or remove your listings or account where you breach this
          agreement, where required by law, or to protect users from harm,
          fraud or safety risks. You may stop listing at any time; obligations
          relating to in-progress transactions, refunds, disputes and payouts
          survive.
        </p>
      </LegalSection>

      <LegalSection num="9" title="Liability and indemnity">
        <p>
          You are responsible for losses arising from your listings, stays and
          services, and you agree to indemnify Propvora against third-party
          claims arising from your breach of this agreement or of applicable law,
          to the extent permitted by law. Nothing here excludes liability that
          cannot be excluded under English law. This agreement is governed by the
          laws of England and Wales.
        </p>
      </LegalSection>

      <PolicyEntityFooter />
    </LegalLayout>
  )
}
