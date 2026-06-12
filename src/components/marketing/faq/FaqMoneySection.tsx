import { Wallet } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "How do I record rent payments?",
    a: "Go to Money → Income → Add Income. Select the property and tenancy the payment relates to, enter the amount received and payment date, and optionally link it to an open rent charge. Propvora automatically calculates arrears by comparing expected rent (based on the tenancy rent amount and payment frequency) against recorded income. You can also record partial payments, overpayments, and advance rent, and add a note for any unusual payment.",
  },
  {
    q: "Can I chase rent arrears through Propvora?",
    a: "Yes. Money → Arrears shows all overdue balances across your portfolio, broken down by property and tenancy with the number of days overdue and the total amount owed. From each arrears record you can: log a communication attempt (phone call, email, text), add a follow-up reminder, attach correspondence, and update the arrears status. Automated rent chase email sequences are on the product roadmap for Q2 2025. In the meantime, Propvora gives you the full picture of who owes what so you can manage chasing manually.",
  },
  {
    q: "How do I track property expenses?",
    a: "Money → Expenses → Add Expense. Enter the amount, date, and expense category (choose from: Mortgage Payment, Insurance, Maintenance & Repairs, Agent Management Fees, Ground Rent, Service Charge, Letting Fees, Utilities, Professional Fees, or create a custom category). Link the expense to a specific property. Optionally attach a receipt or invoice. Expenses flow automatically into your P&L reports, broken down by property and category.",
  },
  {
    q: "Can I connect my bank account for automatic transaction imports?",
    a: "Bank feed integration (Open Banking) is on the product roadmap. Currently you can export a CSV transaction file from your bank's online portal and import it into Propvora via Money → Bank → Import Statement. The import wizard matches transactions against your recorded income and expenses and flags unmatched items for manual categorisation. This keeps your records up to date without requiring manual entry of every transaction.",
  },
  {
    q: "How do client accounts work for letting agents?",
    a: "If you manage rental income on behalf of landlord clients, the Client Accounts module provides a ring-fenced ledger for each landlord client. It tracks rent received from tenants on behalf of each landlord, deductions made (management fees, maintenance costs), and disbursements paid out to the landlord. The client account ledger produces a monthly client statement that you can send to each landlord. This helps you comply with your client money handling obligations under RICS, ARLA Propertymark, or NAEA Propertymark codes of conduct.",
  },
  {
    q: "Can I generate rent receipts for tenants?",
    a: "Yes. On any recorded income payment, click 'Generate Receipt' to produce a professionally formatted rent receipt PDF showing the property address, tenancy reference, payment date, amount paid, and payment period covered. Receipts can be downloaded and emailed directly to the tenant from within Propvora.",
  },
  {
    q: "How does service charge and ground rent tracking work for leasehold properties?",
    a: "For leasehold properties in your portfolio, you can set up service charge and ground rent schedules under the property's Finance tab. Define the annual amount, payment frequency (monthly, quarterly, biannually, or annually), and the managing agent or freeholder. Propvora generates the expected charge dates and tracks your payments against them, alerting you when a payment is due. These charges also appear as expenses in your property P&L.",
  },
]

export default function FaqMoneySection() {
  return (
    <FaqGroup
      id="money"
      title="Money"
      icon={<Wallet className="w-5 h-5 text-white" />}
      colour="bg-sky-500"
      items={items}
    />
  )
}
