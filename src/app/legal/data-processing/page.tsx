import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Data Processing Agreement | Propvora",
  description: "Propvora Data Processing Agreement for business customers — GDPR controller/processor roles, sub-processors, and data transfer mechanisms.",
}

export default function DataProcessingPage() {
  return (
    <LegalLayout title="Data Processing Agreement" lastUpdated="2 June 2025">
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm mb-8">
        <strong>Note:</strong> This Data Processing Agreement (&ldquo;DPA&rdquo;) applies to business customers using Propvora to process personal data on behalf of others (for example, storing and managing tenant personal data). By using the Propvora Service as a business, you agree to the terms of this DPA. This DPA forms part of the Propvora Terms of Service.
      </div>

      <Section num="1" title="Parties and Roles">
        <p>
          This DPA is entered into between:
        </p>
        <ul>
          <li><strong>Data Controller:</strong> You, the business customer who determines the purposes and means of processing personal data using the Propvora platform (&ldquo;Controller&rdquo;).</li>
          <li><strong>Data Processor:</strong> Propvora Ltd, which processes personal data on your behalf in order to provide the Service (&ldquo;Processor&rdquo;).</li>
        </ul>
        <p>
          Where Propvora processes personal data for its own purposes (e.g., account management, billing), Propvora acts as a Data Controller in its own right, as described in the Privacy Policy.
        </p>
      </Section>

      <Section num="2" title="Subject Matter and Purposes of Processing">
        <p>
          Propvora processes personal data on behalf of the Controller for the following purposes:
        </p>
        <ul>
          <li>Storing, retrieving, and displaying property, tenancy, and contact data submitted by the Controller</li>
          <li>Providing the full functionality of the Propvora platform as described in the Terms of Service</li>
          <li>Enabling AI Copilot contextual analysis using anonymised workspace summaries</li>
          <li>Providing document storage and retrieval services</li>
          <li>Generating reports and exports from the Controller&rsquo;s workspace data</li>
        </ul>

        <h3>Categories of Personal Data Processed</h3>
        <ul>
          <li>Tenant data: name, contact details, tenancy terms, rent payment history</li>
          <li>Landlord data: name, contact details, property ownership information</li>
          <li>Supplier/contractor data: name, contact details, job history</li>
          <li>Any other personal data the Controller chooses to store in their workspace</li>
        </ul>

        <h3>Categories of Data Subjects</h3>
        <ul>
          <li>Tenants and occupants of managed properties</li>
          <li>Property owners (landlords)</li>
          <li>Contractors, suppliers, and service providers</li>
          <li>Letting agents and professional contacts</li>
        </ul>
      </Section>

      <Section num="3" title="Processor Obligations">
        <p>Propvora, as Processor, agrees to:</p>
        <ul>
          <li>Process personal data only on documented instructions from the Controller (i.e., providing the Service)</li>
          <li>Ensure that persons authorised to process personal data have committed to confidentiality</li>
          <li>Implement appropriate technical and organisational security measures (as described in section 6)</li>
          <li>Not engage sub-processors without prior authorisation from the Controller (general authorisation is granted through acceptance of this DPA and the sub-processor list in section 5)</li>
          <li>Assist the Controller in responding to data subject requests (access, erasure, portability, rectification)</li>
          <li>Notify the Controller without undue delay (and within 72 hours where feasible) of any personal data breach</li>
          <li>Provide all information necessary to demonstrate compliance with the GDPR</li>
          <li>Delete or return all personal data to the Controller upon termination of services</li>
        </ul>
      </Section>

      <Section num="4" title="Controller Obligations">
        <p>The Controller agrees to:</p>
        <ul>
          <li>Have a lawful basis for processing personal data stored in the Propvora workspace</li>
          <li>Comply with applicable data protection legislation, including UK GDPR</li>
          <li>Provide fair processing notices to data subjects whose data is stored in the workspace</li>
          <li>Respond to data subject requests using the tools provided in the Propvora platform</li>
          <li>Notify Propvora promptly of any data subject requests, complaints, or data breach incidents related to workspace data</li>
          <li>Not submit special category personal data (health, financial account numbers, etc.) to the Service unless necessary and with appropriate safeguards</li>
        </ul>
      </Section>

      <Section num="5" title="Sub-Processors">
        <p>
          The Controller grants general authorisation for Propvora to engage the following sub-processors. Propvora will provide 30 days&rsquo; notice of any changes to this list:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-3 border border-slate-200 font-semibold">Sub-Processor</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Purpose</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Location</th>
                <th className="text-left p-3 border border-slate-200 font-semibold">Transfer Mechanism</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Supabase Inc.", "Database hosting, authentication, file storage", "EU (AWS Frankfurt)", "EU Standard Terms"],
                ["Stripe Inc.", "Payment processing and subscription management", "USA / EU", "UK SCCs"],
                ["Resend Inc.", "Transactional and notification email delivery", "USA", "UK SCCs"],
                ["OpenAI LP", "AI Copilot language model processing", "USA", "UK SCCs"],
                ["Cloudflare Inc.", "CDN, security, R2 object storage", "Global (EU data residency options)", "UK SCCs"],
                ["Vercel Inc.", "Platform hosting and serverless compute", "USA / EU", "UK SCCs"],
              ].map(([name, purpose, location, mechanism]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="p-3 border border-slate-200 font-medium">{name}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{purpose}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{location}</td>
                  <td className="p-3 border border-slate-200 text-slate-600">{mechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Where personal data is transferred to countries outside the UK/EEA, we rely on UK Standard Contractual Clauses (SCCs) as approved by the ICO, or other lawful transfer mechanisms.
        </p>
      </Section>

      <Section num="6" title="Security Measures">
        <p>
          Propvora implements the following technical and organisational security measures:
        </p>
        <ul>
          <li><strong>Encryption in transit:</strong> All data is encrypted using TLS 1.2 or higher</li>
          <li><strong>Encryption at rest:</strong> Database and storage encryption using AES-256</li>
          <li><strong>Access controls:</strong> Role-based access control with principle of least privilege</li>
          <li><strong>Workspace isolation:</strong> Row-level security ensures complete data isolation between tenants</li>
          <li><strong>Authentication:</strong> Multi-factor authentication available for all user accounts</li>
          <li><strong>Audit logging:</strong> All data access and modification events are logged</li>
          <li><strong>Backup and recovery:</strong> Daily automated backups with 30-day retention</li>
          <li><strong>Vulnerability management:</strong> Regular security reviews and dependency updates</li>
          <li><strong>Incident response:</strong> Documented incident response procedure with 72-hour notification commitment</li>
        </ul>
      </Section>

      <Section num="7" title="Data Breach Notification">
        <p>
          In the event of a personal data breach affecting the Controller&rsquo;s workspace data, Propvora will:
        </p>
        <ul>
          <li>Notify the Controller without undue delay and within 72 hours of becoming aware of the breach</li>
          <li>Provide the nature of the breach, categories and approximate number of data subjects affected, likely consequences, and measures taken or proposed</li>
          <li>Cooperate fully with the Controller&rsquo;s investigation and remediation efforts</li>
          <li>Notify the Controller at the email address on their account, and via the in-app notification system</li>
        </ul>
        <p>
          The Controller remains responsible for notifying the ICO and affected data subjects where required under UK GDPR.
        </p>
      </Section>

      <Section num="8" title="Data Deletion and Return">
        <p>
          Upon termination of the Service or upon request, Propvora will:
        </p>
        <ul>
          <li>Provide the Controller with access to export their workspace data for 30 days following termination</li>
          <li>Permanently delete all workspace personal data after the 30-day export period</li>
          <li>Certify deletion in writing upon request</li>
          <li>Ensure sub-processors also delete the relevant data</li>
        </ul>
      </Section>

      <Section num="9" title="Governing Law">
        <p>
          This DPA is governed by English law. Any disputes shall be resolved in the courts of England and Wales.
        </p>
      </Section>

      <Section num="10" title="Contact">
        <p>
          For DPA-related enquiries: <a href="mailto:privacy@propvora.com">privacy@propvora.com</a>
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
