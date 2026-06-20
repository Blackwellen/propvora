import { CalendarDays, CreditCard, Lock, ShieldCheck } from "lucide-react"

const STEPS = [
  {
    icon: CalendarDays,
    title: "Choose your dates",
    body: "Select check-in and check-out dates. Availability is live — blocked dates reflect real reservations.",
  },
  {
    icon: CreditCard,
    title: "See the full price",
    body: "Your total — including all fees — is shown before you confirm. No surprises at payment.",
  },
  {
    icon: Lock,
    title: "Secure payment",
    body: "Pay by card. Funds are held in escrow until your stay completes, then released to the host.",
  },
  {
    icon: ShieldCheck,
    title: "Confirmation",
    body: "You receive a booking reference immediately. The property manager confirms your stay and sends arrival details.",
  },
]

export default function CheckoutHowItWorks() {
  return (
    <div className="px-6 sm:px-8 py-7 space-y-5">
      <h2 className="text-[15px] font-bold text-[#0B1B3F]">How booking works</h2>
      <ol className="space-y-5">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={i} className="flex items-start gap-4">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5" />
            </span>
            <span>
              <span className="block text-[14px] font-semibold text-[#0B1B3F]">{title}</span>
              <span className="block text-[13px] text-slate-500 leading-relaxed mt-0.5">{body}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
