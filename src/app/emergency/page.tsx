import type { Metadata } from "next"
import Link from "next/link"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import { Phone, Zap, Droplets, Flame, AlertTriangle, Clock, Shield, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Emergency Services | Propvora — 24/7 emergency property contractors",
  description:
    "Find emergency property contractors available 24/7. Plumbers, electricians, locksmiths and gas engineers dispatched fast.",
  openGraph: {
    title: "Emergency Services | Propvora",
    description: "24/7 emergency property contractors — dispatched fast when it matters most.",
    type: "website",
  },
}

const EMERGENCY_CATEGORIES = [
  { icon: Droplets, label: "Emergency Plumber", desc: "Burst pipes, flooding, no water", urgent: true },
  { icon: Zap, label: "Emergency Electrician", desc: "Power failure, exposed wires, sparks", urgent: true },
  { icon: Flame, label: "Boiler Breakdown", desc: "No heating or hot water", urgent: true },
  { icon: AlertTriangle, label: "Gas Leak Response", desc: "Suspected gas leak — call 0800 111 999 first", urgent: true },
  { icon: Shield, label: "Emergency Locksmith", desc: "Locked out, break-in, door failure", urgent: false },
  { icon: Droplets, label: "Flood Response", desc: "Water ingress, storm damage, drain overflow", urgent: false },
  { icon: Flame, label: "Fire Damage Response", desc: "Post-fire assessment and boarding", urgent: false },
  { icon: Zap, label: "No Hot Water", desc: "Immersion heater, boiler or cylinder fault", urgent: false },
  { icon: Shield, label: "Security Boarding", desc: "Broken windows, forced entry", urgent: false },
  { icon: AlertTriangle, label: "Pest Emergency", desc: "Wasps, rodents, urgent infestation", urgent: false },
  { icon: Droplets, label: "Drain Blockage", desc: "Sewage backup, blocked drain", urgent: false },
  { icon: Shield, label: "Alarm / CCTV Failure", desc: "Security system offline or triggered", urgent: false },
]

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Urgent banner */}
      <div className="bg-red-600 text-white text-center py-3 px-4 text-sm font-semibold mt-20">
        ⚠️ If there is risk to life or a gas leak — call 999 or National Gas Emergency 0800 111 999 immediately
      </div>

      {/* Hero */}
      <section className="pt-12 pb-16 px-4 bg-gradient-to-b from-red-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-6">
            <Phone className="h-4 w-4" />
            Emergency dispatch available 24/7
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Emergency property<br />services — fast
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
            Verified emergency contractors dispatched when you need them most. Available round the clock, 365 days a year.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Zap className="h-4 w-4" />
              Dispatch emergency now
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-semibold rounded-xl transition-colors"
            >
              Sign up free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How fast */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Clock, label: "< 15 min", desc: "Average time to find a matched supplier" },
              { icon: Phone, label: "24 / 7 / 365", desc: "Emergency network active around the clock" },
              { icon: Shield, label: "Fully verified", desc: "ID, insurance & licence checked before listing" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center p-6 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mb-1">{label}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency categories */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Emergency categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EMERGENCY_CATEGORIES.map(({ icon: Icon, label, desc, urgent }) => (
              <div
                key={label}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                  urgent
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  urgent ? "bg-red-100" : "bg-slate-100"
                }`}>
                  <Icon className={`h-5 w-5 ${urgent ? "text-red-600" : "text-slate-600"}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm mb-0.5 ${urgent ? "text-red-800" : "text-slate-900"}`}>
                    {urgent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 mb-0.5 align-middle" />}
                    {label}
                  </p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For property managers */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-900 to-red-950 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Property manager?</h2>
          <p className="text-slate-300 mb-8 max-w-md mx-auto">
            Connect your portfolio to the emergency dispatch network. Get instant contractor matching when issues arise.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
