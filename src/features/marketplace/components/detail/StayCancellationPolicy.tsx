import { STAY_POLICY_LABEL } from "@/components/booking/StayListingCard"

interface StayCancellationPolicyProps {
  cancellationPolicy: string | null
  isShortStay: boolean
}

export default function StayCancellationPolicy({
  cancellationPolicy,
  isShortStay,
}: StayCancellationPolicyProps) {
  if (!isShortStay) return null

  return (
    <section className="py-7 border-b border-slate-200">
      <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-3">Cancellation policy</h2>
      <div className="rounded-2xl border border-slate-200 px-5 py-4">
        <p className="text-[15px] font-semibold text-[#0B1B3F]">
          {STAY_POLICY_LABEL[cancellationPolicy ?? ""] ?? "Direct booking policy"}
        </p>
        <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
          The exact refund schedule is shown at checkout before you confirm and pay.
        </p>
      </div>
    </section>
  )
}
