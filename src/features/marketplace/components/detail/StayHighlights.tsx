import { Award, KeyRound, Wifi, CalendarCheck } from "lucide-react"

interface StayHighlightsProps {
  hostName: string | null
  hasSelfCheckin: boolean
  hasWifi: boolean
  bookingMode: string | null
}

export default function StayHighlights({
  hostName,
  hasSelfCheckin,
  hasWifi,
  bookingMode,
}: StayHighlightsProps) {
  const hasAny = hostName || hasSelfCheckin || hasWifi || bookingMode === "instant"
  if (!hasAny) return null

  return (
    <div className="py-7 border-b border-slate-200 space-y-4">
      {hostName && (
        <div className="flex items-start gap-4">
          <Award className="w-8 h-8 text-[#0B1B3F] shrink-0 mt-0.5" />
          <div>
            <p className="text-[15px] font-semibold text-[#0B1B3F]">Managed by {hostName}</p>
            <p className="text-[13px] text-slate-500">Professional property manager verified on Propvora</p>
          </div>
        </div>
      )}
      {hasSelfCheckin && (
        <div className="flex items-start gap-4">
          <KeyRound className="w-8 h-8 text-[#0B1B3F] shrink-0 mt-0.5" />
          <div>
            <p className="text-[15px] font-semibold text-[#0B1B3F]">Self check-in</p>
            <p className="text-[13px] text-slate-500">Check yourself in with the keybox or lockbox.</p>
          </div>
        </div>
      )}
      {hasWifi && (
        <div className="flex items-start gap-4">
          <Wifi className="w-8 h-8 text-[#0B1B3F] shrink-0 mt-0.5" />
          <div>
            <p className="text-[15px] font-semibold text-[#0B1B3F]">Fast Wi-Fi</p>
            <p className="text-[13px] text-slate-500">Wifi is included — great for remote work.</p>
          </div>
        </div>
      )}
      {bookingMode === "instant" && (
        <div className="flex items-start gap-4">
          <CalendarCheck className="w-8 h-8 text-[#0B1B3F] shrink-0 mt-0.5" />
          <div>
            <p className="text-[15px] font-semibold text-[#0B1B3F]">Instant confirmation</p>
            <p className="text-[13px] text-slate-500">Your booking is confirmed the moment you complete payment.</p>
          </div>
        </div>
      )}
    </div>
  )
}
