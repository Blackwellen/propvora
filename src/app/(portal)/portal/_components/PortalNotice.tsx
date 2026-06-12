import Image from "next/image"
import { Lock, AlertCircle, Ban, KeyRound } from "lucide-react"

type Tone = "neutral" | "warning" | "danger"
type IconKind = "lock" | "alert" | "ban" | "key"

const ICONS = { lock: Lock, alert: AlertCircle, ban: Ban, key: KeyRound }

// A safe, data-free notice page used for login / expired / revoked states.
// Generic copy only — never reveals whether a token existed or why it failed.
export function PortalNotice({
  icon = "lock",
  tone = "neutral",
  title,
  message,
}: {
  icon?: IconKind
  tone?: Tone
  title: string
  message: string
}) {
  const Icon = ICONS[icon]
  const toneCls =
    tone === "danger"
      ? "bg-[#FEF2F2] text-[#dc2626]"
      : tone === "warning"
        ? "bg-[#FFFBEB] text-[#d97706]"
        : "bg-[#EFF6FF] text-[#2563EB]"

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center">
        <div className="relative h-7 w-[140px] mx-auto mb-6">
          <Image
            src="/propvora-logo-dark.png"
            alt="Propvora"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div
          className={`w-12 h-12 rounded-full ${toneCls} flex items-center justify-center mx-auto mb-4`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{message}</p>
      </div>
      <p className="text-xs text-slate-400 mt-6">Secured by Propvora</p>
    </main>
  )
}
