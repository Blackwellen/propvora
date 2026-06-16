/**
 * Reusable section-scoped loading skeleton. Rendered inside an authenticated
 * shell's content slot while a route segment streams in. Layout mirrors the
 * common page shape (header + KPI strip + content block) so the transition into
 * real content causes minimal layout shift.
 */
export default function SectionLoading({ label }: { label?: string }) {
  return (
    <div
      className="px-4 py-6 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label ?? "Loading…"}</span>

      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-7 w-24 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Content block */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-full animate-pulse rounded bg-slate-100"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
