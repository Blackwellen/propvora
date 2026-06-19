import Link from "next/link"
import { ArrowRight, Bot, Building2, CalendarDays, Check, ShieldCheck, WalletCards, Wrench } from "lucide-react"
import PremiumProductImage from "./PremiumProductImage"

const capabilities = [
  { icon: Building2, title: "Portfolio operations", copy: "Properties, units, tenancies, contacts and documents in one structured workspace." },
  { icon: Wrench, title: "Work and maintenance", copy: "Tasks, jobs, suppliers and planned maintenance connected to the right property." },
  { icon: ShieldCheck, title: "Compliance control", copy: "Certificates, inspections, evidence, renewals and risk surfaced before deadlines." },
  { icon: WalletCards, title: "Money visibility", copy: "Income, expenses, invoices, arrears and deposits alongside day-to-day operations." },
  { icon: CalendarDays, title: "One operational calendar", copy: "Work, compliance, tenancy and portfolio events in a single schedule." },
  { icon: Bot, title: "Review-first Copilot", copy: "Summaries and draft actions stay under human control before anything is sent or changed." },
]

const modes = ["Buy-to-let", "HMO", "Serviced accommodation", "Rent-to-rent", "Student lets", "Commercial", "Mixed portfolios"]

export default function LandingPremium() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#f7faff] px-4 pb-20 pt-36 sm:px-6 lg:pb-28 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(124,58,237,0.12),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-600" /> Property operations, connected
          </div>
          <h1 className="mx-auto max-w-5xl text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#06122f] sm:text-6xl lg:text-[78px]">
            Run every property operation with clarity.
          </h1>
          <p className="mx-auto mt-7 max-w-3xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">
            Propvora connects portfolio management, tenancies, work, compliance, money, planning and communication in one operational workspace.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-13 items-center gap-2 rounded-xl bg-blue-600 px-7 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/features" className="inline-flex h-13 items-center rounded-xl border border-slate-300 bg-white px-7 font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700">
              Explore the platform
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {["14-day trial", "No credit card required", "Cancel anytime"].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" />{item}</span>)}
          </div>
          <div className="mx-auto mt-14 max-w-[1220px] lg:mt-20">
            <PremiumProductImage src="/images/marketing/product/enriched/01-home.png" alt="Propvora property operations home dashboard using illustrative demo data" priority />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-7">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 sm:px-6">
          <span className="mr-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Built around how you operate</span>
          {modes.map((mode) => <span key={mode} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">{mode}</span>)}
        </div>
      </section>

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

      <section className="overflow-hidden bg-[#07152d] px-4 py-24 text-white sm:px-6 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">Your portfolio, visible</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">See the whole picture. Act on the detail.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Move from portfolio overview to a property, unit, tenancy, invoice or work item without losing context.</p>
            <Link href="/features" className="mt-8 inline-flex items-center gap-2 font-bold text-sky-300 hover:text-white">See every feature <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <PremiumProductImage src="/images/marketing/product/enriched/02-portfolio.png" alt="Propvora portfolio page with illustrative demo properties" />
        </div>
      </section>

      <section className="bg-[#f7faff] px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-600">Human-controlled AI</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">Ask, review, then decide.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">Copilot can summarise portfolio context and prepare draft actions. You remain responsible for review and approval.</p>
          <div className="mx-auto mt-12 max-w-[1180px]"><PremiumProductImage src="/images/marketing/product/enriched/13-copilot-chat.png" alt="Propvora Copilot preparing review-first draft actions using illustrative demo data" /></div>
        </div>
      </section>

      <section className="bg-white px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-[36px] bg-gradient-to-br from-[#07152d] to-[#102e63] px-6 py-14 text-center text-white shadow-2xl sm:px-12 lg:py-20">
          <h2 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">Bring the operation into one place.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">Start with your current portfolio and explore Propvora with a 14-day trial.</p>
          <Link href="/register" className="mt-8 inline-flex h-13 items-center gap-2 rounded-xl bg-white px-7 font-bold text-[#07152d] hover:bg-blue-50">Start free trial <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  )
}
