import { CheckCircle2 } from "lucide-react"

interface Props {
  description: string | null | undefined
  features: string[]
  isStay: boolean
}

/** About / description card on the listing detail page. */
export default function StayDescriptionSection({ description, features, isStay }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-[15px] font-bold text-slate-900 mb-2">
        About this {isStay ? "stay" : "listing"}
      </h2>
      {description ? (
        <p className="text-[13.5px] leading-relaxed text-slate-600 whitespace-pre-line">{description}</p>
      ) : (
        <p className="text-[13px] text-slate-400 italic">The seller hasn&apos;t added a description yet.</p>
      )}
      {features.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {features.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
