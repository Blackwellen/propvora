import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"
import { LegalSection, LegalCallout } from "@/components/legal-marketplace/LegalPrimitives"
import { PolicyIntro, PolicyEntityFooter } from "@/components/legal-marketplace/PolicyMeta"
import { getPolicy } from "@/lib/legal/policies"

const policy = getPolicy("acceptable-use")!

export const metadata: Metadata = {
  title: "Marketplace Acceptable Use Policy | Propvora",
  description:
    "What you may and may not do on the Propvora marketplace: prohibited listings and conduct, off-platform payment rules, fake reviews, and enforcement.",
}

export default function MarketplaceAcceptableUsePage() {
  return (
    <LegalLayout
      title="Marketplace Acceptable Use Policy"
      lastUpdated={policy.effectiveFrom}
    >
      <PolicyIntro slug="acceptable-use" />

      <LegalSection num="1" title="Purpose">
        <p>
          This policy sets out acceptable use of the Propvora marketplace by all
          participants — operators, suppliers, guests and buyers. It supplements
          the platform-wide <a href="/legal/acceptable-use">Acceptable Use Policy</a>,
          the <a href="/legal/marketplace-terms">Marketplace Terms</a> and the{" "}
          <a href="/legal/seller-agreement">Seller Agreement</a>. Breaching it may
          lead to content removal, suspension or termination.
        </p>
      </LegalSection>

      <LegalSection num="2" title="Prohibited listings">
        <p>You must not list, offer or request:</p>
        <ul>
          <li>anything illegal, or any stay or service you are not legally permitted to provide;</li>
          <li>
            stays without the licences, registrations or safety certification the
            property legally requires;
          </li>
          <li>
            services in regulated categories without the required qualifications,
            insurance or licences (for example gas, electrical or other certified
            work);
          </li>
          <li>misleading, fraudulent, or materially inaccurate listings; or</li>
          <li>discriminatory listings that breach equality law.</li>
        </ul>
      </LegalSection>

      <LegalSection num="3" title="Prohibited conduct">
        <ul>
          <li>impersonating another person or business, or misrepresenting verification status;</li>
          <li>harassment, abuse, threats, hate speech or discrimination;</li>
          <li>exposing others&rsquo; personal data, or sharing private addresses or contact details outside what a confirmed transaction requires;</li>
          <li>attempting to access workspaces, bookings, payments or data you are not party to;</li>
          <li>circumventing safety, verification, risk or sanctions controls; and</li>
          <li>any activity that facilitates money laundering, sanctions evasion or fraud.</li>
        </ul>
      </LegalSection>

      <LegalSection num="4" title="Off-platform payments">
        <LegalCallout type="warning">
          You must not solicit or arrange payment off-platform to avoid platform
          fees, verification, or buyer and seller protections. Off-platform
          dealing removes the safeguards Propvora provides and is a serious breach
          of this policy.
        </LegalCallout>
      </LegalSection>

      <LegalSection num="5" title="Reviews">
        <p>You must not:</p>
        <ul>
          <li>post fake, incentivised or retaliatory reviews;</li>
          <li>offer refunds, discounts or other benefits in exchange for a review or its removal;</li>
          <li>use reviews to extort, threaten or coerce; or</li>
          <li>include personal data, abuse or unlawful content in a review.</li>
        </ul>
      </LegalSection>

      <LegalSection num="6" title="Emergency and safety-critical services">
        <p>
          For emergency or safety-critical services, suppliers must hold the
          required qualifications and insurance and act safely and lawfully.
          Propvora is a facilitator and does not itself provide emergency
          services or guarantee response times; in a genuine emergency contact
          the relevant emergency services first.
        </p>
      </LegalSection>

      <LegalSection num="7" title="Reporting and enforcement">
        <p>
          To report a breach, contact{" "}
          <a href="mailto:support@propvora.com">support@propvora.com</a>. We may
          investigate, remove content, suspend or terminate accounts, withhold
          payouts where a payment hold applies, and report unlawful activity to
          the authorities. Enforcement is at our reasonable discretion and
          proportionate to the breach.
        </p>
      </LegalSection>

      <PolicyEntityFooter />
    </LegalLayout>
  )
}
