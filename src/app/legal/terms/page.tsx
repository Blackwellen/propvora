import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Terms of Service | Propvora",
  description: "Propvora Terms of Service",
  openGraph: {
    title: "Terms of Service | Propvora",
    description: "Propvora Terms of Service",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Propvora",
    description: "Propvora Terms of Service",
  },
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="1 July 2026">
      <Section num="1" title="Introduction and Acceptance">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Propvora platform, software, and services (collectively, the &ldquo;Service&rdquo;) provided by Blackwellen Ltd, trading as Propvora (&ldquo;Propvora&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), a company registered in England and Wales under company number 16482166, with its registered office at 61 Bridge Street, Kington, HR5 3DJ.
        </p>
        <p>
          By registering for an account, accessing the Service, or clicking &ldquo;I agree&rdquo;, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Service.
        </p>
        <p>
          If you are agreeing to these Terms on behalf of a company or other legal entity, you represent that you have authority to bind that entity to these Terms.
        </p>
      </Section>

      <Section num="2" title="Definitions">
        <p>In these Terms, the following definitions apply:</p>
        <ul>
          <li><strong>User</strong> means any individual who accesses or uses the Service, including the account holder and any invited team members.</li>
          <li><strong>Workspace</strong> means the isolated tenant environment created for each subscribing account, containing that account&rsquo;s property data, documents, and configurations.</li>
          <li><strong>Service</strong> means the Propvora web application, including all modules (Portfolio, Work, Planning, Contacts, Money, Calendar, AI Copilot, Supplier Portal, and Affiliate Programme), APIs, and associated documentation.</li>
          <li><strong>Platform</strong> means the technical infrastructure on which the Service operates, including servers, databases, and third-party integrations.</li>
          <li><strong>Subscription</strong> means a paid plan providing access to the Service, as detailed on the pricing page.</li>
          <li><strong>Content</strong> means any data, text, files, documents, or information submitted to the Service by a User.</li>
          <li><strong>Blackwellen Ltd</strong> means the company providing the Service (trading as Propvora), registered in England and Wales under company number 16482166.</li>
        </ul>
      </Section>

      <Section num="3" title="Service Description">
        <p>
          Propvora is a software-as-a-service (SaaS) platform for property operations management. The Service enables property operators — including rent-to-rent operators, HMO operators, buy-to-let landlords, serviced accommodation operators, and multi-property investors — to manage their portfolios, operations, finances, planning, contacts, and workflow in a single connected platform.
        </p>
        <p>
          The Service includes the following modules: Portfolio Management, Work Hub, Planning Engine, Contacts Hub, Money &amp; Finance, Operational Calendar, AI Copilot, Supplier Portal, and Affiliate Programme. Not all modules are available on all subscription tiers. Feature availability is as described on the pricing page at the time of subscription.
        </p>
        <Callout type="warning">
          <strong>Important:</strong> Propvora is a software tool for property operations management. We do not provide financial, legal, investment, or property advice. We do not hold, manage, or process client money. Nothing on the Platform constitutes regulated financial advice under the Financial Services and Markets Act 2000, nor does it constitute legal advice. You should seek qualified professional advice for all financial, legal, and investment decisions.
        </Callout>
      </Section>

      <Section num="4" title="Account Registration and Responsibilities">
        <p>
          To access the Service, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </p>
        <p>You must:</p>
        <ul>
          <li>Provide truthful and accurate registration information</li>
          <li>Keep your password secure and not share it with third parties</li>
          <li>Notify us immediately at <a href="mailto:support@propvora.com">support@propvora.com</a> of any suspected unauthorised access</li>
          <li>Ensure all team members you invite comply with these Terms</li>
          <li>Be responsible for all actions taken under your Workspace</li>
        </ul>
        <p>
          You must be at least 18 years old to use the Service and must have the legal capacity to enter into a binding agreement.
        </p>
      </Section>

      <Section num="5" title="Subscription and Billing">
        <p>
          Access to the Service is provided on a subscription basis. Subscription plans, pricing, and included features are as described on the Propvora pricing page. By selecting a paid plan, you agree to pay the applicable subscription fees.
        </p>
        <p>
          All payments are processed securely by Stripe. Propvora does not store your payment card details. Subscriptions renew automatically at the end of each billing period (monthly or annual) unless cancelled before the renewal date.
        </p>
        <p>
          <strong>Cancelling.</strong> You may cancel your subscription at any time from your account settings. Cancellation stops the next automatic renewal — your plan then stays fully active until the end of the period you have already paid for, and is not cut off early. To avoid being charged for the next cycle, you must cancel <strong>before</strong> your renewal date.
        </p>
        <p>
          <strong>Refunds.</strong> New paid subscriptions include a 30-day money-back guarantee: if you request a refund within 30 days of your first payment for that subscription, we will refund that first payment in full. After the first 30 days, subscription fees are non-refundable — including for unused time when you cancel part-way through a billing cycle — because the Service has been made available to you throughout the period. Pro-rata or partial-period refunds are not provided outside the 30-day window. This is why we ask you to cancel before your renewal date if you do not want the next cycle.
        </p>
        <p>
          We reserve the right to modify subscription pricing with 30 days&rsquo; notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.
        </p>
        <Callout type="info">
          <strong>In short:</strong> cancel any time and keep access until the end of the period you paid for; cancel before your renewal date to stop the next charge; new subscriptions are covered by a 30-day money-back guarantee, after which fees are non-refundable. Nothing in this section removes any statutory cancellation rights you may have as a consumer.
        </Callout>
      </Section>

      <Section num="6" title="Free Trial">
        <p>
          New accounts may access a 7-day free trial of the Service. No credit card is required during the trial period. At the end of the trial, continued access requires a paid subscription. We reserve the right to modify or discontinue the free trial offer at any time.
        </p>
      </Section>

      <Section num="7" title="Acceptable Use">
        <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not:</p>
        <ul>
          <li>Use the Service for any illegal or unauthorised purpose</li>
          <li>Upload or transmit any harmful, fraudulent, or malicious content</li>
          <li>Attempt to gain unauthorised access to other users&rsquo; workspaces or data</li>
          <li>Use the Service to store, process, or transmit data in violation of applicable laws</li>
          <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
          <li>Use the Service to harass, abuse, or harm any person</li>
          <li>Circumvent any technical measures we use to enforce these Terms</li>
          <li>Use the AI Copilot to generate content intended to mislead or defraud</li>
          <li>Resell or sub-license access to the Service without our prior written consent</li>
        </ul>
        <p>
          Full details of prohibited activities are set out in our Acceptable Use Policy, which forms part of these Terms.
        </p>
      </Section>

      <Section num="8" title="Intellectual Property">
        <p>
          The Service, including its software, design, user interface, content, and brand elements, is the exclusive intellectual property of Blackwellen Ltd (trading as Propvora) and is protected by copyright, trademark, and other applicable laws. These Terms do not grant you any ownership rights in the Service.
        </p>
        <p>
          You retain ownership of all Content you submit to the Service. By submitting Content, you grant Propvora a limited, non-exclusive, royalty-free licence to store, process, and display that Content as necessary to provide the Service to you.
        </p>
        <p>
          Propvora will not use your Content to train AI models, share it with third parties (other than as set out in the Privacy Policy), or use it for any purpose other than operating the Service.
        </p>
      </Section>

      <Section num="9" title="Data and Privacy">
        <p>
          Our collection and use of personal data is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to our data practices as described in the Privacy Policy.
        </p>
        <p>
          If you are a business customer using the Service to process personal data on behalf of others (e.g., tenant personal data), a Data Processing Agreement is available at <a href="/legal/data-processing">propvora.com/legal/data-processing</a>. You may be required to execute a DPA as part of your subscription depending on your usage.
        </p>
      </Section>

      <Section num="10" title="AI Copilot Specific Terms">
        <p>
          The AI Copilot feature uses large language model technology to provide contextual assistance within your workspace. By using the AI Copilot, you acknowledge and agree that:
        </p>
        <ul>
          <li>AI responses may contain errors or inaccuracies and should not be relied upon without independent verification</li>
          <li>The AI Copilot does not provide financial, legal, investment, or professional advice</li>
          <li>All AI-suggested actions require your explicit approval before execution</li>
          <li>Your queries and workspace context may be processed by our AI provider (OpenAI) subject to appropriate data processing agreements</li>
          <li>AI Copilot usage is subject to usage limits as set out in your subscription plan</li>
        </ul>
        <p>
          Full details are set out in our AI Disclaimer at <a href="/legal/ai-disclaimer">propvora.com/legal/ai-disclaimer</a>.
        </p>
      </Section>

      <Section num="11" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, Propvora and its officers, directors, employees, agents, and suppliers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, business, or goodwill, arising from or in connection with your use of the Service.
        </p>
        <p>
          Our total cumulative liability to you in connection with these Terms or the Service shall not exceed the total fees paid by you in the 12 months preceding the claim.
        </p>
        <p>
          Nothing in these Terms excludes or limits our liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded under English law.
        </p>
        <Callout type="warning">
          Propvora is a software operations management tool. We are not liable for any property investment decisions, financial losses, rental income shortfalls, tenancy disputes, or regulatory compliance failures arising from your use of the Service, including outputs from the Planning Engine or AI Copilot. All such decisions remain your sole responsibility.
        </Callout>
      </Section>

      <Section num="12" title="Termination">
        <p>
          You may terminate your account at any time from your account settings or by contacting us at <a href="mailto:info@propvora.com">info@propvora.com</a>.
        </p>
        <p>
          We may suspend or terminate your account immediately if you breach these Terms, engage in fraudulent activity, fail to pay subscription fees, or if we are required to do so by law. We will provide notice where practicable unless doing so would be unlawful or cause harm.
        </p>
        <p>
          Upon termination, your access to the Service will cease. Your workspace data will be retained for 30 days in read-only format, during which time you may export your data. After 30 days, your data will be deleted in accordance with our data retention policy.
        </p>
      </Section>

      <Section num="13" title="Modifications to the Service and Terms">
        <p>
          We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time. We will provide reasonable notice of significant changes. Continued use of the Service after changes constitutes acceptance.
        </p>
        <p>
          We may update these Terms from time to time. Material changes will be communicated by email and/or a notice in the Service. The &ldquo;Last updated&rdquo; date at the top of this page indicates when the Terms were last revised.
        </p>
      </Section>

      <Section num="14" title="Governing Law and Disputes">
        <p>
          These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>
        <p>
          Before initiating any formal dispute resolution, we encourage you to contact us at <a href="mailto:legal@propvora.com">legal@propvora.com</a> to seek an informal resolution.
        </p>
      </Section>

      <Section num="15" title="Contact">
        <p>
          If you have any questions about these Terms, please contact us:
        </p>
        <ul>
          <li>Email: <a href="mailto:legal@propvora.com">legal@propvora.com</a></li>
          <li>General: <a href="mailto:info@propvora.com">info@propvora.com</a></li>
          <li>Registered company: Blackwellen Ltd (Company No. 16482166) trading as Propvora, England and Wales</li>
        </ul>
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

function Callout({ type, children }: { type: "warning" | "info"; children: React.ReactNode }) {
  const styles = {
    warning: "bg-amber-50 border-amber-300 text-amber-900",
    info: "bg-blue-50 border-blue-300 text-blue-900",
  }
  return (
    <div className={`p-4 rounded-xl border-l-4 ${styles[type]} text-sm leading-relaxed my-4`}>
      {children}
    </div>
  )
}
