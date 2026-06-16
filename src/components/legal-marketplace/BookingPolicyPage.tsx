import { COMPANY, companyAttribution } from "@/lib/legal/company"
import {
  getBookingPolicy,
  type BookingPolicySlug,
  type LegalBlock,
} from "@/lib/legal/booking-policies"
import LegalLayout from "@/components/marketing/LegalLayout"
import { LegalCallout } from "./LegalPrimitives"

/**
 * Single renderer for every booking/host legal page. A page file just does
 * `<BookingPolicyPage slug="booking-terms" />` — the title, version, effective
 * date, facilitator framing, jurisdiction note, plain-English body and entity
 * footer are all driven from the booking-policies registry (the same source of
 * truth recorded on acceptance), so the page and the acceptance snapshot can
 * never drift. No Tailwind `dark:` classes (project rule).
 */

function renderBlock(block: LegalBlock, i: number) {
  switch (block.kind) {
    case "h2":
      return (
        <h2
          key={i}
          className="text-xl font-bold text-slate-900 mt-8 mb-3"
        >
          {block.text}
        </h2>
      )
    case "ul":
      return (
        <ul
          key={i}
          className="list-disc pl-5 space-y-1.5 text-slate-700 leading-relaxed text-sm my-3"
        >
          {block.items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ul>
      )
    case "p":
    default:
      return (
        <p key={i} className="text-slate-700 leading-relaxed text-sm my-3">
          {block.text}
        </p>
      )
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z")
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

const AUDIENCE_LABEL: Record<string, string> = {
  guest: "For guests",
  host: "For hosts & property managers",
  both: "For guests & hosts",
}

export function BookingPolicyPage({ slug }: { slug: BookingPolicySlug }) {
  const policy = getBookingPolicy(slug)
  if (!policy) return null

  return (
    <LegalLayout title={policy.title} lastUpdated={formatDate(policy.effectiveFrom)}>
      {/* Meta */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Version {policy.currentVersion}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Effective {formatDate(policy.effectiveFrom)}
          </span>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-200">
            {AUDIENCE_LABEL[policy.audience] ?? "For guests & hosts"}
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            Reviewed for {policy.jurisdictions.join(", ")}
          </span>
        </div>

        <LegalCallout type="warning">
          <strong>Jurisdiction.</strong> This document has been reviewed for{" "}
          <strong>Great Britain ({policy.jurisdictions.join(", ")})</strong>, our
          primary operating jurisdiction. If you book or host from another
          country, these are general terms and your local laws — particularly
          consumer-protection, property, licensing and tax laws — may apply and
          may differ. Nothing here is legal advice; seek qualified advice for
          your situation.
        </LegalCallout>
      </div>

      {/* Body */}
      <div>{policy.body.map((b, i) => renderBlock(b, i))}</div>

      {/* Entity footer */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <p className="text-slate-600 text-sm mb-3">
          Questions about this document? Contact us at{" "}
          <a
            href={`mailto:${COMPANY.emails.legal}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {COMPANY.emails.legal}
          </a>
          .
        </p>
        <p className="text-slate-500 text-xs leading-relaxed">
          {companyAttribution()}
        </p>
      </div>
    </LegalLayout>
  )
}
