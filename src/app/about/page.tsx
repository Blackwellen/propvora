import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Compass, Layers3, ShieldCheck, Sparkles } from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"

export const metadata: Metadata = {
  title: "About Propvora",
  description: "Why Propvora exists and the principles behind its connected property operations platform.",
}

const principles = [
  { icon: Layers3, title: "Operations before optics", copy: "Propvora is designed around the records, deadlines, decisions and hand-offs involved in running property." },
  { icon: Compass, title: "Context over fragmentation", copy: "Property, tenancy, work, compliance and financial context should reinforce each other instead of living in separate tools." },
  { icon: ShieldCheck, title: "Control by design", copy: "Permissions, evidence, auditability and human approval belong inside the workflow, not as an afterthought." },
  { icon: Sparkles, title: "Useful AI, clearly bounded", copy: "AI can summarise and prepare work. People remain responsible for reviewing decisions and approving actions." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <section className="relative overflow-hidden bg-[#07152d] px-4 pb-28 pt-40 text-white sm:px-6 lg:pb-36 lg:pt-48">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_8%,rgba(37,99,235,0.38),transparent_34%),radial-gradient(circle_at_82%_25%,rgba(14,165,233,0.18),transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">About Propvora</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Property deserves an operational system, not another spreadsheet.</h1>
            <p className="mt-7 max-w-3xl text-xl leading-9 text-slate-300">Propvora is being built to connect the practical work of running property: the portfolio, people, deadlines, maintenance, compliance, communication and money behind every decision.</p>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Why we build</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">The work is connected. The software should be too.</h2>
            </div>
            <div className="space-y-6 text-lg leading-8 text-slate-600">
              <p>Property operations are often split across spreadsheets, inboxes, calendars, accounting tools, document folders and supplier messages. Each tool holds a fragment; the operator carries the context.</p>
              <p>Propvora brings that context into one workspace. A compliance deadline can relate to a property, trigger work, involve a supplier, create a cost and remain visible in the operational calendar. That connection is the product.</p>
              <p>We avoid invented customer stories, adoption figures and outcome guarantees. The public product story should be grounded in implemented capabilities and clearly identified illustrative demo data.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-[#f7faff] px-4 py-24 sm:px-6 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Product principles</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">A serious operating layer for serious work.</h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {principles.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-6 text-xl font-bold text-slate-950">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:py-32">
          <div className="mx-auto max-w-5xl rounded-[36px] bg-gradient-to-br from-[#07152d] to-[#12356f] px-8 py-16 text-center text-white sm:px-14 lg:py-20">
            <h2 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">See the product, not a promise.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">Explore the implemented platform surfaces and decide how they fit your operation.</p>
            <Link href="/features" className="mt-8 inline-flex h-13 items-center gap-2 rounded-xl bg-white px-7 font-bold text-[#07152d] hover:bg-blue-50">Explore features <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
