import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function WalkthroughCta() {
  return (
    <section className="pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Ready to try it on your own portfolio?
          </h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto">
            Create a free workspace and choose to start blank or explore with realistic
            demo data. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-white/70 transition-colors"
            >
              Explore all features
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
