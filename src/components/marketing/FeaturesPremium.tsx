import Link from "next/link"
import { ArrowRight, Check, Scale, Workflow } from "lucide-react"
import PremiumProductImage from "./PremiumProductImage"

const sections = [
  { eyebrow: "Portfolio", title: "A connected operational record.", copy: "Move from portfolio to property, unit and tenancy without losing the financial, compliance or activity context around it.", points: ["Structured property and unit records", "Tenancy timeline and linked documents", "Operational activity in context"], images: [["03-property-detail.png", "Property detail"], ["04-unit-detail.png", "Unit detail"], ["05-tenancy.png", "Tenancy detail"]] },
  { eyebrow: "Work and planning", title: "Coordinate reactive and planned work.", copy: "Prioritise jobs, recurring maintenance, suppliers, schedules and conversations in one operating flow.", points: ["Work queues and ownership", "Planned preventive maintenance", "Calendar and message coordination"], images: [["06-work.png", "Work command centre"], ["07-ppm.png", "PPM schedules"], ["08-calendar.png", "Operational calendar"], ["09-messages.png", "Messages"]] },
  { eyebrow: "Money", title: "See the financial position behind the operation.", copy: "Income, expenses and invoices stay connected to the records and work that created them.", points: ["Portfolio-level money overview", "Invoice status and follow-up", "Traceable operational context"], images: [["10-money.png", "Money overview"], ["11-invoices.png", "Invoices"]] },
  { eyebrow: "Compliance", title: "Make obligations visible before they become urgent.", copy: "Track evidence, renewal dates, ownership and status across the portfolio.", points: ["Expiry and renewal oversight", "Evidence linked to the right asset", "Clear responsibility and audit context"], images: [["12-compliance.png", "Compliance control centre"]] },
  { eyebrow: "Automations", title: "Repeatable workflows, with review built in.", copy: "Use Canvas Lite to prepare and coordinate recurring operational steps while keeping material actions under human control.", points: ["Trigger-based operational recipes", "Visible run status and exceptions", "Human review before consequential actions"], icon: Workflow, images: [["14-automation.png", "Automation workspace"], ["13-copilot-chat.png", "Review-first Copilot"]] },
  { eyebrow: "Legal readiness", title: "Keep legal work connected to the case record.", copy: "Organise notices, evidence, milestones and next steps without presenting workflow support as legal advice.", points: ["Case and notice preparation", "Evidence and document trail", "Milestones with review checkpoints"], icon: Scale, images: [["18-legal.png", "Legal workspace"]] },
  { eyebrow: "Connected portals", title: "A focused workspace for every participant.", copy: "Landlords, tenants and suppliers receive the information and actions relevant to them, using the same coherent Propvora interface.", points: ["Role-specific navigation", "Secure documents and updates", "Consistent work and communication context"], images: [["15-landlord-portal.png", "Landlord portal"], ["16-tenant-portal.png", "Tenant portal"], ["17-supplier-portal.png", "Supplier portal"]] },
] as const

export default function FeaturesPremium() {
  return <>
    <section className="relative overflow-hidden bg-white px-4 pb-24 pt-40 sm:px-6 lg:pb-32 lg:pt-48">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.14),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.10),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Propvora platform</p>
        <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[1.02] tracking-[-0.055em] text-[#06122f] sm:text-6xl lg:text-7xl">One workspace for the full property operation.</h1>
        <p className="mt-7 max-w-3xl text-xl leading-8 text-slate-600">Explore real product surfaces using illustrative demo data, with the workflow around each screen explained clearly.</p>
      </div>
    </section>

    {sections.map((section, index) => (
      <section key={section.title} className={`${index % 2 ? "bg-[#f7faff]" : "bg-white"} px-4 py-24 sm:px-6 lg:py-32`}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{section.eyebrow}</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">{section.title}</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">{section.copy}</p>
              <ul className="mt-7 space-y-3">
                {section.points.map(point => <li key={point} className="flex gap-3 text-sm font-semibold text-slate-700"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-100"><Check className="h-3 w-3 text-blue-700" /></span>{point}</li>)}
              </ul>
            </div>
            <div className="space-y-8">
              {section.images.map(([file, label], imageIndex) => <figure key={file}>
                <PremiumProductImage label={label} src={`/images/marketing/product/enriched/${file}`} alt={`${label} using illustrative Propvora demo data`} priority={index === 0 && imageIndex === 0} />
                <figcaption className="mt-3 flex items-center justify-between px-2 text-xs text-slate-500"><span className="font-bold text-slate-700">{label}</span><span>Illustrative demo data</span></figcaption>
              </figure>)}
            </div>
          </div>
        </div>
      </section>
    ))}

    <section className="bg-white px-4 py-24 sm:px-6"><div className="mx-auto max-w-5xl rounded-[36px] bg-[#07152d] px-8 py-16 text-center text-white sm:px-14"><h2 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">Explore it with your own workflow.</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">Start a 14-day trial or take the guided walkthrough.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/register" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 font-bold text-white hover:bg-blue-500">Start free trial <ArrowRight className="h-4 w-4" /></Link><Link href="/walkthrough" className="inline-flex h-13 items-center justify-center rounded-xl border border-white/20 px-7 font-bold hover:bg-white/10">Take the walkthrough</Link></div></div></section>
  </>
}
