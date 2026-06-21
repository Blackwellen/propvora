import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Supplier Terms | Propvora",
  description:
    "Propvora Supplier Terms — the agreement for suppliers and tradespeople offering services through the Propvora marketplace.",
  openGraph: {
    title: "Supplier Terms | Propvora",
    description:
      "Propvora Supplier Terms — the agreement for suppliers and tradespeople offering services through the Propvora marketplace.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supplier Terms | Propvora",
    description:
      "Propvora Supplier Terms — the agreement for suppliers and tradespeople offering services through the Propvora marketplace.",
  },
}

export default function SellerAgreementPage() {
  return (
    <LegalLayout title="Supplier Terms" lastUpdated="16 June 2026">
      <Section num="1" title="Who These Terms Are For">
        <p>
          These Supplier Terms (&ldquo;Terms&rdquo;) apply if you register as a supplier or
          tradesperson and offer services through the Propvora marketplace. They form a legally
          binding agreement between you (the &ldquo;Supplier&rdquo;) and Blackwellen Ltd, trading as
          Propvora (&ldquo;Propvora&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or
          &ldquo;us&rdquo;), a company registered in England and Wales under company number 16482166,
          with its registered office at 61 Bridge Street, Kington, HR5 3DJ.
        </p>
        <p>
          They apply in addition to our <a href="/legal/terms">Terms of Service</a>,{" "}
          <a href="/legal/privacy">Privacy Policy</a> and{" "}
          <a href="/legal/acceptable-use">Acceptable Use Policy</a>.
        </p>
      </Section>

      <Section num="2" title="Propvora's Role">
        <p>
          Propvora operates a marketplace that connects suppliers with property operators
          (&ldquo;Operators&rdquo;) who need maintenance, cleaning, compliance and related services.
          Propvora is a technology platform and facilitator. We are not a party to the contract for
          any service you agree to perform — that contract is between you and the Operator.
        </p>
        <p>
          We do not employ suppliers, supervise their work, or guarantee the volume, value or
          frequency of jobs.
        </p>
      </Section>

      <Section num="3" title="Supplier Responsibilities">
        <p>As a Supplier, you are solely responsible for:</p>
        <ul>
          <li>The quality, safety and timely completion of all work you undertake</li>
          <li>Holding and maintaining all licences, registrations and accreditations required for your trade (for example Gas Safe, NICEIC, or equivalent)</li>
          <li>Holding adequate and valid insurance, including public liability insurance, for the work you perform</li>
          <li>Complying with all applicable health and safety, building, and consumer-protection laws</li>
          <li>Providing accurate information about your business, qualifications, coverage areas and availability</li>
          <li>Carrying out any DBS or right-to-work checks required for the work and location</li>
        </ul>
        <p>
          You must keep the documents and evidence on your profile current. We may suspend or remove
          a profile where required documents have lapsed or cannot be verified.
        </p>
      </Section>

      <Section num="4" title="Verification">
        <p>
          We may offer verification of identity, business details, insurance and licences.
          Verification badges indicate that we have received and reviewed evidence at a point in
          time; they are not a guarantee of work quality and do not transfer responsibility for the
          work to Propvora. Operators remain responsible for satisfying themselves that a Supplier is
          suitable for a given job.
        </p>
      </Section>

      <Section num="5" title="Fees and Platform Charges">
        <p>
          Suppliers can register and list on Propvora free of charge. We may charge optional fees
          for enhanced supplier features (for example a Pro Profile, team tools, promoted placement
          or emergency availability), and a platform or service fee on transactions facilitated
          through the marketplace.
        </p>
        <p>
          Where a platform fee applies, the applicable rate will be shown to you before you accept
          the relevant job or feature.{" "}
          <strong>
            The current platform fee is up to 5% of the transaction value.
          </strong>{" "}
          All fees are exclusive of VAT unless stated otherwise.
        </p>
      </Section>

      <Section num="6" title="Payments">
        <p>
          Where payments are processed through the platform, they are handled by our payment
          provider, Stripe, including via Stripe Connect. You must provide accurate payout details
          and complete any identity or business verification Stripe requires. Propvora does not hold
          client money and is not responsible for delays caused by incomplete verification or by the
          payment provider.
        </p>
      </Section>

      <Section num="7" title="Disputes">
        <p>
          Disputes about a service are, in the first instance, between the Supplier and the
          Operator. You agree to engage in good faith to resolve any dispute promptly. Propvora may,
          at its discretion, provide a dispute-resolution process and request evidence (such as
          quotes, photos and messages) from both parties to help reach a fair outcome, but Propvora
          is not obliged to adjudicate and is not liable for the outcome of any dispute.
        </p>
      </Section>

      <Section num="8" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Propvora is not liable for any loss arising from a
          Supplier&rsquo;s work, conduct, or failure to perform, or from any contract between a
          Supplier and an Operator. Our total liability to you in connection with these Terms shall
          not exceed the fees you have paid to us in the 12 months preceding the claim.
        </p>
        <p>
          Nothing in these Terms limits liability for death or personal injury caused by negligence,
          fraud, or any liability that cannot be excluded under English law.
        </p>
      </Section>

      <Section num="9" title="Suspension and Termination">
        <p>
          You may stop using the marketplace at any time. We may suspend or remove a Supplier where
          required documents lapse, where there is a breach of these Terms or our policies, where
          there is evidence of fraud or unsafe work, or where we are required to do so by law.
        </p>
      </Section>

      <Section num="10" title="Governing Law">
        <p>
          These Terms are governed by the laws of England and Wales, and the courts of England and
          Wales have exclusive jurisdiction. For any questions, contact{" "}
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
