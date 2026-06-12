import { Scale } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "Does Propvora handle tenancy agreements?",
    a: "Propvora stores, manages, and tracks tenancy agreements as documents — it does not generate legally binding tenancy agreements. You can upload a signed tenancy agreement to the tenancy record, set all key dates (start date, end date, rent review, break clause), and receive alerts as those dates approach. For creating tenancy agreements, always use a qualified solicitor, a licensed lettings agent, or a template approved by a professional body such as the NRLA (National Residential Landlords Association).",
  },
  {
    q: "Can I manage deposit protection through Propvora?",
    a: "You record deposit protection details within each tenancy record: the deposit scheme (DPS — Deposit Protection Service, TDS — Tenancy Deposit Scheme, or myDeposits), the protection reference number, the date of protection, and the prescribed information service date. Propvora reminds you of the 30-day deadline to protect deposits after receipt of cleared funds. However, Propvora does not hold, receive, or transfer tenant deposits — all deposit management happens directly between you and your chosen government-approved scheme.",
  },
  {
    q: "Does Propvora support the Renters' Rights Bill and changes to Section 21?",
    a: "Propvora is actively monitoring and updating its compliance frameworks in line with the Renters' Rights Bill and broader rental reform legislation. We have removed Section 21 notice templates from the platform in anticipation of their abolition, as relying on them for new proceedings would be legally risky. For any possession proceedings — whether under Section 8 or the new grounds framework that will replace Section 21 — we strongly recommend instructing a solicitor or specialist possession service such as Landlord Action. Propvora will be updated to reflect the new grounds-based possession framework as the legislation comes into force.",
  },
  {
    q: "What happens to my data if I cancel my subscription?",
    a: "When you cancel, your workspace enters read-only mode immediately (or at the end of your current billing period if you cancel before the renewal date). All your data is retained for 30 days in read-only mode, giving you time to export everything. After 30 days, workspace data is securely and permanently deleted in accordance with our Data Retention Policy. We recommend exporting your portfolio, financial data, and documents before the 30-day window closes. Export options are in Settings → Data → Export.",
  },
  {
    q: "Is Propvora GDPR compliant?",
    a: "Yes. Propvora Limited is registered with the Information Commissioner's Office (ICO) as a data controller. We process personal data under GDPR and the UK Data Protection Act 2018. Key commitments: tenant and contact personal data is stored only within the UK and EU EEA, we have appointed a Data Protection Officer, we maintain a Record of Processing Activities, we support your right to respond to data subject access requests (DSARs) with full data exports, and we will notify you of any data breach within 72 hours of becoming aware of it. Our Data Processing Agreement (DPA) is available in Settings → Legal and on request.",
  },
  {
    q: "Does Propvora comply with the UK GDPR rules on handling tenant personal data?",
    a: "Yes. Tenant personal data stored in Propvora (name, contact details, rental history) is processed under the lawful basis of contract performance (managing the tenancy) and legitimate interests (portfolio management). As a landlord or agent using Propvora, you are the data controller for your tenants' data, and Propvora acts as the data processor. Our DPA sets out the responsibilities on both sides. You should include reference to Propvora as a data processor in your privacy notice to tenants, and ensure you only store tenant data you have a lawful basis to process.",
  },
]

export default function FaqLegalSection() {
  return (
    <FaqGroup
      id="legal"
      title="Legal"
      icon={<Scale className="w-5 h-5 text-white" />}
      colour="bg-indigo-600"
      items={items}
    />
  )
}
