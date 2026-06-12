import { Store } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "What is the Supplier Marketplace?",
    a: "The Supplier Marketplace is a searchable directory of verified trade contractors and service providers within the Propvora network. You can search by trade category (plumbing, electrical, gas, roofing, cleaning, etc.) and by location. When you find a supplier you want to work with, you can add them to your workspace contacts and start assigning them jobs. The Marketplace helps you discover pre-verified suppliers — particularly useful when you need a new contractor in an area where you don't have existing relationships.",
  },
  {
    q: "How are suppliers on the Marketplace verified?",
    a: "Suppliers registered on the Marketplace have submitted the following for verification: proof of business identity (Companies House or sole trader registration), copies of their public liability insurance (minimum £1M cover required), and relevant trade qualifications or certifications (e.g. Gas Safe registration for heating engineers, NICEIC or NAPIT registration for electricians). Verified suppliers display a 'Verified' badge. Propvora re-verifies supplier credentials annually — if a supplier's insurance or qualification lapses, their Verified badge is suspended until they update their documents.",
  },
  {
    q: "Can I invite my own contractors who aren't in the Marketplace?",
    a: "Yes. You don't need to use Marketplace suppliers exclusively. From Contacts → Add Contact → Supplier, you can add any contractor manually and invite them by email to the Supplier Portal. They'll receive a link to create their portal account (no Propvora subscription required) and can then view and manage their assigned jobs. Their contact record in your workspace acts as an internal supplier profile — you can store their qualifications, insurance details, and rate card there.",
  },
  {
    q: "How does the Supplier Portal work for contractors?",
    a: "The Supplier Portal is a separate, stripped-down web interface for contractors. When a supplier logs in, they see only their own assigned jobs — nothing else from your Propvora workspace. For each job, they can: view the job description and access instructions, update the job status (Accepted, In Progress, Awaiting Parts, Complete), upload completion photos and documentation, and submit an invoice with line items and amounts. Invoice submissions from the portal appear in your workspace for review and approval before payment.",
  },
  {
    q: "Can suppliers see my portfolio details, financial data, or other tenants?",
    a: "Absolutely not. Supplier Portal access is completely isolated. A supplier sees only: the job title and description, the property address (for physical access), the target completion date, and their own previously submitted documents and invoices. They have no visibility into your portfolio structure, other tenancies, rent amounts, financial records, or any other supplier's jobs. This isolation is enforced at the database level — it's not just a UI restriction.",
  },
  {
    q: "How do I rate and review suppliers after a job?",
    a: "When a job is marked as complete, you're prompted to leave an internal rating for the supplier (1–5 stars) and a private note. This rating is stored in your workspace and contributes to the supplier's internal performance score visible to your team. Ratings are not publicly visible and are not shared with the supplier — they are for your team's own reference when deciding whether to use a supplier again. Aggregated ratings from across the Propvora network (anonymised) inform the Marketplace ranking.",
  },
]

export default function FaqSupplierSection() {
  return (
    <FaqGroup
      id="suppliers"
      title="Supplier Marketplace"
      icon={<Store className="w-5 h-5 text-white" />}
      colour="bg-indigo-500"
      items={items}
    />
  )
}
