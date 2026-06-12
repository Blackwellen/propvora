import { BookOpen } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "What accounting features does Propvora include?",
    a: "Propvora's accounting module includes: a full double-entry Chart of Accounts tailored for property businesses, Profit & Loss (P&L) reports by property or portfolio, Trial Balance, Balance Sheet, Cash Flow statement, bank reconciliation, invoice management (raise and track invoices to tenants or clients), Making Tax Digital (MTD) VAT return preparation, and financial forecasting based on your rental income projections. All financial data is organised by property, making it straightforward to understand the performance of each asset.",
  },
  {
    q: "Does Propvora replace my accountant?",
    a: "No, and it's not designed to. Propvora gives you clean, well-organised, real-time financial records that make your accountant's job easier, faster, and less expensive. Your accountant should still prepare your annual statutory accounts, income tax or corporation tax returns, and provide tax planning advice. What Propvora eliminates is the manual, disorganised recordkeeping that adds hours to every accounting engagement — your accountant gets a structured, complete dataset rather than a shoebox of receipts.",
  },
  {
    q: "What is MTD (Making Tax Digital) and how does Propvora support it?",
    a: "Making Tax Digital (MTD) is HMRC's programme requiring businesses to keep digital records and submit certain returns using HMRC-approved software. MTD for VAT has been mandatory for VAT-registered businesses since 2022. Propvora's MTD module allows you to: maintain a digital VAT record, calculate your VAT liability from your income and expenses, review your VAT return summary, and submit directly to HMRC via HMRC's MTD API. For landlords who are also VAT-registered (typically larger property businesses or those providing services), this removes the need for separate accounting software just for VAT filing.",
  },
  {
    q: "Can I export financial data for my accountant?",
    a: "Yes. From Accounting → Reports you can export: a full transaction list (CSV or PDF), P&L by property or portfolio (for any date range), Trial Balance, Balance Sheet, invoice register, and individual expense receipts as a ZIP archive. These exports are designed to be immediately usable by an accountant in practice management software. You can also grant your accountant read-only access to your workspace so they can pull data directly.",
  },
  {
    q: "How does bank reconciliation work in Propvora?",
    a: "Go to Accounting → Bank → Reconcile. Upload your bank statement CSV (most UK banks support this export). Propvora's matching engine compares bank transactions against your recorded income and expenses, automatically matching items with the same amount and a close date. Matched pairs are shown for confirmation; unmatched bank transactions are listed separately for you to either match to an existing record or create a new income/expense entry. Once all items are matched, the reconciliation is marked as complete and locked.",
  },
  {
    q: "Does Propvora support multiple currencies?",
    a: "Your workspace operates in a single base currency (set in Settings → Workspace → Currency). Multi-currency support — for landlords or agents with overseas properties or international clients — is on the roadmap. Currently, all income and expenses must be recorded in your workspace's base currency.",
  },
  {
    q: "Can I raise invoices to tenants or clients directly in Propvora?",
    a: "Yes. Accounting → Invoices → New Invoice. You can raise invoices to tenants (for rent, service charges, or ad hoc charges), to landlord clients (agency management fees, letting fees), or to any contact in your workspace. Each invoice includes your workspace logo and details, the line items with amounts and VAT if applicable, and a due date. Invoices can be sent directly from Propvora by email with a PDF attachment, and payment status (outstanding, part-paid, paid) is tracked automatically.",
  },
]

export default function FaqAccountingSection() {
  return (
    <FaqGroup
      id="accounting"
      title="Accounting"
      icon={<BookOpen className="w-5 h-5 text-white" />}
      colour="bg-emerald-700"
      items={items}
    />
  )
}
