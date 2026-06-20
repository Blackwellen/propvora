import { Info } from "lucide-react"

export default function StayComplianceNote() {
  return (
    <div className="py-6 flex items-start gap-2.5">
      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <p className="text-[12px] leading-relaxed text-slate-400">
        This stay is offered directly by the property manager. Local taxes, registration or short-let
        rules may apply. Propvora provides the booking platform and this is not legal or tax advice.
      </p>
    </div>
  )
}
