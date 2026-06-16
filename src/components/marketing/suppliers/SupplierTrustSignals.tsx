import { ShieldCheck, FileCheck2, UserCheck, Flame } from "lucide-react"

const SIGNALS = [
  {
    icon: UserCheck,
    title: "ID verified",
    desc: "Confirm your identity and business so operators know who they're hiring.",
  },
  {
    icon: ShieldCheck,
    title: "Insured",
    desc: "Display confirmed public liability insurance on your profile.",
  },
  {
    icon: FileCheck2,
    title: "DBS checked",
    desc: "Show a valid DBS check where work involves access to occupied homes.",
  },
  {
    icon: Flame,
    title: "Gas Safe registered",
    desc: "Verify Gas Safe registration and other trade accreditations.",
  },
]

export default function SupplierTrustSignals() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h2 className="text-[32px] sm:text-[40px] font-bold text-[#06122F] leading-tight mb-3">
            Trust is built in
          </h2>
          <p className="text-[16px] text-slate-500 leading-relaxed">
            Verification badges help operators choose you with confidence — and help you win more
            work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SIGNALS.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="text-center rounded-2xl border border-slate-200 bg-slate-50 p-7"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
                  <Icon className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            )
          })}
        </div>

        <p className="text-center text-[12px] text-slate-400 mt-8 max-w-2xl mx-auto">
          Verification requirements vary by trade and jurisdiction. Suppliers are responsible for
          holding the licences, insurance and accreditations required for the work they undertake.
        </p>
      </div>
    </section>
  )
}
