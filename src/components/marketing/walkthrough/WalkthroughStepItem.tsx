import type { LucideIcon } from "lucide-react"

interface WalkthroughStepItemProps {
  icon: LucideIcon
  title: string
  body: string
  stepNumber: number
  isLast: boolean
}

export default function WalkthroughStepItem({
  icon: Icon,
  title,
  body,
  stepNumber,
  isLast,
}: WalkthroughStepItemProps) {
  return (
    <li className="relative flex gap-5">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[27px] top-14 bottom-[-2rem] w-px bg-slate-200"
        />
      )}
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
        <Icon className="h-6 w-6 text-blue-600" />
        <span className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white">
          {stepNumber}
        </span>
      </div>
      <div className="pt-1">
        <h2 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h2>
        <p className="text-slate-600 leading-relaxed">{body}</p>
      </div>
    </li>
  )
}
