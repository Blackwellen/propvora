import {
  Building2,
  Wrench,
  ShieldCheck,
  Wallet,
  CalendarDays,
  Brain,
  Users,
} from "lucide-react"
import WalkthroughStepItem from "./WalkthroughStepItem"

const steps = [
  {
    icon: Building2,
    title: "Set up your portfolio",
    body: "Create your workspace, add properties and units, and record tenancies. Choose your operation profile so the app shapes itself around how you actually work — long-term let, HMO, rent-to-rent, serviced accommodation and more.",
  },
  {
    icon: Users,
    title: "Bring in your contacts",
    body: "Add landlords, tenants, suppliers and professionals in one place. Every record links back to the properties and work it relates to, so context is never more than a click away.",
  },
  {
    icon: Wrench,
    title: "Run the work",
    body: "Raise tasks and jobs, assign them, request supplier quotes, and track everything from new to invoiced. Your team and suppliers stay in sync without endless email threads.",
  },
  {
    icon: ShieldCheck,
    title: "Stay compliant",
    body: "Track certificates, inspections and renewals with clear expiry states. Propvora surfaces what's due so nothing important slips past a deadline.",
  },
  {
    icon: Wallet,
    title: "Control the money",
    body: "Record income and expenses, raise invoices, and use the planning engine to model deal economics — gross and net yield, ROI, breakeven and risk — before you commit.",
  },
  {
    icon: CalendarDays,
    title: "Plan your time",
    body: "A connected calendar pulls together rent dates, tenancy events, inspections, viewings and deadlines across the whole portfolio, in the view that suits you.",
  },
  {
    icon: Brain,
    title: "Work with the AI Copilot",
    body: "Ask questions about your portfolio, draft messages and summarise records. The Copilot keeps a human in control — it proposes, you approve.",
  },
]

export default function WalkthroughStepList() {
  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="relative space-y-8">
          {steps.map((step, i) => (
            <WalkthroughStepItem
              key={step.title}
              icon={step.icon}
              title={step.title}
              body={step.body}
              stepNumber={i + 1}
              isLast={i === steps.length - 1}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}
