"use client"

import Link from "next/link"
import { Info, ScrollText } from "lucide-react"
import { getPolicy, type PolicySlug } from "@/lib/legal/policies"

/**
 * PolicyBanner — a lightweight inline notice shown above a marketplace flow
 * (checkout, listing publish, booking) reminding the user which policies apply
 * and linking to them, with the current version + jurisdiction note.
 *
 * Responsive: a compact single-line variant on mobile, an expanded variant with
 * per-policy links from `sm` up. No Tailwind `dark:` classes.
 */
export interface PolicyBannerProps {
  slugs: PolicySlug[]
  /** Optional intro sentence; a sensible default is used otherwise. */
  message?: string
  className?: string
}

export default function PolicyBanner({ slugs, message, className }: PolicyBannerProps) {
  const policies = slugs.map(getPolicy).filter(Boolean) as NonNullable<
    ReturnType<typeof getPolicy>
  >[]
  if (!policies.length) return null

  const reviewed = policies.every((p) => p.jurisdictions.includes("GB"))

  return (
    <div
      className={`rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4 ${className ?? ""}`}
    >
      {/* Mobile: compact */}
      <div className="flex items-start gap-2 sm:hidden">
        <ScrollText className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
        <p className="text-xs leading-relaxed text-blue-900">
          {message ?? "By continuing you accept the marketplace policies."}{" "}
          {policies.map((p, i) => (
            <span key={p.slug}>
              <Link href={p.href} className="font-medium underline">
                {p.title}
              </Link>
              {i < policies.length - 1 ? ", " : ""}
            </span>
          ))}
          .
        </p>
      </div>

      {/* sm+ : expanded with chips */}
      <div className="hidden sm:block">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="min-w-0">
            <p className="text-sm leading-relaxed text-blue-900">
              {message ??
                "These policies govern this transaction. Propvora facilitates the marketplace; the contract for the stay or service is with the operator or supplier."}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {policies.map((p) => (
                <Link
                  key={p.slug}
                  href={p.href}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:border-blue-300 hover:text-blue-800"
                >
                  {p.title}
                  <span className="text-blue-400">v{p.currentVersion}</span>
                </Link>
              ))}
            </div>
            {!reviewed && (
              <p className="mt-2 text-xs text-blue-700">
                General terms — your local law may vary.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
