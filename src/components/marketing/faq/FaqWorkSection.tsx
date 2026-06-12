import { Wrench } from "lucide-react"
import { FaqGroup } from "./FaqAccordion"

const items = [
  {
    q: "What is the difference between a Task and a Job?",
    a: "Tasks are internal to-dos assigned to members of your Propvora team. Examples: 'Review lease renewal for unit 3', 'Call tenant about parking dispute', 'Update insurance renewal details'. Jobs are operational work orders for external parties — typically a contractor or supplier. A job includes a description of the work required, the property and unit, an assigned supplier, and cost tracking. Jobs feed into your compliance history and financial records; tasks do not.",
  },
  {
    q: "How do I assign a job to a supplier?",
    a: "Create a Job from Work → Jobs → New Job (or from the property's Work tab). Fill in the job title, description, property and unit, and priority. In the 'Assign to' field, select a supplier from your Contacts or from the Supplier Marketplace. Once assigned, the supplier receives an email notification and can view and update the job through their Supplier Portal. You can also include a target completion date and any access instructions.",
  },
  {
    q: "Can I track costs against a job?",
    a: "Yes. Each job has a Costs tab where you can record: the quoted amount (before work starts), the approved budget, interim costs (e.g. materials), and the final invoiced amount. When a supplier submits an invoice through their portal, it appears in the job's Costs tab for your approval. Approved job costs automatically flow through to your Money module under Expenses, categorised against the relevant property.",
  },
  {
    q: "How do I close out a completed job?",
    a: "Change the job status to 'Complete' from the job detail page or the status dropdown in the job list. You'll be prompted to: confirm the final cost, attach evidence (completion photos, signed completion form, invoice), and optionally link the job to a compliance record (e.g. mark a gas safety check as complete and attach the CP12 certificate). Once completed, the job is archived but remains permanently visible in the property's maintenance history.",
  },
  {
    q: "Can I set up recurring maintenance schedules?",
    a: "Yes. When creating a job or task, toggle 'Recurring' and set the frequency: weekly, fortnightly, monthly, quarterly, biannually, or annually. You can also set a specific day of the week or month. Propvora automatically generates the next occurrence when the current one is marked complete or on the scheduled date. Recurring jobs are useful for quarterly boiler services, monthly fire alarm tests, or annual property inspections.",
  },
  {
    q: "What is PPM (Planned Preventative Maintenance)?",
    a: "PPM is a structured maintenance programme for each property where you define what maintenance needs doing and how often. It's different from reactive maintenance (responding to a fault) — PPM schedules work proactively to prevent failures. In Propvora, you set up a PPM schedule per property, defining maintenance categories (boiler, fire alarms, gutters, lift, etc.) and their service intervals. Propvora then generates jobs automatically on schedule, ensuring nothing falls through the cracks. PPM records also contribute to your compliance audit trail.",
  },
  {
    q: "Can tenants report maintenance issues through Propvora?",
    a: "Tenant-facing maintenance reporting is on the roadmap as part of the Tenant Portal feature planned for late 2025. Currently, maintenance issues are logged by your team on behalf of tenants. You can track tenant communications about maintenance using the Notes and Activity Timeline on each job record.",
  },
  {
    q: "How do I prioritise jobs across my portfolio?",
    a: "Each job has a priority level: Critical (e.g. no heating in winter, structural safety risk), High (e.g. boiler fault, roof leak), Medium (e.g. minor plumbing, door lock stiff), and Low (e.g. cosmetic repairs, garden tidying). The Work → Jobs view can be filtered and sorted by priority, property, supplier, and due date. A dashboard widget also shows your open Critical and High priority jobs so nothing urgent is missed.",
  },
]

export default function FaqWorkSection() {
  return (
    <FaqGroup
      id="work"
      title="Work Management"
      icon={<Wrench className="w-5 h-5 text-white" />}
      colour="bg-emerald-600"
      items={items}
    />
  )
}
