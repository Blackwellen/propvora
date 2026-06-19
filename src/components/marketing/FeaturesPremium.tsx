import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import PremiumProductImage from "./PremiumProductImage"

const sections = [
  { eyebrow: "Portfolio", title: "From portfolio to property, unit and tenancy.", copy: "Keep the operational record connected at every level, with relevant finance, compliance, documents and activity close at hand.", images: [["03-property-detail.png", "Property detail"], ["04-unit-detail.png", "Unit detail"], ["05-tenancy.png", "Tenancy detail"]] },
  { eyebrow: "Operations", title: "Coordinate work before it becomes noise.", copy: "Bring reactive work, planned maintenance, suppliers, scheduling and messages into the same operational flow.", images: [["06-work.png", "Work command centre"], ["07-ppm.png", "Planned preventive maintenance"], ["08-calendar.png", "Operational calendar"], ["09-messages.png", "Messages inbox"]] },
  { eyebrow: "Financial control", title: "Understand the money behind the work.", copy: "Track income, expenses, invoices, arrears and cashflow without separating financial context from the portfolio that created it.", images: [["10-money.png", "Money overview"], ["11-invoices.png", "Invoices"]] },
  { eyebrow: "Risk and scale", title: "Control compliance and repeatable workflows.", copy: "Surface expiring obligations, preserve evidence and use review-first automation to prepare safe, reversible next steps.", images: [["12-compliance.png", "Compliance control centre"], ["14-automation.png", "Review-first automations"], ["13-copilot-chat.png", "Propvora Copilot"]] },
  { eyebrow: "Connected portals", title: "Give each participant the right view.", copy: "Dedicated owner, tenant and supplier portals keep communication and operational updates focused without exposing the wider workspace.", images: [["15-landlord-portal.png", "Owner portal"], ["16-tenant-portal.png", "Tenant portal"], ["17-supplier-portal.png", "Supplier portal"]] },
] as const

export default function FeaturesPremium() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#07152d] px-4 pb-24 pt-40 text-white sm:px-6 lg:pb-32 lg:pt-48">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.35),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.25),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">Propvora platform</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">One workspace for the full property operation.</h1>
          <p className="mt-7 max-w-3xl text-xl leading-8 text-slate-300">Explore the implemented product surfaces below. Screens use illustrative demo data and preserve the actual Propvora interface.</p>
          <div className="mt-9 flex flex-wrap gap-4 text-sm text-slate-200">
            {["Portfolio and tenancy", "Work and PPM", "Money and invoices", "Compliance", "Copilot and automations", "Participant portals"].map((x) => <span key={x} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-sky-300" />{x}</span>)}
          </div>
        </div>
      </section>

      {sections.map((section, index) => (
        <section key={section.title} className={index % 2 ? "bg-[#f7faff] px-4 py-24 sm:px-6 lg:py-32" : "bg-white px-4 py-24 sm:px-6 lg:py-32"}>
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{section.eyebrow}</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">{section.title}</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">{section.copy}</p>
            </div>
            <div className="mt-12 grid gap-10">
              {section.images.map(([file, label], imageIndex) => (
                <figure key={file} className={imageIndex % 2 ? "lg:ml-16" : "lg:mr-16"}>
                  <PremiumProductImage src={`/images/marketing/product/enriched/${file}`} alt={`${label} using illustrative Propvora demo data`} priority={index === 0 && imageIndex === 0} />
                  <figcaption className="mt-3 text-center text-sm font-semibold text-slate-500">{label} · illustrative demo data</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="bg-white px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-[36px] bg-[#07152d] px-8 py-16 text-center text-white sm:px-14">
          <h2 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">Explore it with your own workflow.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">Start a 14-day trial or take the guided walkthrough.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 font-bold text-white hover:bg-blue-500">Start free trial <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/walkthrough" className="inline-flex h-13 items-center justify-center rounded-xl border border-white/20 px-7 font-bold hover:bg-white/10">Take the walkthrough</Link>
          </div>
        </div>
      </section>
    </>
  )
}
