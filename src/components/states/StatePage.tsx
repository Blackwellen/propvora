import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { COMPANY } from "@/lib/legal/company"

export interface StatePageAction {
  /** Visible label for the action. */
  label: string
  /** Internal route or absolute URL. */
  href: string
  /** Primary (filled blue) or secondary (outline) styling. */
  variant?: "primary" | "secondary"
}

export interface StatePageProps {
  /** lucide-react icon component rendered in the badge. */
  icon: LucideIcon
  /** Short headline, e.g. "Subscription inactive". */
  title: string
  /** One or two sentences explaining the state in plain English. */
  description: string
  /** Optional accent colour family for the icon badge. Defaults to blue. */
  tone?: "blue" | "amber" | "rose" | "slate"
  /** Action buttons (first is rendered as primary unless overridden). */
  actions?: StatePageAction[]
  /** When true, show the "Contact support" helper line. Defaults to true. */
  showSupport?: boolean
}

const toneMap: Record<
  NonNullable<StatePageProps["tone"]>,
  { bg: string; border: string; text: string }
> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
  rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-600" },
  slate: { bg: "bg-slate-100", border: "border-slate-200", text: "text-slate-600" },
}

/**
 * Full-page, on-brand state surface used for safe error / boundary screens
 * (404, subscription-inactive, portal-expired, etc.). No auth chrome — safe to
 * render in any context. Generic copy only; never surface stack traces or
 * secrets here.
 */
export default function StatePage({
  icon: Icon,
  title,
  description,
  tone = "blue",
  actions = [],
  showSupport = true,
}: StatePageProps) {
  const t = toneMap[tone]
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 sm:p-10">
          <div
            className={`mx-auto w-14 h-14 rounded-2xl ${t.bg} border ${t.border} flex items-center justify-center mb-6`}
          >
            <Icon className={`h-7 w-7 ${t.text}`} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
          <p className="text-slate-600 leading-relaxed mb-8">{description}</p>

          {actions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {actions.map((action, i) => {
                const variant =
                  action.variant ?? (i === 0 ? "primary" : "secondary")
                const isExternal = action.href.startsWith("http")
                const className =
                  variant === "primary"
                    ? "inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    : "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                return isExternal ? (
                  <a key={action.href} href={action.href} className={className}>
                    {action.label}
                  </a>
                ) : (
                  <Link key={action.href} href={action.href} className={className}>
                    {action.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {showSupport && (
          <p className="mt-6 text-sm text-slate-500">
            Need a hand? Email{" "}
            <a
              href={`mailto:${COMPANY.emails.support}`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {COMPANY.emails.support}
            </a>
          </p>
        )}
      </div>
    </main>
  )
}
