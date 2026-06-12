import type { Metadata } from "next"
import LegalLayout from "@/components/marketing/LegalLayout"

export const metadata: Metadata = {
  title: "Acceptable Use Policy | Propvora",
  description: "Propvora Acceptable Use Policy — rules governing acceptable use of the platform, prohibited activities, and enforcement measures.",
}

export default function AcceptableUsePage() {
  return (
    <LegalLayout title="Acceptable Use Policy" lastUpdated="2 June 2025">
      <Section num="1" title="Purpose">
        <p>
          This Acceptable Use Policy (&ldquo;AUP&rdquo;) sets out the rules for how you may use the Propvora platform. It forms part of the Propvora Terms of Service. By using the Service, you agree to comply with this AUP.
        </p>
        <p>
          This policy exists to protect the integrity of the platform, protect other users, and ensure Propvora remains a trusted tool for property operators.
        </p>
      </Section>

      <Section num="2" title="Prohibited Activities">
        <p>You must not use the Propvora platform to:</p>

        <h3>Illegal Activities</h3>
        <ul>
          <li>Engage in, facilitate, or promote any illegal activity under UK law or the laws of any jurisdiction</li>
          <li>Store, process, or transmit data in connection with money laundering, fraud, or financial crime</li>
          <li>Use the platform in connection with unlicensed property management activities where licensing is required</li>
          <li>Facilitate illegal subletting or tenancy arrangements</li>
          <li>Store personal data of tenants or other individuals in ways that violate UK GDPR</li>
        </ul>

        <h3>Technical Misuse</h3>
        <ul>
          <li>Attempt to gain unauthorised access to any other user&rsquo;s workspace, account, or data</li>
          <li>Probe, scan, or test the vulnerability of the platform&rsquo;s systems</li>
          <li>Introduce malicious code, viruses, or other harmful software</li>
          <li>Conduct denial-of-service attacks or other attacks that disrupt the Service</li>
          <li>Reverse engineer, decompile, or attempt to extract source code from the platform</li>
          <li>Use automated scripts or bots to scrape data from the platform</li>
          <li>Circumvent any rate limits, access controls, or security measures</li>
        </ul>

        <h3>Content Violations</h3>
        <ul>
          <li>Upload content that is abusive, harassing, defamatory, discriminatory, or obscene</li>
          <li>Store or transmit content that infringes third-party intellectual property rights</li>
          <li>Upload files containing known malware, viruses, or malicious code</li>
          <li>Use the platform to send spam, phishing emails, or unsolicited communications</li>
        </ul>

        <h3>Misuse of AI Copilot</h3>
        <ul>
          <li>Attempt to extract proprietary information about the underlying AI models</li>
          <li>Use the AI Copilot to generate content intended to mislead, defraud, or harm others</li>
          <li>Attempt to &ldquo;jailbreak&rdquo; or circumvent the AI safety and content filters</li>
          <li>Use AI outputs as a substitute for professional financial, legal, or property advice without independent verification</li>
          <li>Use AI-generated landlord offer letters that contain false representations</li>
        </ul>

        <h3>Commercial Misuse</h3>
        <ul>
          <li>Resell, sublicense, or provide access to the Service to third parties without our prior written consent</li>
          <li>Use the Service to build a competing product or service</li>
          <li>Create multiple free trial accounts to circumvent trial limits</li>
        </ul>
      </Section>

      <Section num="3" title="Property Data Usage Rules">
        <p>
          The Propvora platform is designed to store and process data about properties, tenancies, finances, and related contacts. When using the platform with data relating to real people (tenants, landlords, suppliers):
        </p>
        <ul>
          <li>You must have a lawful basis under UK GDPR to store and process their personal data</li>
          <li>You must comply with your obligations as a data controller for the personal data you manage</li>
          <li>You must not store more personal data than is necessary for your property management purposes</li>
          <li>You must respond to data subject requests (access, erasure, etc.) in relation to data you hold in your workspace</li>
          <li>Tenant financial data (bank account numbers, etc.) should not be stored in unencrypted document fields</li>
          <li>You are responsible for ensuring any documents you upload do not violate the privacy rights of the individuals named in them</li>
        </ul>
      </Section>

      <Section num="4" title="AI Usage Rules">
        <p>When using the AI Copilot feature:</p>
        <ul>
          <li>Do not submit personal data about individuals beyond what is necessary for the query</li>
          <li>Do not use AI outputs to make regulated financial decisions without professional advice</li>
          <li>Do not use AI-generated lease documents, legal notices, or contracts without review by a qualified professional</li>
          <li>You are responsible for reviewing and approving any AI-suggested actions before they are applied to your workspace</li>
          <li>Do not share AI Copilot outputs publicly in ways that misrepresent them as professional advice</li>
        </ul>
      </Section>

      <Section num="5" title="Reporting Violations">
        <p>
          If you become aware of any use of the Propvora platform that violates this AUP, please report it to us at <a href="mailto:abuse@propvora.com">abuse@propvora.com</a>. We take all reports seriously and will investigate within 5 business days.
        </p>
      </Section>

      <Section num="6" title="Enforcement and Consequences">
        <p>
          We reserve the right to take action against any user or account that violates this AUP, including:
        </p>
        <ul>
          <li><strong>Warning:</strong> A formal notice for minor or first-time violations</li>
          <li><strong>Temporary suspension:</strong> Account access suspended pending investigation</li>
          <li><strong>Immediate termination:</strong> For serious violations, repeated violations, or illegal activity</li>
          <li><strong>Reporting to authorities:</strong> Where illegal activity is identified, we will cooperate with law enforcement</li>
          <li><strong>Civil action:</strong> We reserve the right to pursue civil remedies for damages caused by AUP violations</li>
        </ul>
        <p>
          We will provide notice and opportunity to respond where possible, except where the violation requires immediate action to protect the platform or other users.
        </p>
      </Section>

      <Section num="7" title="Contact">
        <p>
          Questions about this policy: <a href="mailto:legal@propvora.com">legal@propvora.com</a>
          <br />
          Report abuse: <a href="mailto:abuse@propvora.com">abuse@propvora.com</a>
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
