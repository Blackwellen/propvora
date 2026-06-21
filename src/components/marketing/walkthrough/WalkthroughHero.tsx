export default function WalkthroughHero() {
  return (
    <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-5 border border-blue-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/propvora-favicon.png" alt="" aria-hidden className="h-3.5 w-3.5 object-contain" />
          Product walkthrough
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight tracking-tight">
          See how Propvora runs your operations
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Follow the path most operators take when they move onto Propvora — from first
          property to a fully connected workspace. Every step below maps to a real part of
          the product.
        </p>
      </div>
    </section>
  )
}
