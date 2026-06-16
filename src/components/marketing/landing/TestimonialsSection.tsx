import { Quote } from "lucide-react"

/**
 * Testimonials are PLACEHOLDERS only. These are illustrative quotes describing
 * the kind of outcome Propvora is built to deliver — they are not attributed to
 * real customers and must be replaced with verified, consented reviews before
 * being presented as genuine testimonials.
 */
const PLACEHOLDERS = [
  {
    quote:
      "We replaced three separate tools and a stack of spreadsheets with one workspace. Compliance renewals no longer slip through the cracks.",
    role: "Portfolio operator",
    context: "Illustrative outcome",
  },
  {
    quote:
      "Inviting a verified contractor to a job and tracking it to completion now takes minutes, not days of back-and-forth.",
    role: "Lettings manager",
    context: "Illustrative outcome",
  },
  {
    quote:
      "Running serviced accommodation and long-term lets from a single platform finally makes our month-end numbers add up.",
    role: "Serviced accommodation host",
    context: "Illustrative outcome",
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            Placeholder — example quotes, not real reviews
          </span>
        </div>
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h2 className="text-[32px] sm:text-[44px] font-bold text-[#06122F] leading-tight mb-4">
            Built for the way operators actually work
          </h2>
          <p className="text-[15px] text-slate-500 leading-relaxed">
            The quotes below illustrate the outcomes Propvora is designed for. We&apos;ll replace
            them with verified customer stories as they come in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLACEHOLDERS.map((t, i) => (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-7"
            >
              <Quote className="h-7 w-7 text-blue-200 mb-4" />
              <p className="text-[15px] text-slate-700 leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                  —
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-slate-700">{t.role}</div>
                  <div className="text-[11px] text-slate-400">{t.context}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
