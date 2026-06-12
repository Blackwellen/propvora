import { Shield } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "What compliance certificates does Propvora track?",
    a: "Propvora tracks the following statutory and recommended compliance certificates and licences: Gas Safety Certificate (CP12) — annual legal requirement for all gas appliances in rented properties; Electrical Installation Condition Report (EICR) — required every 5 years; Energy Performance Certificate (EPC) — required at the point of letting, valid for 10 years; Fire Safety assessment and alarms; Portable Appliance Testing (PAT) — for furnished properties; Legionella Risk Assessment; HMO Licence (where applicable); Selective Licence (where applicable in designated areas); Planning consents and building regulation sign-offs. Custom certificate types can also be added.",
  },
  {
    q: "How do compliance alerts work?",
    a: "Propvora runs a daily check of all certificate expiry dates across your portfolio. Alerts are triggered at 90 days, 60 days, 30 days, and 7 days before a certificate expires, and again on the expiry date itself. Alerts are delivered as in-app notifications (visible in your notification bell) and by email to all workspace Administrators. You can customise which alert thresholds trigger notifications in Settings → Notifications. Critical expired certificates are also surfaced as urgent items on your dashboard.",
  },
  {
    q: "Can I upload the actual certificate documents?",
    a: "Yes. Each compliance record has a document attachment field where you can upload the PDF or image of the actual certificate. Uploaded documents are stored securely in your workspace document library, linked to the relevant property and compliance record. Document uploads are encrypted at rest and are accessible only to members of your workspace. You can also view a full document history if a certificate is renewed over time.",
  },
  {
    q: "What happens if a certificate expires?",
    a: "When a certificate's expiry date passes, the property's compliance status changes to 'Non-Compliant' and a critical alert is triggered. The property is flagged in red in your Portfolio view and on your dashboard. You are legally required to renew statutory certificates promptly — Propvora does not take enforcement action, but the visible Non-Compliant status serves as a clear prompt. Once you've renewed the certificate and uploaded the new document with the updated expiry date, the status returns to Compliant.",
  },
  {
    q: "Is Propvora's compliance framework specific to England and Wales?",
    a: "Currently yes. The compliance certificate tracking is built around the statutory requirements for residential and HMO rental properties in England and Wales, governed by legislation including the Gas Safety (Installation and Use) Regulations 1998, the Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020, the Energy Efficiency (Private Rented Property) (England and Wales) Regulations 2015, and the Housing Act 2004. Scotland and Northern Ireland have different regulatory frameworks. We are researching Scottish and Northern Irish compliance requirements for a future release.",
  },
  {
    q: "Can I run a compliance report across my whole portfolio?",
    a: "Yes. Compliance → Reports → Portfolio Compliance Report gives you a full snapshot of every property's compliance status: which certificates are current, which are due soon, and which are expired. The report can be filtered by certificate type, property, or compliance status. You can export it to PDF or CSV, which is useful for providing evidence to insurers, lenders, or local authority housing teams.",
  },
]

export default function FaqComplianceSection() {
  return (
    <FaqGroup
      id="compliance"
      title="Compliance"
      icon={<Shield className="w-5 h-5 text-white" />}
      colour="bg-amber-500"
      items={items}
    />
  )
}
