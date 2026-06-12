import { Building2 } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "How many properties can I add to my portfolio?",
    a: "Property limits depend on your plan: Starter allows up to 5 properties, Pro allows up to 50 properties, and Business allows unlimited properties. Units within each property are always unlimited regardless of plan — so a 20-room HMO on the Starter plan counts as one property with 20 units. If you need to upgrade, go to Settings → Billing to change your plan.",
  },
  {
    q: "What is the difference between a 'property' and a 'unit'?",
    a: "A property is the building or address — the physical asset. Units are the individual lettable spaces within it. A standard terraced house has one unit. An HMO with five rooms has five units. A mixed-use commercial and residential block might have a ground-floor retail unit, a first-floor office unit, and two residential flats above. Each unit has its own tenancy, compliance record, and rental income tracking, while property-level records (mortgages, buildings insurance, EPC) sit at the property level.",
  },
  {
    q: "Can I manage HMOs on Propvora?",
    a: "Yes. HMO properties have a dedicated HMO mode with room-by-room management. HMO-specific features include: individual room licences and occupancy tracking, utility billing splits across rooms, HMO licence tracking with expiry alerts, fire safety management at the property and room level, and compliance requirements specific to HMOs under the Housing Act 2004 and the Licensing of Houses in Multiple Occupation (Prescribed Description) (England) Order 2018.",
  },
  {
    q: "How do I add existing tenancies when I first set up my portfolio?",
    a: "Go to Portfolio → Tenancies → Add Tenancy. Link the tenancy to the property and specific unit, enter the start date (you can backdate to the actual tenancy commencement), set the monthly rent, deposit amount, deposit scheme and reference, and key dates (rent review dates, break clauses, end date). You can also upload the signed tenancy agreement as a document. Adding your existing tenancies accurately from the start ensures Propvora's arrears tracking and renewal alerts work correctly from day one.",
  },
  {
    q: "Can I track property values and mortgages?",
    a: "Yes. Each property has a Finance tab where you can record the original purchase price, purchase date, current estimated valuation (manual entry or from an RICS report), and mortgage details including lender name, mortgage type (repayment or interest-only), outstanding balance, interest rate, and term end date. Propvora calculates your LTV (loan-to-value) based on these figures and alerts you when fixed-rate mortgage terms are approaching expiry.",
  },
  {
    q: "Is there a bulk import tool for properties?",
    a: "CSV import for properties and tenancies is available on Pro and Business plans. From the import screen you can download the template, fill in your data (the template includes guidance notes for each column), and upload it. The import wizard validates your data before committing it, flagging any errors (missing required fields, invalid date formats) so you can correct them before the import runs. Contact support if you have more than 200 properties to import — we can assist with bulk data migration.",
  },
  {
    q: "How do I archive or remove a property I've sold?",
    a: "You can archive a property rather than deleting it, which preserves the full history (tenancy history, compliance records, financial data) for your records and accounting purposes. Go to the property → Settings tab → Archive Property. Archived properties are hidden from your active portfolio views but remain accessible from Portfolio → Archived. If you need to permanently delete a property record, contact support — deletion is permanent and cannot be undone.",
  },
]

export default function FaqPortfoliosSection() {
  return (
    <FaqGroup
      id="portfolios"
      title="Portfolios"
      icon={<Building2 className="w-5 h-5 text-white" />}
      colour="bg-blue-500"
      items={items}
    />
  )
}
