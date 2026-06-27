import type { ReactNode } from "react"

/**
 * Shared presentation primitives for the marketplace legal pages. Matches the
 * styling of the existing SaaS legal pages (numbered sections + callouts) so
 * the marketplace policies are visually consistent with /legal/terms etc.
 * No Tailwind `dark:` classes (project rule).
 */

export function LegalSection({
  num,
  title,
  children,
}: {
  num: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-baseline gap-2">
        <span className="text-[var(--brand)] text-base font-bold">{num}.</span>
        {title}
      </h2>
      <div className="space-y-4 text-slate-700 leading-relaxed text-sm [&_a]:text-[var(--brand)] [&_a:hover]:text-[var(--brand)] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:font-semibold [&_strong]:text-slate-900">
        {children}
      </div>
    </div>
  )
}

export function LegalCallout({
  type = "info",
  children,
}: {
  type?: "warning" | "info"
  children: ReactNode
}) {
  const styles = {
    warning: "bg-amber-50 border-amber-300 text-amber-900",
    info: "bg-[var(--brand-soft)] border-[var(--color-brand-300)] text-[var(--brand-strong)]",
  }
  return (
    <div
      className={`p-4 rounded-xl border-l-4 ${styles[type]} text-sm leading-relaxed my-4`}
    >
      {children}
    </div>
  )
}
