import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

const SUPPLIER_SIGNUP_HREF = "/register?type=supplier"

export default function SupplierSignupCTA() {
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
        <h2 className="text-[32px] sm:text-[46px] font-bold text-white leading-tight mb-5">
          Ready to win more property work?
        </h2>
        <p className="text-white/70 text-[17px] leading-relaxed mb-9 max-w-xl mx-auto">
          Register as a supplier, get verified, and start receiving job invitations from property
          operators in your area. It&apos;s free to join.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href={SUPPLIER_SIGNUP_HREF}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "0 8px 28px rgba(37,99,235,0.4)" }}
          >
            Register as a supplier
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold text-[15px] transition-colors"
          >
            Talk to our team
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 flex-wrap">
          {["Free to join", "Get verified", "No lead fees to list"].map((t) => (
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
