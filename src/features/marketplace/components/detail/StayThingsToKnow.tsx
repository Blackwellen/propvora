import { STAY_POLICY_LABEL } from "@/components/booking/StayListingCard"

interface RuleEntry {
  label: string
  value: string
}

interface StayThingsToKnowProps {
  checkInWindow: string | null
  checkoutTime: string | null
  rules: RuleEntry[]
  cancellationPolicy: string | null
  complianceStatus: string | null
}

export default function StayThingsToKnow({
  checkInWindow,
  checkoutTime,
  rules,
  cancellationPolicy,
  complianceStatus,
}: StayThingsToKnowProps) {
  return (
    <section className="py-7 border-b border-slate-200">
      <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">Things to know</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <p className="text-[13.5px] font-bold text-[#0B1B3F] mb-2">House rules</p>
          <ul className="space-y-1.5 text-[13px] text-slate-500">
            {checkInWindow && <li>Check-in: {checkInWindow}</li>}
            {checkoutTime && <li>Check-out: {checkoutTime}</li>}
            {rules.slice(0, 3).map((r, i) => (
              <li key={i}>{r.label}: {r.value}</li>
            ))}
            {!checkInWindow && !checkoutTime && rules.length === 0 && (
              <li>House rules shared before check-in.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-[13.5px] font-bold text-[#0B1B3F] mb-2">Cancellation policy</p>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            {STAY_POLICY_LABEL[cancellationPolicy ?? ""] ?? "Direct booking policy"}. Full schedule shown at checkout before payment.
          </p>
        </div>
        <div>
          <p className="text-[13.5px] font-bold text-[#0B1B3F] mb-2">Health &amp; safety</p>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            {complianceStatus === "passed"
              ? "Licence verified by Propvora. Payment is secured in escrow until check-in."
              : "Payment is held securely until check-in. Ask the host about local licensing."}
          </p>
        </div>
      </div>
    </section>
  )
}
