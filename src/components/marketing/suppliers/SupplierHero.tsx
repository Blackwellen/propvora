import Link from "next/link"
import { ArrowRight, CheckCircle2, Wrench } from "lucide-react"

const SUPPLIER_SIGNUP_HREF = "/register?type=supplier"

export default function SupplierHero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-10 right-1/4 w-[520px] h-[520px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, var(--color-brand-100, #DBEAFE) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-6">
          <Wrench className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[13px] font-semibold text-blue-700">For trades & suppliers</span>
        </div>

        <h1 className="text-[34px] sm:text-[52px] font-bold text-[#06122F] leading-tight tracking-tight mb-5">
          Grow your property maintenance{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            business with Propvora
          </span>
        </h1>

        <p className="text-[17px] text-slate-600 leading-relaxed max-w-2xl mx-auto mb-9">
          Join a marketplace of verified property operators looking for reliable trades. List your
          services, get matched to local jobs, quote and get paid — all in one place. Free to join.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href={SUPPLIER_SIGNUP_HREF}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}
          >
            Register as a supplier
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/marketplace/suppliers"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-[15px] transition-all"
          >
            See the marketplace
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 flex-wrap">
          {["Free to join", "No lead fees to list", "Get verified"].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[12.5px] text-slate-500">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
