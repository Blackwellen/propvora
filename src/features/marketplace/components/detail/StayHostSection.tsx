import { ShieldCheck, Award } from "lucide-react"

interface StayHostSectionProps {
  hostName: string | null
}

export default function StayHostSection({ hostName }: StayHostSectionProps) {
  if (!hostName) return null

  return (
    <section className="py-7 border-b border-slate-200">
      <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-5">About your host</h2>
      <div className="flex items-start gap-5">
        <div className="shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#1D4ED8]/30 flex items-center justify-center text-[#1D4ED8] font-bold text-[22px] ring-2 ring-white shadow-md">
            {hostName.slice(0, 1).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold text-[#0B1B3F]">{hostName}</p>
          <p className="text-[13px] text-slate-500 mt-0.5">Professional property manager</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> ID verified
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1D4ED8] bg-blue-50 px-2.5 py-1 rounded-full">
              <Award className="w-3.5 h-3.5" /> Professional PM
            </span>
          </div>
          <p className="mt-3 text-[13.5px] text-slate-600 leading-relaxed">
            To protect your payment, never transfer money or communicate outside of Propvora.
          </p>
        </div>
      </div>
    </section>
  )
}
