import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Privacy Policy | Propvora",
  description: "Propvora Privacy Policy",
  openGraph: {
    title: "Privacy Policy | Propvora",
    description: "Propvora Privacy Policy",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Propvora",
    description: "Propvora Privacy Policy",
  },
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="2 June 2025">
      <Section num="1" title="Who We Are">
        <p>
          Propvora Ltd (&ldquo;Propvora&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is the data controller for personal data collected through the Propvora platform. We are registered with the Information Commissioner&rsquo;s Office (ICO) in the United Kingdom.
        </p>
        <p>
          This Privacy Policy explains what personal data we collect, how we use it, who we share it with, and what rights you have. It applies to all users of the Propvora website and platform.
        </p>
        <p>
          Contact: <a href="mailto:privacy@propvora.com">privacy@propvora.com</a>
        </p>
      </Section>

      <Section num="2" title="Data We Collect">
        <p>We collect the following categories of personal data:</p>

        <h3>Account Data</h3>
        <ul>
          <li>Name and email address (required for registration)</li>
          <li>Password (stored as a secure hash — we never see your plain-text password)</li>
          <li>Profile information you choose to add (avatar, job title)</li>
          <li>Billing information (name, billing address — payment card details are held by Stripe, not us)</li>
        </ul>

        <h3>Property and Operational Data</h3>
        <ul>
          <li>Property addresses, unit details, financial data, tenancy information you enter into your workspace</li>
          <li>Contact records (landlords, tenants, suppliers, agents) you create within the platform</li>
          <li>Documents and files you upload to your workspace</li>
          <li>This data is yours — we process it only to provide the Service</li>
        </ul>

        <h3>Usage Data</h3>
        <ul>
          <li>Log data: IP address, browser type, pages visited, timestamps</li>
          <li>Device information: operating system, screen resolution</li>
          <li>Feature usage patterns (to improve the Service)</li>
        </ul>

        <h3>AI Copilot Data</h3>
        <ul>
          <li>Queries you submit to the AI Copilot</li>
          <li>Workspace context provided to AI (property names, financial summaries — no raw sensitive data)</li>
        </ul>

        <h3>Communications Data</h3>
        <ul>
          <li>Support queries and correspondence</li>
          <li>Feedback and survey responses</li>
        </ul>
      </Section>

      <Section num="3" title="How We Use Your Data">
        <p>We use your personal data for the following purposes and legal bases:</p>
        <ul>
          <li><strong>To provide the Service:</strong> Processing your account data and workspace content is necessary for the performance of our contract with you.</li>
          <li><strong>To process payments:</strong> Necessary for the performance of our contract. Payment processing is handled by Stripe.</li>
          <li><strong>To send transactional emails:</strong> Account verification, subscription confirmation, security alerts — necessary for the performance of our contract.</li>
          <li><strong>To improve the Service:</strong> Usage analytics to understand how features are used, based on our legitimate interest in improving our platform.</li>
          <li><strong>To communicate product updates:</strong> With your consent, we may send you product news and updates. You can unsubscribe at any time.</li>
          <li><strong>To comply with legal obligations:</strong> Where required by law.</li>
          <li><strong>To detect and prevent fraud:</strong> Based on our legitimate interest in maintaining platform security.</li>
        </ul>
      </Section>

      <Section num="4" title="Third-Party Processors">
        <p>We use the following third-party sub-processors to operate the Service. Each is bound by appropriate data processing agreements:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold text-slate-900">Provider</th>
                <th className="text-left p-3 border border-slate-200 font-semibold text-slate-900">Purpose</th>
                <th className="text-left p-3 border border-slate-200 font-semibold text-slate-900">Location</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Supabase", "Database, authentication, file storage", "EU (AWS Frankfurt)"],
                ["Stripe", "Payment processing and subscription management", "USA/EU (SCCs in place)"],
                ["Resend", "Transactional and marketing email", "USA (SCCs in place)"],
                ["OpenAI", "AI Copilot language model processing", "USA (SCCs in place)"],
                ["Cloudflare", "CDN, DDoS protection, R2 storage", "Global (EU data residency)"],
                ["Vercel", "Platform hosting and deployment", "USA/EU (SCCs in place)"],
              ].map(([provider, purpose, location]) => (
                <tr key={provider} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-medium">{provider}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{purpose}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Where data is transferred outside the UK/EEA, we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the UK ICO.
        </p>
      </Section>

      <Section num="5" title="Data Retention">
        <p>We retain your personal data for the following periods:</p>
        <ul>
          <li><strong>Account data:</strong> Retained for the duration of your subscription, plus 30 days after termination (to allow data export)</li>
          <li><strong>Workspace content:</strong> Deleted 30 days after account closure</li>
          <li><strong>Billing records:</strong> 7 years from the date of the transaction (legal requirement)</li>
          <li><strong>Log data:</strong> 90 days</li>
          <li><strong>Support correspondence:</strong> 3 years</li>
          <li><strong>AI Copilot query logs:</strong> 90 days</li>
        </ul>
        <p>
          You can request deletion of your personal data at any time by contacting us at <a href="mailto:privacy@propvora.com">privacy@propvora.com</a>. Note that we may retain certain data where required by law.
        </p>
      </Section>

      <Section num="6" title="Your Rights Under UK GDPR">
        <p>Under the UK General Data Protection Regulation, you have the following rights:</p>
        <ul>
          <li><strong>Right of access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Right to rectification:</strong> Request correction of inaccurate or incomplete data</li>
          <li><strong>Right to erasure:</strong> Request deletion of your personal data (&ldquo;right to be forgotten&rdquo;), subject to legal obligations</li>
          <li><strong>Right to data portability:</strong> Receive your data in a machine-readable format</li>
          <li><strong>Right to object:</strong> Object to processing based on legitimate interests</li>
          <li><strong>Right to restrict processing:</strong> Request that we limit how we use your data in certain circumstances</li>
          <li><strong>Rights related to automated decision-making:</strong> We do not make solely automated decisions with legal or significant effects</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <a href="mailto:privacy@propvora.com">privacy@propvora.com</a>. We will respond within 30 days. If you are not satisfied with our response, you have the right to lodge a complaint with the ICO at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a> or by calling 0303 123 1113.
        </p>
      </Section>

      <Section num="7" title="Cookies">
        <p>
          We use cookies and similar technologies to operate the Service. Our full Cookie Policy is available at <a href="/legal/cookies">propvora.com/legal/cookies</a>. Essential cookies are required for the Service to function. You can manage non-essential cookies through our cookie consent manager.
        </p>
      </Section>

      <Section num="8" title="Security">
        <p>
          We implement appropriate technical and organisational measures to protect your personal data, including:
        </p>
        <ul>
          <li>TLS encryption for all data in transit</li>
          <li>AES-256 encryption for data at rest</li>
          <li>Row-level security in our database (Supabase RLS)</li>
          <li>Workspace isolation — no cross-tenant data access</li>
          <li>Regular security reviews and penetration testing</li>
          <li>Access controls and audit logging for internal systems</li>
        </ul>
      </Section>

      <Section num="9" title="Children">
        <p>
          The Service is not directed at individuals under the age of 18. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us at <a href="mailto:privacy@propvora.com">privacy@propvora.com</a> and we will delete it promptly.
        </p>
      </Section>

      <Section num="10" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be communicated by email and/or a notice within the Service. The &ldquo;Last updated&rdquo; date at the top of this page indicates when the policy was last revised. Continued use of the Service after changes constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section num="11" title="Contact">
        <p>For privacy-related enquiries:</p>
        <ul>
          <li>Email: <a href="mailto:privacy@propvora.com">privacy@propvora.com</a></li>
          <li>ICO complaints: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a></li>
          <li>ICO helpline: 0303 123 1113</li>
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
      <div className="space-y-4 text-slate-700 leading-relaxed text-sm [&_a]:text-blue-600 [&_a:hover]:text-blue-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-4 [&_h3]:mb-2">
        {children}
      </div>
    </div>
  )
}
