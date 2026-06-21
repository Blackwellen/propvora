import { Bot, Building2, CalendarDays, ShieldCheck, WalletCards, Wrench } from "lucide-react"

const capabilities = [
  { icon: Building2, title: "Portfolio operations", copy: "Properties, units, tenancies, contacts and documents in one structured workspace." },
  { icon: Wrench, title: "Work and maintenance", copy: "Tasks, jobs, suppliers and planned maintenance connected to the right property." },
  { icon: ShieldCheck, title: "Compliance control", copy: "Certificates, inspections, evidence, renewals and risk surfaced before deadlines." },
  { icon: WalletCards, title: "Money visibility", copy: "Income, expenses, invoices, arrears and deposits alongside day-to-day operations." },
  { icon: CalendarDays, title: "One operational calendar", copy: "Work, compliance, tenancy and portfolio events in a single schedule." },
  { icon: Bot, title: "Review-first Copilot", copy: "Summaries and draft actions stay under human control before anything is sent or changed." },
]

export default function LandingCapabilitiesSection() {
  return (
    <section className="bg-white px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">One connected system</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">The operational layer your portfolio was missing.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">Every capability is linked to the same properties, people and workflow history, reducing duplicated admin and disconnected records.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
              <p className="mt-2 leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
