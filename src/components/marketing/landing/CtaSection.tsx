import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export default function CtaSection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg-marketing-dark)" }}>
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, var(--brand) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-[34px] sm:text-[48px] font-bold text-white leading-tight mb-5">
          Start your free trial
        </h2>
        <p className="text-white/70 text-[17px] leading-relaxed mb-9 max-w-xl mx-auto">
          Set up your workspace in minutes and bring your whole property operation into one place.
          No credit card required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "0 8px 28px rgba(37,99,235,0.4)" }}
          >
            Start your free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold text-[15px] transition-colors"
          >
            Book a demo
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 flex-wrap">
          {["No credit card required", "Setup in minutes", "Cancel anytime"].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-[13px] text-white/60">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
