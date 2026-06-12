import { Users } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "What types of contacts can I store in Propvora?",
    a: "Propvora supports the following contact types, each with type-specific fields: Landlord (ownership details, ownership structure, tax reference), Tenant (tenancy links, emergency contact, referencing status), Supplier / Contractor (trade categories, insurance details, certifications), Letting Agent (agency name, ARLA/NAEA membership number), Solicitor (law firm, SRA number, practice areas), Mortgage Broker (FCA registration number, lender panel), and a generic Contact type for anyone else. Custom contact types can also be created in Settings.",
  },
  {
    q: "Can I link contacts to properties and tenancies?",
    a: "Yes. Each contact can be linked to one or more properties, tenancies, or jobs. These links create a relational record — the contact's timeline shows all interactions, documents, and jobs across their linked records. For example, a tenant record will show their current tenancy, all rent payments, any maintenance jobs they've reported, and all correspondence. A landlord contact will show their full portfolio of properties managed under your workspace.",
  },
  {
    q: "How do I import existing contacts?",
    a: "Go to Contacts → Import → Download CSV Template. The template has clearly labelled columns for each contact type. Fill in your contacts (you can mix contact types in one import by including a 'Type' column), then upload the completed file. The import wizard validates the data and shows you a preview before committing. Available on all plans. If you're migrating from another property management system, contact our support team — we can help with data mapping.",
  },
  {
    q: "Can I set follow-up reminders on contacts?",
    a: "Yes. On any contact record, click 'Add Reminder' (the bell icon) to set a reminder date, time, and note. On the scheduled date, you'll receive both an in-app notification and an email prompt. Reminders are visible in your Contacts view under the 'Reminders Due' filter, and they also appear on your dashboard's Today widget. You can snooze a reminder or mark it as complete once actioned.",
  },
  {
    q: "Does Propvora have a contact activity timeline?",
    a: "Yes. Every contact has a chronological Activity Timeline that records: calls logged, emails noted, meetings recorded, documents attached, tasks assigned, jobs created, payments linked, and notes added — all with a timestamp and the name of the team member who recorded it. The timeline gives you a complete audit trail of all interactions with that contact, which is particularly useful for dispute resolution, tenancy reference checks, and supplier performance reviews.",
  },
  {
    q: "Can I categorise or tag contacts?",
    a: "Yes. You can apply custom tags to any contact (e.g. 'VIP Landlord', 'Preferred Supplier', 'Outstanding Invoice', 'Do Not Use'). Tags are free-form text that you create yourself. You can filter your contact list by one or more tags to quickly find segments of your contacts. Tags are workspace-specific and visible to all team members.",
  },
  {
    q: "How do I manage GDPR consent for tenant contacts?",
    a: "Each tenant contact record has a GDPR Consent field where you can record the basis of processing (contract, legitimate interests, or explicit consent), the date consent was obtained, and the method (tenancy agreement clause, email, verbal). You can also log the date of any data subject access request (DSAR) and your response. While Propvora helps you record this information, you remain responsible as the data controller for ensuring your processing is lawful.",
  },
]

export default function FaqContactsSection() {
  return (
    <FaqGroup
      id="contacts"
      title="Contacts"
      icon={<Users className="w-5 h-5 text-white" />}
      colour="bg-orange-500"
      items={items}
    />
  )
}
