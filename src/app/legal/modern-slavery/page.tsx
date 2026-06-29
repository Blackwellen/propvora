import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Modern Slavery Statement | Propvora",
  description: "Propvora's voluntary Modern Slavery & Human Trafficking Statement — Blackwellen Ltd's commitment to preventing slavery and human trafficking in its business and supply chains.",
}

export default function ModernSlaveryPage() {
  return (
    <LegalLayout title="Modern Slavery & Human Trafficking Statement" lastUpdated="29 June 2026">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm mb-8">
        <strong>Voluntary statement:</strong> Blackwellen Ltd is a small, early-stage company with an annual turnover below the &pound;36 million threshold set out in section 54 of the Modern Slavery Act 2015. We are therefore <strong>not legally required</strong> to publish a slavery and human trafficking statement. We publish this statement voluntarily, as a matter of good practice and transparency, and intend to keep it under review as our business grows.
      </div>

      <Section num="1" title="Introduction and Scope">
        <p>
          This is the Modern Slavery and Human Trafficking Statement of Blackwellen Ltd (Company No. 16482166), which trades as Propvora (&ldquo;Propvora&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). It is made on a voluntary basis having regard to the principles of section 54 of the Modern Slavery Act 2015, and sets out the steps we have taken, and continue to take, to ensure that slavery, servitude, forced or compulsory labour and human trafficking (together, &ldquo;modern slavery&rdquo;) are not taking place within our business or our supply chains.
        </p>
        <p>
          This statement relates to the financial year 2026 and covers Blackwellen Ltd and the operation of the Propvora service. It applies to all of our people, our suppliers and the third parties we engage to deliver our service. We are committed to acting ethically and with integrity in all of our business relationships.
        </p>
      </Section>

      <Section num="2" title="Our Business and Structure">
        <p>
          Blackwellen Ltd is a private limited company registered in England and Wales, with its registered office at 61 Bridge Street, Kington, England, HR5 3DJ. Trading as Propvora, we are a UK software-as-a-service (SaaS) business that provides property-management software to landlords, letting agents and property professionals.
        </p>
        <p>
          We are a small organisation operating with a lean team. Our work is predominantly digital: we design, build, host and support a cloud-based software platform. We do not manufacture physical products, and we do not operate a manufacturing, agricultural, construction or logistics supply chain of the kind most commonly associated with a high risk of modern slavery. Our supply chain is therefore overwhelmingly composed of digital and professional services.
        </p>
      </Section>

      <Section num="3" title="Our Supply Chains">
        <p>
          As a digital-first SaaS business, our supply chain consists predominantly of cloud infrastructure providers, software vendors and professional service firms rather than producers of physical goods. The principal categories of supplier we engage are:
        </p>
        <ul>
          <li><strong>Cloud infrastructure and hosting:</strong> providers such as Supabase, Vercel and Cloudflare for database hosting, application hosting, content delivery and object storage.</li>
          <li><strong>Payments:</strong> Stripe and similar regulated payment processors for subscription billing and transaction handling.</li>
          <li><strong>Communications:</strong> email delivery providers for transactional and notification messaging.</li>
          <li><strong>Artificial intelligence:</strong> established AI model providers used to power contextual analysis features within the platform.</li>
          <li><strong>Professional services:</strong> accountants, legal advisers, and other professional and software-tooling suppliers that support our day-to-day operations.</li>
          <li><strong>Minimal physical goods:</strong> a small amount of office equipment and IT hardware required by our team.</li>
        </ul>
        <p>
          Because the overwhelming majority of our direct suppliers are large, reputable technology and professional-services firms operating in highly regulated markets, we assess our direct supply-chain exposure to modern slavery as low.
        </p>
      </Section>

      <Section num="4" title="Our Policies">
        <p>
          We have a zero-tolerance approach to modern slavery in all its forms. We are committed to ensuring that there is no modern slavery or human trafficking in any part of our business or supply chains, and we expect the same high standards of everyone we work with. Our policy position is as follows:
        </p>
        <ul>
          <li>We will not knowingly engage, or continue to engage, any supplier, contractor or other business partner that is involved in slavery or human trafficking.</li>
          <li>We expect our suppliers and business partners to comply with the Modern Slavery Act 2015 and all other applicable anti-slavery and human-trafficking laws.</li>
          <li>We expect our suppliers to treat their workers fairly and lawfully, including paying at least the National Minimum Wage or National Living Wage (as applicable) and respecting working-time and employment-rights protections.</li>
          <li>Our recruitment practices are fair, transparent and conducted directly, and we verify the right to work of everyone we engage.</li>
          <li>Our supplier-onboarding practices are designed to favour reputable, established providers and to surface concerns about a supplier&rsquo;s labour and ethical standards before we commit to working with them.</li>
        </ul>
        <p>
          Any concern that our standards may have been breached will be taken seriously and investigated, and we reserve the right to terminate our relationship with any business partner found to be in breach.
        </p>
      </Section>

      <Section num="5" title="Due Diligence">
        <p>
          We take proportionate due-diligence steps appropriate to the size of our business and the nature of our supply chain:
        </p>
        <ul>
          <li>We favour reputable, established providers that maintain their own modern-slavery, ethical-sourcing and ESG (environmental, social and governance) commitments, and whose own published policies and standards we can review.</li>
          <li>We review our suppliers and the services they provide, and we consider their labour and human-rights standards as part of our selection and ongoing-relationship decisions.</li>
          <li>Through the Propvora platform we operate a marketplace in which trade suppliers can be listed and verified. We expect any supplier listed through our marketplace to comply with the law, including modern-slavery, employment and licensing requirements, and our verification and trust-and-safety processes are designed to support that expectation.</li>
          <li>Where we become aware of credible concerns about a supplier, we will investigate and, where appropriate, suspend or end the relationship.</li>
        </ul>
        <p>
          We recognise that, as we grow, our due-diligence processes will need to develop further, and we are committed to strengthening them accordingly.
        </p>
      </Section>

      <Section num="6" title="Risk Assessment">
        <p>
          We assess the risk of modern slavery occurring within our own operations and direct digital supply chain as <strong>low</strong>. Our workforce is small and directly engaged, our pay and recruitment practices are lawful and transparent, and our principal suppliers are large, regulated technology and professional-services firms.
        </p>
        <p>
          We recognise that a higher residual risk sits further from our direct operations &mdash; in particular in the wider property, trades and sub-contracted-labour sectors in which our customers operate. Where our customers engage tradespeople, contractors or sub-contracted labour, those workers are engaged by the customer, not by Propvora. In that context we act as a software provider and facilitator, not as the employer of those workers, and we do not control their terms of engagement.
        </p>
        <p>
          Nevertheless, because our marketplace can connect customers with trade suppliers, we take seriously our role in promoting lawful, ethical engagement. We expect suppliers listed through our platform to comply with the law and we support customers in dealing with verified, compliant suppliers.
        </p>
      </Section>

      <Section num="7" title="Training and Awareness">
        <p>
          We provide our people with awareness of modern-slavery risks that is proportionate to the size of our company. Our team is made aware of the signs of modern slavery and human trafficking, of our zero-tolerance policy, and of how to raise a concern internally or escalate it.
        </p>
        <p>
          As our organisation grows, we intend to formalise and expand this awareness and training, including for anyone involved in supplier selection, marketplace verification and recruitment.
        </p>
      </Section>

      <Section num="8" title="Reporting Concerns">
        <p>
          We encourage anyone &mdash; whether a member of our team, a supplier, a customer or a member of the public &mdash; who suspects that modern slavery or human trafficking may be taking place in connection with our business, our supply chains or our marketplace to report it to us. Concerns can be raised in confidence by emailing <a href="mailto:legal@propvora.com">legal@propvora.com</a>. We will treat all reports seriously, investigate them appropriately, and will not tolerate retaliation against anyone who raises a genuine concern in good faith.
        </p>
        <p>
          If you believe someone is in immediate danger, please contact the police on 999. To report suspected modern slavery, or to seek advice and support, you can also contact the Modern Slavery &amp; Exploitation Helpline on <strong>08000 121 700</strong>, which is available 24 hours a day, 7 days a week.
        </p>
      </Section>

      <Section num="9" title="Approval">
        <p>
          This statement is published voluntarily and has been approved by the directors of Blackwellen Ltd. It will be reviewed and, if necessary, updated annually to reflect changes in our business, our supply chains and our risk profile.
        </p>
        <p>
          For any questions about this statement, please contact us at <a href="mailto:legal@propvora.com">legal@propvora.com</a>.
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
      <div className="space-y-4 text-slate-700 leading-relaxed text-sm [&_a]:text-blue-600 [&_a:hover]:text-blue-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_h3]:mb-2">
        {children}
      </div>
    </div>
  )
}
