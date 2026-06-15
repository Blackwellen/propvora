import { COMPANY, companyAttribution } from "@/lib/legal/company"
import { getPolicy, type PolicySlug } from "@/lib/legal/policies"
import { LegalCallout } from "./LegalPrimitives"

/**
 * Standard intro block for a marketplace legal page: version + effective date,
 * the facilitator framing, the reviewed-jurisdiction note, and the
 * Blackwellen Ltd entity line — all sourced from src/lib/legal/company.ts and
 * src/lib/legal/policies.ts (single sources of truth).
 */
export function PolicyIntro({ slug }: { slug: PolicySlug }) {
  const policy = getPolicy(slug)
  if (!policy) return null
  return (
    <div className="mb-10">
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Version {policy.currentVersion}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Effective {formatDate(policy.effectiveFrom)}
        </span>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
          Reviewed for {policy.jurisdictions.join(", ")}
        </span>
      </div>

      <LegalCallout type="info">
        <strong>Propvora&rsquo;s role.</strong> Propvora is a marketplace and
        software platform operated by {COMPANY.legalName}. We facilitate
        discovery, messaging and payments between users. We are{" "}
        <strong>not</strong> the property owner, host, operator, supplier,
        contractor, travel agent, insurer, solicitor or tax adviser. The
        contract for any stay or service is between you and the operator or
        supplier providing it. Where payments are taken, we facilitate them as a
        payment intermediary using Stripe (including Stripe Connect for payouts);
        Propvora is not a bank and does not provide regulated financial services.
      </LegalCallout>

      <LegalCallout type="warning">
        <strong>Jurisdiction.</strong> This document has been reviewed for{" "}
        <strong>Great Britain ({policy.jurisdictions.join(", ")})</strong>, which
        is our primary operating jurisdiction. If you use the marketplace from
        another country, these are general terms and your local laws —
        particularly consumer-protection, property, licensing and tax laws — may
        apply and may differ. Nothing in this document is legal advice to you;
        seek qualified advice for your situation.
      </LegalCallout>
    </div>
  )
}

/** Standard entity + contact footer for a marketplace legal page. */
export function PolicyEntityFooter() {
  return (
    <div className="mt-12 pt-8 border-t border-slate-200">
      <p className="text-slate-600 text-sm mb-3">
        Questions about this policy? Contact us at{" "}
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
  )
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
