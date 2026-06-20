import { ShieldCheck } from "lucide-react"

export default function CheckoutSecurityNote() {
  return (
    <div className="px-6 sm:px-8 py-4 flex items-start gap-2.5 bg-emerald-50 border-b border-emerald-100">
      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      <p className="text-[12.5px] leading-relaxed text-emerald-700">
        Your payment is held securely in escrow until check-in. We never release funds to the host until
        your stay is confirmed and completed.
      </p>
    </div>
  )
}
