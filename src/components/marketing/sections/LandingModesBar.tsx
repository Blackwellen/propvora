const modes = [
  "Buy-to-let",
  "HMO",
  "Serviced accommodation",
  "Rent-to-rent",
  "Student lets",
  "Commercial",
  "Mixed portfolios",
]

export default function LandingModesBar() {
  return (
    <section className="border-y border-slate-200 bg-white py-7">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 sm:px-6">
        <span className="mr-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Built around how you operate</span>
        {modes.map((mode) => (
          <span key={mode} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            {mode}
          </span>
        ))}
      </div>
    </section>
  )
}
