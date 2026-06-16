import { ClipboardList, MapPinned, BadgePoundSterling } from "lucide-react"

const STEPS = [
  {
    icon: ClipboardList,
    title: "List your services",
    desc: "Create your supplier profile, pick your trades and coverage areas, and add your insurance and licence details.",
  },
  {
    icon: MapPinned,
    title: "Get matched",
    desc: "Operators in your area find you by trade and location. Receive job invitations directly to your workspace.",
  },
  {
    icon: BadgePoundSterling,
    title: "Quote & get paid",
    desc: "Send quotes, complete the work and raise invoices. Payments are processed securely through the platform.",
  },
]

export default function HowItWorksSupplier() {
  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h2 className="text-[32px] sm:text-[40px] font-bold text-[#06122F] leading-tight mb-3">
            How it works
          </h2>
          <p className="text-[16px] text-slate-500 leading-relaxed">
            Three steps from sign-up to getting paid for property maintenance work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="relative bg-white rounded-2xl border border-slate-200 p-7 shadow-sm"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-[17px] font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
